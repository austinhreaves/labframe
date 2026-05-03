import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  clearParentMessagingContext,
  configureParentMessaging,
  postSaveProgressToParent,
  postSubmitAnswersToParent,
} from '@/services/embed/parentPostMessage';

describe('parent postMessage service', () => {
  const originalParent = window.parent;

  beforeEach(() => {
    clearParentMessagingContext();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    Object.defineProperty(window, 'parent', { value: originalParent, configurable: true });
  });

  it('does not post when referrer is not allow-listed', () => {
    const postMessage = vi.fn();
    Object.defineProperty(window, 'parent', { value: { postMessage }, configurable: true });
    Object.defineProperty(document, 'referrer', { value: 'https://evil.example.com/embed', configurable: true });

    configureParentMessaging({
      parentOriginAllowList: ['https://canvas.asu.edu'],
      courseId: 'phy132',
      labId: 'snellsLaw',
    });

    postSaveProgressToParent();
    expect(postMessage).not.toHaveBeenCalled();
  });

  it('posts with explicit targetOrigin when referrer origin is allow-listed', () => {
    const postMessage = vi.fn();
    Object.defineProperty(window, 'parent', { value: { postMessage }, configurable: true });
    Object.defineProperty(document, 'referrer', { value: 'https://canvas.asu.edu/courses/123', configurable: true });

    configureParentMessaging({
      parentOriginAllowList: ['https://canvas.asu.edu'],
      courseId: 'phy132',
      labId: 'snellsLaw',
    });

    postSubmitAnswersToParent();

    expect(postMessage).toHaveBeenCalledTimes(1);
    expect(postMessage).toHaveBeenCalledWith(
      {
        type: 'SUBMIT_ANSWERS',
        courseId: 'phy132',
        labId: 'snellsLaw',
      },
      'https://canvas.asu.edu',
    );
  });
});
