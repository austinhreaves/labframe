import { create } from 'zustand';

import { getResponseModes, type ResponseMode } from '@/domain/calculationResponse';
import type { FieldValue, Lab, NumericRow, Section, TableData, TableRow } from '@/domain/schema';
import {
  CURRENT_PERSISTED_SCHEMA_VERSION,
  attachLabPersistence,
  migratePersistedLabState,
} from '@/state/persistence/labPersistenceMiddleware';
import { browserPersistenceAdapter } from '@/state/persistence/browserAdapter';
import { makeImageKey, makeLabKey, parseImageKey, parseLabKey } from '@/state/persistence/keys';
import type {
  PersistedImageMeta,
  PersistedLabState,
  PersistenceAdapter,
} from '@/state/persistence/types';

type FitSelection = {
  model: string;
  parameters: Record<string, number>;
};

type RuntimeImage = PersistedImageMeta & {
  objectUrl: string;
  persisted: boolean;
  sha256?: string;
};

export type RecoverableAttachment = {
  key: string;
  labId: string;
  imageId: string;
  bytes: number;
};

type LabStoreStatus = {
  submitted: boolean;
  lastSavedAt: number;
  lastError: string | null;
};

export type LabStoreState = {
  courseId: string;
  labId: string;
  studentName: string;
  taName: string;
  aiUsed: boolean;
  aiSharedLinks: string;
  integrityAgreementAccepted: boolean;
  integrityAgreementAcceptedAt: number;
  lab: Lab | null;
  fields: Record<string, FieldValue>;
  tables: Record<string, TableData>;
  selectedFits: Record<string, string | null>;
  images: Record<string, RuntimeImage>;
  fits: Record<string, FitSelection>;
  responseSelections: Record<string, ResponseMode>;
  splitFraction: number;
  simSide: 'left' | 'right';
  status: LabStoreStatus;
  initLab: (courseId: string, labId: string, lab: Lab) => Promise<void>;
  setStudentName: (studentName: string) => Promise<void>;
  setTaName: (value: string) => void;
  setAiUsed: (value: boolean) => void;
  setAiSharedLinks: (value: string) => void;
  setIntegrityAgreementAccepted: (value: boolean) => void;
  setField: (fieldId: string, value: FieldValue) => void;
  setTableCell: (tableId: string, rowIndex: number, columnId: string, value: FieldValue) => void;
  setSelectedFit: (plotId: string, fitId: string | null) => void;
  setImage: (imageId: string, file: File | null) => void;
  setResponseSelection: (fieldId: string, mode: ResponseMode) => void;
  setFitSelection: (plotId: string, fit: FitSelection | null) => void;
  setSplitFraction: (value: number) => void;
  setSimSide: (value: 'left' | 'right') => void;
  setSubmitted: (value: boolean) => void;
  clearCurrentLab: () => Promise<void>;
  listRecoverableAttachments: () => Promise<RecoverableAttachment[]>;
  deleteRecoverableAttachment: (key: string) => Promise<void>;
};

const DEFAULT_STUDENT_NAME = 'Student';
const DEFAULT_SPLIT_FRACTION = 0.6;
const DEFAULT_SIM_SIDE = 'left' as const;
export const PROCESS_RECORD_EVENT_NAME = 'lab:process-record';

type FitSelectionProcessRecordEvent = {
  type: 'fit_selection';
  plotId: string;
  fitId: string | null;
  timestamp: number;
};

function now(): number {
  return Date.now();
}

function emitProcessRecordEvent(detail: FitSelectionProcessRecordEvent): void {
  if (typeof window === 'undefined') {
    return;
  }
  window.dispatchEvent(new CustomEvent(PROCESS_RECORD_EVENT_NAME, { detail }));
}

export function createEmptyFieldValue(text = ''): FieldValue {
  return {
    text,
    pastes: [],
    meta: {
      activeMs: 0,
      keystrokes: 0,
      deletes: 0,
      firstFocusAt: undefined,
      lastEditAt: undefined,
    },
  };
}

function parseNumber(input: string): number {
  const parsed = Number.parseFloat(input);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toNumericRow(row: TableRow): NumericRow {
  const numeric: NumericRow = {};
  for (const [key, value] of Object.entries(row)) {
    numeric[key] = parseNumber(value.text);
  }
  return numeric;
}

function initTablesFromSchema(sections: Section[]): Record<string, TableData> {
  const tables: Record<string, TableData> = {};

  for (const section of sections) {
    if (section.kind !== 'dataTable') {
      continue;
    }

    const rows: TableData = Array.from({ length: section.rowCount }, () => {
      const row: TableRow = {};
      for (const column of section.columns) {
        row[column.id] = createEmptyFieldValue();
      }
      return row;
    });
    tables[section.tableId] = rows;
  }

  return tables;
}

function initFieldsFromSchema(sections: Section[]): Record<string, FieldValue> {
  const fields: Record<string, FieldValue> = {};

  for (const section of sections) {
    if (
      section.kind === 'objective' ||
      section.kind === 'measurement' ||
      section.kind === 'concept'
    ) {
      fields[section.fieldId] = createEmptyFieldValue();
      continue;
    }

    if (section.kind === 'calculation') {
      // Image-mode sections store their answer as a blob in store.images, not a text field.
      if (section.responseMode !== 'image') {
        fields[section.fieldId] = createEmptyFieldValue();
      }
      continue;
    }

    if (section.kind === 'multiMeasurement') {
      for (const row of section.rows) {
        fields[row.id] = createEmptyFieldValue();
      }
      continue;
    }

    if (section.kind === 'image') {
      fields[section.captionFieldId] = createEmptyFieldValue();
    }
  }

  return fields;
}

function initResponseSelectionsFromSchema(sections: Section[]): Record<string, ResponseMode> {
  const selections: Record<string, ResponseMode> = {};
  for (const section of sections) {
    if (section.kind !== 'calculation') {
      continue;
    }
    const modes = getResponseModes(section);
    if (modes) {
      // Default a selectable section to its first listed mode; authors order the
      // array intentionally (e.g. text first so typed answers are the default).
      selections[section.fieldId] = modes[0]!;
    }
  }
  return selections;
}

function recomputeDerivedColumns(lab: Lab, tableId: string, row: TableRow): TableRow {
  const section = lab.sections.find(
    (candidate) => candidate.kind === 'dataTable' && candidate.tableId === tableId,
  );
  if (!section || section.kind !== 'dataTable') {
    return row;
  }

  const nextRow = { ...row };
  const numeric = toNumericRow(nextRow);

  for (const column of section.columns) {
    if (column.kind !== 'derived') {
      continue;
    }

    const value = column.formula(numeric);
    const rounded =
      column.precision === undefined ? value : Number(value.toFixed(column.precision));
    numeric[column.id] = rounded;
    nextRow[column.id] = createEmptyFieldValue(String(rounded));
  }

  return nextRow;
}

function revokeImageObjectUrls(images: Record<string, RuntimeImage>): void {
  for (const image of Object.values(images)) {
    URL.revokeObjectURL(image.objectUrl);
  }
}

function clampSplitFraction(value: number): number {
  return Math.max(0.25, Math.min(0.75, value));
}

function sameFitSelection(left: FitSelection | undefined, right: FitSelection): boolean {
  if (!left || left.model !== right.model) {
    return false;
  }
  const leftEntries = Object.entries(left.parameters);
  const rightEntries = Object.entries(right.parameters);
  if (leftEntries.length !== rightEntries.length) {
    return false;
  }
  return rightEntries.every(([key, value]) => left.parameters[key] === value);
}

function serializePersistedState(state: LabStoreState, savedAt: number): PersistedLabState {
  const images = Object.fromEntries(
    Object.entries(state.images)
      .filter(([, image]) => image.persisted)
      .map(([imageId, image]) => [
        imageId,
        {
          idbKey: image.idbKey,
          mime: image.mime,
          bytes: image.bytes,
          fileName: image.fileName,
          ...(image.sha256 ? { sha256: image.sha256 } : {}),
        },
      ]),
  );

  return {
    schemaVersion: CURRENT_PERSISTED_SCHEMA_VERSION,
    courseId: state.courseId,
    labId: state.labId,
    studentName: state.studentName,
    aiUsed: state.aiUsed,
    aiSharedLinks: state.aiSharedLinks,
    fields: state.fields,
    tables: state.tables,
    selectedFits: state.selectedFits,
    fits: state.fits,
    responseSelections: state.responseSelections,
    images,
    splitFraction: state.splitFraction,
    status: {
      submitted: state.status.submitted,
      lastSavedAt: savedAt,
    },
  };
}

function fieldValueHasWork(value: unknown): boolean {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const fv = value as {
    text?: unknown;
    pastes?: unknown[];
    meta?: { activeMs?: number; keystrokes?: number };
  };
  if (typeof fv.text === 'string' && fv.text.trim().length > 0) {
    return true;
  }
  if (Array.isArray(fv.pastes) && fv.pastes.length > 0) {
    return true;
  }
  return (fv.meta?.activeMs ?? 0) > 0 || (fv.meta?.keystrokes ?? 0) > 0;
}

/**
 * Whether a persisted payload contains anything a student actually did, as
 * opposed to the untouched defaults initLab writes. Used to keep placeholder
 * ("Student") records that hold no work from overwriting a real record during
 * a rename migration: initLab's reset queues a debounced persist, and when the
 * on-load rename takes longer than the debounce that persist lands an empty
 * payload under the placeholder key. Treating such payloads as migratable data
 * clobbers the student's named record on the next load.
 */
function payloadHasStudentWork(payload: PersistedLabState): boolean {
  if (payload.status?.submitted) {
    return true;
  }
  if (payload.aiUsed || (payload.aiSharedLinks ?? '').trim().length > 0) {
    return true;
  }
  if (Object.keys(payload.images ?? {}).length > 0) {
    return true;
  }
  if (Object.keys(payload.fits ?? {}).length > 0) {
    return true;
  }
  if (Object.values(payload.selectedFits ?? {}).some((fitId) => fitId !== null)) {
    return true;
  }
  if (Object.values(payload.fields ?? {}).some(fieldValueHasWork)) {
    return true;
  }
  for (const table of Object.values(payload.tables ?? {})) {
    if (
      Array.isArray(table) &&
      table.some((row) =>
        Object.values((row ?? {}) as Record<string, unknown>).some(fieldValueHasWork),
      )
    ) {
      return true;
    }
  }
  return false;
}

async function migrateStudentKeys(
  adapter: PersistenceAdapter,
  courseId: string,
  previousName: string,
  nextName: string,
): Promise<void> {
  const [labKeys, imageKeys] = await Promise.all([
    adapter.listKeys(`lab:${courseId}:`),
    adapter.listKeys(`img:${courseId}:`),
  ]);

  for (const key of labKeys) {
    const parsed = parseLabKey(key);
    if (!parsed || parsed.studentName !== previousName) {
      continue;
    }

    const payload = await adapter.loadJSON<PersistedLabState>(key);
    if (payload) {
      const nextKey = makeLabKey({
        courseId: parsed.courseId,
        labId: parsed.labId,
        studentName: nextName,
      });
      // A workless payload only overwrites the destination when nothing is
      // there yet; see payloadHasStudentWork. Either way the source key is
      // deleted below, so a stale artifact cannot clobber on a later load.
      const destination = payloadHasStudentWork(payload)
        ? null
        : await adapter.loadJSON<PersistedLabState>(nextKey);
      if (!destination) {
        await adapter.saveJSON(nextKey, {
          ...payload,
          studentName: nextName,
        });
      }
    }
    await adapter.deleteJSON(key);
  }

  for (const key of imageKeys) {
    const parsed = parseImageKey(key);
    if (!parsed || parsed.studentName !== previousName) {
      continue;
    }

    const blob = await adapter.loadBlob(key);
    if (blob) {
      const nextKey = makeImageKey(
        {
          courseId: parsed.courseId,
          labId: parsed.labId,
          studentName: nextName,
        },
        parsed.imageId,
      );
      await adapter.saveBlob(nextKey, blob);
    }
    await adapter.deleteBlob(key);
  }
}

export function createLabStore(adapter: PersistenceAdapter = browserPersistenceAdapter) {
  const useStore = create<LabStoreState>((set, get) => ({
    courseId: '',
    labId: '',
    studentName: DEFAULT_STUDENT_NAME,
    taName: '',
    aiUsed: false,
    aiSharedLinks: '',
    integrityAgreementAccepted: false,
    integrityAgreementAcceptedAt: 0,
    lab: null,
    fields: {},
    tables: {},
    selectedFits: {},
    images: {},
    fits: {},
    responseSelections: {},
    splitFraction: DEFAULT_SPLIT_FRACTION,
    simSide: DEFAULT_SIM_SIDE,
    status: {
      submitted: false,
      lastSavedAt: 0,
      lastError: null,
    },
    initLab: async (courseId, labId, lab) => {
      const previousImages = get().images;
      revokeImageObjectUrls(previousImages);

      const defaults = {
        fields: initFieldsFromSchema(lab.sections),
        tables: initTablesFromSchema(lab.sections),
        aiUsed: false,
        aiSharedLinks: '',
        selectedFits: {},
        images: {},
        fits: {},
        responseSelections: initResponseSelectionsFromSchema(lab.sections),
        splitFraction: DEFAULT_SPLIT_FRACTION,
        simSide: DEFAULT_SIM_SIDE,
      };

      set({
        courseId,
        labId,
        lab,
        integrityAgreementAccepted: false,
        integrityAgreementAcceptedAt: 0,
        ...defaults,
      });

      const studentName = get().studentName;
      const key = makeLabKey({ courseId, labId, studentName });
      const persisted = await adapter.loadJSON<unknown>(key);
      if (!persisted) {
        set((state) => ({
          status: {
            ...state.status,
            submitted: false,
            lastSavedAt: 0,
          },
        }));
        return;
      }
      const migrated = migratePersistedLabState(persisted, key);
      if (!migrated) {
        set((state) => ({
          status: {
            ...state.status,
            submitted: false,
            lastSavedAt: 0,
          },
        }));
        return;
      }

      // Hydrate the JSON slices before touching IndexedDB: the reset above
      // already queued a debounced persist, so every await between here and
      // this set is a window where that timer can overwrite the saved record
      // with the defaults. Blob loads are slow and can reject; they must not
      // delay or veto the text answers. Image metadata is included now (with a
      // placeholder object URL) so a persist that fires mid-hydration keeps
      // the image references; the real object URLs land in a second set below.
      const imageMetas = Object.entries(migrated.images ?? {});
      set((state) => ({
        aiUsed: migrated.aiUsed ?? false,
        aiSharedLinks: migrated.aiSharedLinks ?? '',
        fields: {
          ...state.fields,
          ...(migrated.fields as Record<string, FieldValue>),
        },
        tables: {
          ...state.tables,
          ...(migrated.tables as Record<string, TableData>),
        },
        selectedFits: {
          ...state.selectedFits,
          ...migrated.selectedFits,
        },
        fits: {
          ...state.fits,
          ...migrated.fits,
        },
        responseSelections: {
          ...state.responseSelections,
          ...(migrated.responseSelections ?? {}),
        },
        images: Object.fromEntries(
          imageMetas.map(([imageId, imageMeta]) => [
            imageId,
            { ...imageMeta, objectUrl: '', persisted: true },
          ]),
        ),
        splitFraction: DEFAULT_SPLIT_FRACTION,
        status: {
          ...state.status,
          submitted: migrated.status?.submitted ?? false,
          lastSavedAt: migrated.status?.lastSavedAt ?? 0,
          lastError: null,
        },
      }));

      if (imageMetas.length === 0) {
        return;
      }

      const hydratedImages: Record<string, RuntimeImage> = {};
      for (const [imageId, imageMeta] of imageMetas) {
        let blob: Blob | null = null;
        try {
          blob = await adapter.loadBlob(imageMeta.idbKey);
        } catch {
          // A broken IndexedDB (private mode, eviction, corruption) must not
          // reject hydration; the text answers above are already in place.
          blob = null;
        }
        if (!blob) {
          continue;
        }
        hydratedImages[imageId] = {
          ...imageMeta,
          objectUrl: URL.createObjectURL(blob),
          persisted: true,
        };
      }
      set({ images: hydratedImages });
    },
    setStudentName: async (studentName) => {
      const nextName = studentName.trim();
      if (!nextName) {
        return;
      }

      const current = get();
      if (nextName === current.studentName) {
        return;
      }

      try {
        await migrateStudentKeys(adapter, current.courseId, current.studentName, nextName);
      } catch (error) {
        set((state) => ({
          status: {
            ...state.status,
            lastError: error instanceof Error ? error.message : 'Unable to migrate saved data.',
          },
        }));
        return;
      }

      set({ studentName: nextName });

      if (current.courseId && current.labId && current.lab) {
        await get().initLab(current.courseId, current.labId, current.lab);
      }
    },
    setTaName: (value) =>
      set({
        taName: value,
      }),
    setAiUsed: (value) =>
      set({
        aiUsed: value,
      }),
    setAiSharedLinks: (value) =>
      set({
        aiSharedLinks: value,
      }),
    setIntegrityAgreementAccepted: (value) =>
      set({
        integrityAgreementAccepted: value,
        integrityAgreementAcceptedAt: value ? now() : 0,
      }),
    setField: (fieldId, value) =>
      set((state) => ({
        fields: {
          ...state.fields,
          [fieldId]: value,
        },
      })),
    setTableCell: (tableId, rowIndex, columnId, value) =>
      set((state) => {
        const table = state.tables[tableId];
        if (!table || !state.lab) {
          return state;
        }

        const nextTable = [...table];
        const currentRow = nextTable[rowIndex];
        if (!currentRow) {
          return state;
        }

        const changedRow = {
          ...currentRow,
          [columnId]: value,
        };
        nextTable[rowIndex] = recomputeDerivedColumns(state.lab, tableId, changedRow);

        return {
          tables: {
            ...state.tables,
            [tableId]: nextTable,
          },
        };
      }),
    setSelectedFit: (plotId, fitId) => {
      const current = get().selectedFits[plotId] ?? null;
      if (current === fitId) {
        return;
      }
      set((state) => ({
        selectedFits: {
          ...state.selectedFits,
          [plotId]: fitId,
        },
      }));
      emitProcessRecordEvent({
        type: 'fit_selection',
        plotId,
        fitId,
        timestamp: now(),
      });
    },
    setImage: (imageId, file) => {
      const state = get();
      const previous = state.images[imageId];
      if (previous) {
        URL.revokeObjectURL(previous.objectUrl);
      }

      if (!file) {
        set((current) => {
          const nextImages = { ...current.images };
          delete nextImages[imageId];
          return { images: nextImages };
        });
        if (previous) {
          void adapter.deleteBlob(previous.idbKey);
        }
        return;
      }

      const identity = {
        courseId: state.courseId,
        labId: state.labId,
        studentName: state.studentName,
      };
      const idbKey = makeImageKey(identity, imageId);
      const mime = file.type || 'application/octet-stream';
      const bytes = file.size;
      const objectUrl = URL.createObjectURL(file);

      set((current) => ({
        images: {
          ...current.images,
          [imageId]: {
            idbKey,
            mime,
            bytes,
            fileName: file.name,
            objectUrl,
            persisted: false,
          },
        },
      }));

      void adapter
        .saveBlob(idbKey, file)
        .then(async () => {
          // Compute SHA-256 after the blob is safely stored. Failure here is
          // non-fatal: some environments (older browsers, test runners) do not
          // expose crypto.subtle or File.arrayBuffer.
          let sha256: string | undefined;
          try {
            const buf = await file.arrayBuffer();
            const hash = await crypto.subtle.digest('SHA-256', buf);
            sha256 = Array.from(new Uint8Array(hash))
              .map((b) => b.toString(16).padStart(2, '0'))
              .join('');
          } catch {
            // persist without hash
          }
          set((current) => {
            const image = current.images[imageId];
            if (!image || image.idbKey !== idbKey) {
              return current;
            }
            return {
              images: {
                ...current.images,
                [imageId]: { ...image, ...(sha256 ? { sha256 } : {}), persisted: true },
              },
            };
          });
        })
        .catch((error) => {
          set((current) => ({
            status: {
              ...current.status,
              lastError:
                error instanceof Error ? error.message : 'Unable to save image attachment.',
            },
          }));
        });
    },
    setResponseSelection: (fieldId, mode) =>
      // Switching modes only changes the selection; each mode's stored answer
      // (text field, draw key, image blob) is left untouched.
      set((state) => ({
        responseSelections: {
          ...state.responseSelections,
          [fieldId]: mode,
        },
      })),
    setFitSelection: (plotId, fit) =>
      set((state) => {
        if (fit === null) {
          if (!(plotId in state.fits)) {
            return state;
          }
          const nextFits = { ...state.fits };
          delete nextFits[plotId];
          return { fits: nextFits };
        }

        if (sameFitSelection(state.fits[plotId], fit)) {
          return state;
        }

        return {
          fits: {
            ...state.fits,
            [plotId]: fit,
          },
        };
      }),
    setSplitFraction: (value) =>
      set({
        splitFraction: clampSplitFraction(value),
      }),
    setSimSide: (value) =>
      set({
        simSide: value,
      }),
    setSubmitted: (value) =>
      set((state) => ({
        ...(value ? { integrityAgreementAccepted: false, integrityAgreementAcceptedAt: 0 } : {}),
        status: {
          ...state.status,
          submitted: value,
        },
      })),
    clearCurrentLab: async () => {
      const state = get();
      if (!state.courseId || !state.labId || !state.studentName || !state.lab) {
        return;
      }

      const labKey = makeLabKey({
        courseId: state.courseId,
        labId: state.labId,
        studentName: state.studentName,
      });
      await adapter.deleteJSON(labKey);

      const imagePrefix = `img:${state.courseId}:${state.labId}:${state.studentName}:`;
      const imageKeys = await adapter.listKeys(imagePrefix);
      await Promise.all(imageKeys.map((key) => adapter.deleteBlob(key)));

      revokeImageObjectUrls(state.images);
      set((current) => ({
        aiUsed: false,
        aiSharedLinks: '',
        integrityAgreementAccepted: false,
        integrityAgreementAcceptedAt: 0,
        fields: initFieldsFromSchema(current.lab?.sections ?? []),
        tables: initTablesFromSchema(current.lab?.sections ?? []),
        selectedFits: {},
        images: {},
        fits: {},
        responseSelections: initResponseSelectionsFromSchema(current.lab?.sections ?? []),
        splitFraction: DEFAULT_SPLIT_FRACTION,
        simSide: DEFAULT_SIM_SIDE,
        status: {
          ...current.status,
          submitted: false,
          lastSavedAt: 0,
          lastError: null,
        },
      }));
    },
    listRecoverableAttachments: async () => {
      const state = get();
      if (!state.courseId || !state.studentName) {
        return [];
      }

      const keys = await adapter.listKeys(`img:${state.courseId}:`);
      const attachments: RecoverableAttachment[] = [];

      for (const key of keys) {
        const parsed = parseImageKey(key);
        if (!parsed || parsed.studentName !== state.studentName || parsed.labId === state.labId) {
          continue;
        }
        const blob = await adapter.loadBlob(key);
        attachments.push({
          key,
          labId: parsed.labId,
          imageId: parsed.imageId,
          bytes: blob?.size ?? 0,
        });
      }

      attachments.sort((left, right) => right.bytes - left.bytes);
      return attachments;
    },
    deleteRecoverableAttachment: async (key) => {
      await adapter.deleteBlob(key);
    },
  }));

  const { flushPersistence } = attachLabPersistence(useStore, adapter, serializePersistedState);

  // Bypass the 250 ms debounce when the tab is going away, so a value banked
  // moments before unload (notably the leak-proof activeMs flush) still reaches
  // IndexedDB. These fire after the field-level flush has written activeMs into
  // the store (same synchronous event), so the flushed value is what persists.
  if (typeof window !== 'undefined') {
    window.addEventListener('pagehide', flushPersistence);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        flushPersistence();
      }
    });
  }

  return useStore;
}

export const useLabStore = createLabStore();

export type EditableTarget = {
  value: string;
  selectionStart: number | null;
};

export type EditableInputEvent = {
  inputType?: string;
  data?: string | null;
  isComposing?: boolean;
};

function extractInsertedSubstring(
  previousText: string,
  nextText: string,
  selectionStart: number | null,
  eventData?: string | null,
): { text: string; offset: number } {
  if (eventData && selectionStart !== null) {
    const caret = Math.max(0, Math.min(selectionStart, nextText.length));
    const offset = Math.max(0, caret - eventData.length);
    if (nextText.slice(offset, caret) === eventData) {
      return { text: eventData, offset };
    }
  }

  let start = 0;
  while (
    start < previousText.length &&
    start < nextText.length &&
    previousText[start] === nextText[start]
  ) {
    start += 1;
  }

  let prevEnd = previousText.length - 1;
  let nextEnd = nextText.length - 1;
  while (prevEnd >= start && nextEnd >= start && previousText[prevEnd] === nextText[nextEnd]) {
    prevEnd -= 1;
    nextEnd -= 1;
  }

  return {
    text: nextText.slice(start, nextEnd + 1),
    offset: start,
  };
}

function sourceForInputType(inputType?: string): 'clipboard' | 'autocomplete' | 'ime' | null {
  if (inputType === 'insertFromPaste' || inputType === 'insertFromDrop') {
    return 'clipboard';
  }
  if (inputType === 'insertReplacementText') {
    return 'autocomplete';
  }
  if (inputType === 'insertCompositionText') {
    return 'ime';
  }
  return null;
}

function withEditTimestamp(previous: FieldValue, text: string): FieldValue {
  return {
    ...previous,
    text,
    pastes: [...previous.pastes],
    meta: {
      ...previous.meta,
      lastEditAt: now(),
    },
  };
}

export function appendPasteEvent(
  previous: FieldValue,
  source: 'clipboard' | 'autocomplete' | 'ime',
  text: string,
  offset: number,
): FieldValue {
  if (!text) {
    return previous;
  }
  const next = withEditTimestamp(previous, previous.text);
  next.pastes.push({
    text,
    at: now(),
    offset: Math.max(0, offset),
    source,
  });
  return next;
}

export function markFieldActivity(
  previous: FieldValue,
  target: EditableTarget,
  event: EditableInputEvent,
): FieldValue {
  const inputType = event.inputType;
  const next = withEditTimestamp(previous, target.value);

  if (inputType === 'insertText') {
    next.meta.keystrokes += 1;
  } else if (inputType?.startsWith('delete')) {
    next.meta.deletes += 1;
  }

  const source = sourceForInputType(inputType);
  if (!source || (source === 'ime' && event.isComposing)) {
    return next;
  }

  const inserted = extractInsertedSubstring(
    previous.text,
    target.value,
    target.selectionStart,
    event.data,
  );
  if (!inserted.text) {
    return next;
  }

  next.pastes.push({
    text: inserted.text,
    at: now(),
    offset: inserted.offset,
    source,
  });

  return next;
}
