import { beforeEach, describe, expect, it } from 'vitest';

import type { Course, Lab } from '@/domain/schema';
import { buildAnswersFromStore } from '@/services/integrity/buildAnswers';
import { createEmptyFieldValue, useLabStore } from '@/state/labStore';
import { drawStorageKey } from '@/domain/calculationResponse';

const course: Course = {
  id: 'course-1',
  title: 'Test Course',
  storagePrefix: 'test',
  parentOriginAllowList: [],
  labs: [{ ref: 'lab-1', enabled: true }],
};

const selectableLab: Lab = {
  id: 'lab-1',
  title: 'Selectable Lab',
  description: 'A calculation the student can answer three ways.',
  category: 'Physics',
  simulations: {},
  sections: [
    {
      kind: 'calculation',
      fieldId: 'c1',
      prompt: 'Show your work',
      responseModes: ['text', 'draw', 'image'],
    },
    { kind: 'calculation', fieldId: 'c2', prompt: 'Typed only' },
  ],
};

describe('responseSelections in the store', () => {
  beforeEach(() => {
    void useLabStore.getState().initLab('course-1', 'lab-1', selectableLab);
  });

  it('defaults a selectable section to its first listed mode and ignores single-mode sections', () => {
    expect(useLabStore.getState().responseSelections).toEqual({ c1: 'text' });
  });

  it('switching modes changes only the selection, never the stored answers', () => {
    const store = useLabStore.getState();
    store.setField('c1', createEmptyFieldValue('typed work'));
    store.setField(drawStorageKey('c1'), createEmptyFieldValue('{"strokes":[]}'));

    store.setResponseSelection('c1', 'image');

    const next = useLabStore.getState();
    expect(next.responseSelections.c1).toBe('image');
    expect(next.fields.c1?.text).toBe('typed work');
    expect(next.fields['c1__draw']?.text).toBe('{"strokes":[]}');
  });
});

describe('responseSelections in the signed envelope', () => {
  it('records selections when the lab has selectable sections', () => {
    void useLabStore.getState().initLab('course-1', 'lab-1', selectableLab);
    useLabStore.getState().setResponseSelection('c1', 'draw');

    const answers = buildAnswersFromStore(course, useLabStore.getState());
    expect(answers.responseSelections).toEqual({ c1: 'draw' });
  });

  it('omits responseSelections entirely for single-mode labs', () => {
    const singleModeLab: Lab = {
      ...selectableLab,
      sections: [{ kind: 'calculation', fieldId: 'c2', prompt: 'Typed only' }],
    };
    void useLabStore.getState().initLab('course-1', 'lab-1', singleModeLab);

    const answers = buildAnswersFromStore(course, useLabStore.getState());
    expect('responseSelections' in answers).toBe(false);
  });
});
