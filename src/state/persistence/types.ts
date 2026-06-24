import type { ResponseMode } from '@/domain/calculationResponse';

export type PersistedImageMeta = {
  idbKey: string;
  mime: string;
  bytes: number;
  fileName: string;
  sha256?: string;
};

export type PersistedLabState = {
  schemaVersion: 1 | 2 | 3 | 4;
  courseId: string;
  labId: string;
  studentName: string;
  aiUsed?: boolean;
  aiSharedLinks?: string;
  fields: Record<string, unknown>;
  tables: Record<string, unknown>;
  selectedFits?: Record<string, string | null>;
  fits: Record<string, unknown>;
  responseSelections?: Record<string, ResponseMode>;
  images: Record<string, PersistedImageMeta>;
  splitFraction: number;
  status: {
    submitted: boolean;
    lastSavedAt: number;
  };
};

export interface PersistenceAdapter {
  saveJSON(key: string, payload: unknown): Promise<void>;
  saveBlob(key: string, blob: Blob): Promise<void>;
  loadJSON<T>(key: string): Promise<T | null>;
  loadBlob(key: string): Promise<Blob | null>;
  listKeys(prefix: string): Promise<string[]>;
  deleteJSON(key: string): Promise<void>;
  deleteBlob(key: string): Promise<void>;
}
