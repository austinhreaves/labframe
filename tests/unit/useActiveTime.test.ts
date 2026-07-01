import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { FieldValue } from '@/domain/schema';
import { createEmptyFieldValue } from '@/state/labStore';
import { accrueActiveMs, useActiveTime } from '@/ui/primitives/useActiveTime';

describe('accrueActiveMs (pure)', () => {
  it('adds a monotonic delta and advances the anchor to clockNow', () => {
    const start = createEmptyFieldValue().meta;
    const { meta, anchor } = accrueActiveMs(start, 1000, 4000);
    expect(meta.activeMs).toBe(3000);
    expect(anchor).toBe(4000);
  });

  it('clamps a negative (clock-regression) delta to +0 but still advances the anchor', () => {
    const start = { ...createEmptyFieldValue().meta, activeMs: 500 };
    const { meta, anchor } = accrueActiveMs(start, 4000, 1000);
    expect(meta.activeMs).toBe(500);
    expect(anchor).toBe(1000);
  });

  it('accumulates across successive flushes without double counting', () => {
    let meta = createEmptyFieldValue().meta;
    let anchor = 0;
    ({ meta, anchor } = accrueActiveMs(meta, anchor, 1000));
    ({ meta, anchor } = accrueActiveMs(meta, anchor, 2500));
    expect(meta.activeMs).toBe(2500);
    expect(anchor).toBe(2500);
  });

  it('rounds a fractional delta so activeMs stays an integer', () => {
    const { meta } = accrueActiveMs(createEmptyFieldValue().meta, 0, 1499.6);
    expect(meta.activeMs).toBe(1500);
    expect(Number.isInteger(meta.activeMs)).toBe(true);
  });
});

describe('useActiveTime (hook)', () => {
  let nowValue = 0;

  const advanceClock = (to: number) => {
    nowValue = to;
  };

  const dispatchVisibility = (hidden: boolean) => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden });
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });
  };

  /**
   * Renders the hook as it is used in production: a controlled `value` fed back
   * from `onChange`. `rerender` is invoked after each commit so the hook's
   * ref-to-latest sees the freshly-committed FieldValue, exactly as React would.
   */
  const mountField = () => {
    let current: FieldValue = createEmptyFieldValue();
    const onChange = vi.fn((next: FieldValue) => {
      current = next;
    });
    const view = renderHook(({ value }) => useActiveTime({ value, onChange }), {
      initialProps: { value: current },
    });
    const sync = () => {
      view.rerender({ value: current });
    };
    return {
      onFocus: () => {
        act(() => view.result.current.onFocus());
        sync();
      },
      onBlur: () => {
        act(() => view.result.current.onBlur());
        sync();
      },
      hide: () => {
        dispatchVisibility(true);
        sync();
      },
      show: () => {
        dispatchVisibility(false);
        sync();
      },
      unmount: () => {
        act(() => view.unmount());
      },
      value: () => current,
      onChange,
    };
  };

  beforeEach(() => {
    nowValue = 0;
    vi.spyOn(performance, 'now').mockImplementation(() => nowValue);
    dispatchVisibility(false);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('banks elapsed focused time on blur', () => {
    const field = mountField();
    advanceClock(1000);
    field.onFocus();
    advanceClock(4000);
    field.onBlur();
    expect(field.value().meta.activeMs).toBe(3000);
  });

  it('sets firstFocusAt once, on the first focus only', () => {
    const field = mountField();
    field.onFocus();
    const first = field.value().meta.firstFocusAt;
    expect(typeof first).toBe('number');
    advanceClock(2000);
    field.onBlur();
    field.onFocus();
    expect(field.value().meta.firstFocusAt).toBe(first);
  });

  it('commits active time on tab hide without a blur (original-defect regression)', () => {
    const field = mountField();
    field.onFocus();
    advanceClock(2500);
    field.hide();
    expect(field.value().meta.activeMs).toBe(2500);
  });

  it('commits active time on pagehide without a blur', () => {
    const field = mountField();
    field.onFocus();
    advanceClock(1500);
    act(() => {
      window.dispatchEvent(new Event('pagehide'));
    });
    expect(field.value().meta.activeMs).toBe(1500);
  });

  it('commits active time on unmount without a blur', () => {
    const field = mountField();
    field.onFocus();
    advanceClock(1800);
    field.unmount();
    expect(field.value().meta.activeMs).toBe(1800);
  });

  it('does not count time spent while the tab is hidden (hidden -> visible -> blur)', () => {
    const field = mountField();
    field.onFocus();
    advanceClock(2000);
    field.hide(); // banks 2000, pauses
    advanceClock(10_000); // 8s spent hidden must not count
    field.show(); // resume, re-anchor at 10_000
    advanceClock(12_000);
    field.onBlur(); // +2000
    expect(field.value().meta.activeMs).toBe(4000);
  });

  it('banks time on a heartbeat while focused with no lifecycle event', () => {
    vi.useFakeTimers();
    const field = mountField();
    field.onFocus();
    advanceClock(5000);
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(field.value().meta.activeMs).toBe(5000);
  });

  it('accumulates across focus cycles rather than resetting (stale-closure guard)', () => {
    const field = mountField();
    advanceClock(1000);
    field.onFocus();
    advanceClock(3000);
    field.onBlur(); // +2000 => 2000
    advanceClock(3000);
    field.onFocus();
    advanceClock(5000);
    field.onBlur(); // +2000 => 4000, not reset to 2000
    expect(field.value().meta.activeMs).toBe(4000);
  });
});
