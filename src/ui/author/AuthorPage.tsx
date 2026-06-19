import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import type { LabDocSection } from '@/domain/schema';
import {
  CAPTURE_DISCLOSURE_CORE,
  SIM_DOMAIN_ALLOWLIST,
  loadUntrustedLabDoc,
} from '@/services/authoring';
import { loadImportedLabText, saveImportedLab } from '@/state/importedLabs';
import { AccessibleDialog } from '@/ui/AccessibleDialog';
import { Button } from '@/ui/primitives/Button';
import { ThemeToggle } from '@/ui/ThemeToggle';
import { LabPreview } from '@/ui/author/LabPreview';
import { SectionEditor, type TableRef } from '@/ui/author/SectionEditors';
import {
  CURATED_SIMULATIONS,
  SECTION_KINDS,
  createNewDraft,
  draftToLabDoc,
  fileToAsset,
  genId,
  labDocToDraft,
  newSection,
  type Draft,
} from '@/ui/author/draftModel';

function kindLabel(kind: LabDocSection['kind']): string {
  return SECTION_KINDS.find((entry) => entry.kind === kind)?.label ?? kind;
}

function fileSlug(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'lab';
}

function isAllowedSimUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') return false;
    const host = parsed.hostname.toLowerCase();
    return SIM_DOMAIN_ALLOWLIST.some((domain) => host === domain || host.endsWith(`.${domain}`));
  } catch {
    return false;
  }
}

function downloadJson(filename: string, content: string): void {
  const url = URL.createObjectURL(new Blob([content], { type: 'application/json' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function AuthorPage() {
  const params = useParams();
  const editHash = params.hash;
  const [draft, setDraft] = useState<Draft | null>(editHash ? null : createNewDraft());
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const figureInputRef = useRef<HTMLInputElement | null>(null);
  const pendingFigureKey = useRef<string | null>(null);

  useEffect(() => {
    document.title = 'LabFrame - Lab constructor';
  }, []);

  useEffect(() => {
    if (!editHash) return;
    let cancelled = false;
    void (async () => {
      const text = await loadImportedLabText(editHash);
      if (cancelled) return;
      if (!text) {
        setLoadError('That lab was not found in this browser.');
        return;
      }
      const result = await loadUntrustedLabDoc(text);
      if (cancelled) return;
      if (!result.ok) {
        setLoadError(result.error);
        return;
      }
      setDraft(labDocToDraft(result.doc));
    })();
    return () => {
      cancelled = true;
    };
  }, [editHash]);

  const doc = useMemo(() => (draft ? draftToLabDoc(draft) : null), [draft]);

  const tables = useMemo<TableRef[]>(() => {
    if (!draft) return [];
    return draft.sections
      .map((entry) => entry.section)
      .filter(
        (section): section is Extract<LabDocSection, { kind: 'dataTable' }> =>
          section.kind === 'dataTable',
      )
      .map((table) => ({
        tableId: table.tableId,
        label: table.columns.map((column) => column.label).join(', ') || table.tableId,
        columns: table.columns.map((column) => ({ id: column.id, label: column.label })),
      }));
  }, [draft]);

  const updateSection = useCallback((key: string, next: LabDocSection) => {
    setDraft((current) =>
      current
        ? {
            ...current,
            sections: current.sections.map((entry) =>
              entry.key === key ? { ...entry, section: next } : entry,
            ),
          }
        : current,
    );
  }, []);

  const setSectionPoints = (key: string, section: LabDocSection, raw: string) => {
    const next = { ...section };
    const value = Number.parseFloat(raw);
    if (Number.isFinite(value) && value >= 0) {
      next.points = value;
    } else {
      delete next.points;
    }
    updateSection(key, next);
  };

  const moveSection = (key: string, direction: -1 | 1) => {
    setDraft((current) => {
      if (!current) return current;
      const index = current.sections.findIndex((entry) => entry.key === key);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= current.sections.length) return current;
      const sections = [...current.sections];
      const [moved] = sections.splice(index, 1);
      if (moved) sections.splice(target, 0, moved);
      return { ...current, sections };
    });
  };

  const requestFigure = (key: string) => {
    pendingFigureKey.current = key;
    figureInputRef.current?.click();
  };

  const onFigureFile = async (file: File | null) => {
    const key = pendingFigureKey.current;
    pendingFigureKey.current = null;
    if (!file || !key) return;
    const result = await fileToAsset(file);
    if (!result.ok) {
      setNotice(result.error);
      return;
    }
    setDraft((current) => {
      if (!current) return current;
      return {
        ...current,
        assets: { ...current.assets, [result.id]: result.asset },
        sections: current.sections.map((entry) =>
          entry.key === key && entry.section.kind === 'instructions'
            ? {
                ...entry,
                section: {
                  ...entry.section,
                  html: `${entry.section.html}\n\n![figure](asset:${result.id})`,
                },
              }
            : entry,
        ),
      };
    });
  };

  const handleExport = async () => {
    if (!draft) return;
    const json = JSON.stringify(draftToLabDoc(draft), null, 2);
    const result = await loadUntrustedLabDoc(json);
    if (!result.ok) {
      setNotice(`Cannot export: ${result.error}`);
      return;
    }
    downloadJson(`${fileSlug(draft.title)}.labframe.json`, json);
  };

  const handleSaveToMyLabs = async () => {
    if (!draft) return;
    const result = await loadUntrustedLabDoc(JSON.stringify(draftToLabDoc(draft)));
    if (!result.ok) {
      setNotice(`Cannot save: ${result.error}`);
      return;
    }
    await saveImportedLab(result.doc, result.labHash);
    setNotice('Saved to My Labs. Open it from the catalog to try it as a student.');
  };

  if (loadError) {
    return (
      <div className="catalog-page">
        <main className="catalog">
          <p className="catalog-empty">{loadError}</p>
          <Link to="/author">Start a new lab</Link>
        </main>
      </div>
    );
  }

  if (!draft || !doc) {
    return <div className="catalog-page" aria-busy="true" />;
  }

  return (
    <div className="author-page">
      <header className="author-header">
        <div className="author-header-left">
          <Link to="/" className="catalog-brand">
            LabFrame
          </Link>
          <span className="author-header-title">Lab constructor</span>
        </div>
        <div className="author-header-actions">
          <Button variant="ghost" size="sm" onClick={() => void handleSaveToMyLabs()}>
            Save to My Labs
          </Button>
          <Button variant="primary" size="sm" onClick={() => void handleExport()}>
            Export .labframe.json
          </Button>
          <ThemeToggle />
        </div>
      </header>

      <div className="author-shell">
        <div className="author-editor">
          <section className="author-block">
            <h2>Details</h2>
            <label className="author-field">
              <span className="author-field-label">Title</span>
              <input
                className="author-input"
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.currentTarget.value })}
              />
            </label>
            <label className="author-field">
              <span className="author-field-label">Author</span>
              <input
                className="author-input"
                value={draft.author}
                onChange={(e) => setDraft({ ...draft, author: e.currentTarget.value })}
              />
            </label>
            <label className="author-field">
              <span className="author-field-label">Version label (optional)</span>
              <input
                className="author-input author-input-narrow"
                value={draft.humanVersion ?? ''}
                onChange={(e) => {
                  const next = { ...draft };
                  const value = e.currentTarget.value.trim();
                  if (value) next.humanVersion = value;
                  else delete next.humanVersion;
                  setDraft(next);
                }}
              />
            </label>
          </section>

          <section className="author-block">
            <h2>Simulations</h2>
            {draft.simulations.map((sim) => (
              <div className="author-sim" key={sim.key}>
                <input
                  className="author-input"
                  placeholder="Simulation title"
                  value={sim.title}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      simulations: draft.simulations.map((s) =>
                        s.key === sim.key ? { ...s, title: e.currentTarget.value } : s,
                      ),
                    })
                  }
                />
                <input
                  className="author-input"
                  placeholder="https://phet.colorado.edu/..."
                  value={sim.url}
                  data-invalid={sim.url && !isAllowedSimUrl(sim.url) ? 'true' : undefined}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      simulations: draft.simulations.map((s) =>
                        s.key === sim.key ? { ...s, url: e.currentTarget.value } : s,
                      ),
                    })
                  }
                />
                <button
                  type="button"
                  className="author-remove"
                  onClick={() =>
                    setDraft({
                      ...draft,
                      simulations: draft.simulations.filter((s) => s.key !== sim.key),
                    })
                  }
                >
                  Remove
                </button>
                {sim.url && !isAllowedSimUrl(sim.url) ? (
                  <p className="author-warning">URL host is not on the allow-list (PhET only).</p>
                ) : null}
              </div>
            ))}
            <div className="author-sim-add">
              <select
                className="author-input"
                value=""
                onChange={(e) => {
                  const choice = CURATED_SIMULATIONS.find((c) => c.url === e.currentTarget.value);
                  if (!choice) return;
                  setDraft({
                    ...draft,
                    simulations: [
                      ...draft.simulations,
                      { key: genId('sim'), id: genId('sim'), title: choice.title, url: choice.url },
                    ],
                  });
                }}
              >
                <option value="">Add a PhET simulation…</option>
                {CURATED_SIMULATIONS.map((c) => (
                  <option key={c.url} value={c.url}>
                    {c.title}
                  </option>
                ))}
              </select>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  setDraft({
                    ...draft,
                    simulations: [
                      ...draft.simulations,
                      { key: genId('sim'), id: genId('sim'), title: '', url: '' },
                    ],
                  })
                }
              >
                Add custom URL
              </Button>
            </div>
          </section>

          <section className="author-block">
            <h2>Sections</h2>
            {draft.sections.map((entry, index) => (
              <div className="author-section-card" key={entry.key}>
                <div className="author-section-head">
                  <span className="author-section-kind">{kindLabel(entry.section.kind)}</span>
                  <div className="author-section-actions">
                    <button
                      type="button"
                      aria-label="Move up"
                      disabled={index === 0}
                      onClick={() => moveSection(entry.key, -1)}
                    >
                      Up
                    </button>
                    <button
                      type="button"
                      aria-label="Move down"
                      disabled={index === draft.sections.length - 1}
                      onClick={() => moveSection(entry.key, 1)}
                    >
                      Down
                    </button>
                    <button
                      type="button"
                      className="author-remove"
                      onClick={() =>
                        setDraft({
                          ...draft,
                          sections: draft.sections.filter((s) => s.key !== entry.key),
                        })
                      }
                    >
                      Remove
                    </button>
                  </div>
                </div>
                <SectionEditor
                  section={entry.section}
                  onChange={(next) => updateSection(entry.key, next)}
                  tables={tables}
                  onInsertFigure={() => requestFigure(entry.key)}
                />
                <label className="author-field author-points">
                  <span className="author-field-label">Points (optional)</span>
                  <input
                    className="author-input author-input-narrow"
                    type="number"
                    min={0}
                    value={entry.section.points ?? ''}
                    onChange={(e) =>
                      setSectionPoints(entry.key, entry.section, e.currentTarget.value)
                    }
                  />
                </label>
              </div>
            ))}
            <div className="author-add-row">
              {SECTION_KINDS.map((entry) => (
                <Button
                  key={entry.kind}
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    setDraft({ ...draft, sections: [...draft.sections, newSection(entry.kind)] })
                  }
                >
                  + {entry.label}
                </Button>
              ))}
            </div>
          </section>

          <section className="author-block">
            <h2>Integrity agreement</h2>
            <label className="author-field">
              <span className="author-field-label">Your course-specific text (optional)</span>
              <textarea
                className="author-textarea"
                rows={3}
                value={draft.customAgreementText}
                onChange={(e) => setDraft({ ...draft, customAgreementText: e.currentTarget.value })}
              />
            </label>
            <p className="author-field-label">Always included (cannot be edited):</p>
            <p className="author-locked-core">{CAPTURE_DISCLOSURE_CORE}</p>
          </section>
        </div>

        <aside className="author-preview-pane">
          <LabPreview doc={doc} />
        </aside>
      </div>

      <input
        ref={figureInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        hidden
        onChange={(e) => {
          const file = e.currentTarget.files?.[0] ?? null;
          e.currentTarget.value = '';
          void onFigureFile(file);
        }}
      />

      <AccessibleDialog
        open={notice !== null}
        title="Lab constructor"
        onClose={() => setNotice(null)}
      >
        <p>{notice}</p>
      </AccessibleDialog>
    </div>
  );
}
