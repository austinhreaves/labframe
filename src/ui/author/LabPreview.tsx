import { useEffect, useMemo } from 'react';

import type { Lab, LabDoc } from '@/domain/schema';
import { compileLabDoc } from '@/services/authoring';
import { useLabStore } from '@/state/labStore';
import { SectionRenderer } from '@/ui/sections/SectionRenderer';

// The preview reuses the real student renderer, which is bound to the global
// store. We init the compiled draft under a reserved preview identity and clear
// it on unmount. Re-init is debounced so typing in the editor stays smooth.
const PREVIEW_COURSE_ID = 'author-preview';
const PREVIEW_LAB_ID = 'preview';

export function LabPreview({ doc }: { doc: LabDoc }) {
  const initLab = useLabStore((state) => state.initLab);
  const clearCurrentLab = useLabStore((state) => state.clearCurrentLab);

  const compiled = useMemo<Lab | null>(() => {
    try {
      return compileLabDoc(doc).lab;
    } catch {
      return null;
    }
  }, [doc]);

  useEffect(() => {
    if (!compiled) {
      return;
    }
    const timer = setTimeout(() => {
      void initLab(PREVIEW_COURSE_ID, PREVIEW_LAB_ID, { ...compiled, id: PREVIEW_LAB_ID });
    }, 300);
    return () => clearTimeout(timer);
  }, [compiled, initLab]);

  useEffect(() => {
    return () => {
      void clearCurrentLab();
    };
  }, [clearCurrentLab]);

  if (!compiled) {
    return (
      <p className="author-preview-empty">Preview unavailable: complete the required fields.</p>
    );
  }

  return (
    <div className="author-preview-doc">
      <h2 className="author-preview-title">{compiled.title || 'Untitled lab'}</h2>
      {compiled.sections.map((section, index) => (
        <div key={index} className="worksheet-section-anchor">
          <SectionRenderer section={section} />
        </div>
      ))}
    </div>
  );
}
