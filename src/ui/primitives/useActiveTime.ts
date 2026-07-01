import { useCallback, useEffect, useRef } from 'react';

import type { FieldMeta, FieldValue } from '@/domain/schema';

/** How often to bank accrued time while a field stays focused, so a hard crash
 *  that fires no lifecycle event loses at most one interval's worth of time. */
const HEARTBEAT_MS = 5000;

/**
 * Pure accrual step. Adds the elapsed delta (`clockNow - anchor`) to `activeMs`
 * and returns the meta with the anchor advanced to `clockNow`, so a resumed
 * session keeps counting without double-banking the already-banked delta.
 *
 * A negative delta (non-monotonic clock surprise) clamps to `+0`; the delta is
 * rounded so `activeMs` stays an integer (the persisted schema requires it).
 */
export function accrueActiveMs(
  meta: FieldMeta,
  anchor: number,
  clockNow: number,
): { meta: FieldMeta; anchor: number } {
  const delta = Math.max(0, Math.round(clockNow - anchor));
  return { meta: { ...meta, activeMs: meta.activeMs + delta }, anchor: clockNow };
}

type UseActiveTimeArgs = {
  value: FieldValue;
  onChange: (next: FieldValue) => void;
};

/**
 * Owns the focused wall-clock accrual for an editable field. Replaces the old
 * "bank only on blur" logic that lost a whole focus session's time whenever the
 * blur never fired (reload, tab close, export-while-focused, crash).
 *
 * Time accrues against a `performance.now()` anchor and is flushed at every
 * point where focused time could otherwise be lost: blur, tab-hide, `pagehide`,
 * unmount, and a low-frequency heartbeat. Only the one focused field ever holds
 * live listeners, so there is no per-field fan-out and no cross-field
 * double-counting.
 */
export function useActiveTime({ value, onChange }: UseActiveTimeArgs): {
  onFocus: () => void;
  onBlur: () => void;
} {
  // Ref-to-latest: the event/interval/unmount closures must read the current
  // value so a flush adds to the live activeMs instead of resetting it against
  // a stale FieldValue (the classic stale-closure bug).
  const latest = useRef({ value, onChange });
  latest.current = { value, onChange };

  // performance.now() anchor for the running focus session; null while paused
  // (blurred or tab-hidden). performance.now() is monotonic, so system sleep or
  // an NTP correction cannot inject a bogus multi-hour delta the way Date.now()
  // would.
  const anchorRef = useRef<number | null>(null);
  // Focused-but-maybe-hidden. Distinguishes a field paused by tab-hide (resume
  // on re-show) from one that was blurred (stay paused).
  const focusedRef = useRef(false);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const flush = useCallback(() => {
    if (anchorRef.current === null) {
      return;
    }
    const { value: current, onChange: commit } = latest.current;
    const { meta, anchor: nextAnchor } = accrueActiveMs(
      current.meta,
      anchorRef.current,
      performance.now(),
    );
    anchorRef.current = nextAnchor;
    if (meta.activeMs === current.meta.activeMs) {
      // Sub-millisecond delta; anchor advanced, nothing worth committing.
      return;
    }
    commit({ ...current, meta });
  }, []);

  const handleVisibility = useCallback(() => {
    if (typeof document === 'undefined') {
      return;
    }
    if (document.hidden) {
      // Bank time up to now and pause: time spent backgrounded does not count.
      flush();
      anchorRef.current = null;
    } else if (focusedRef.current && anchorRef.current === null) {
      // Tab returned while still focused: resume without banking the hidden gap.
      anchorRef.current = performance.now();
    }
  }, [flush]);

  const handlePageHide = useCallback(() => {
    flush();
  }, [flush]);

  const attachListeners = useCallback(() => {
    if (typeof document === 'undefined' || typeof window === 'undefined') {
      return;
    }
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('pagehide', handlePageHide);
  }, [handleVisibility, handlePageHide]);

  const detachListeners = useCallback(() => {
    if (typeof document === 'undefined' || typeof window === 'undefined') {
      return;
    }
    document.removeEventListener('visibilitychange', handleVisibility);
    window.removeEventListener('pagehide', handlePageHide);
  }, [handleVisibility, handlePageHide]);

  const stopHeartbeat = useCallback(() => {
    if (heartbeatRef.current !== null) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
  }, []);

  const startHeartbeat = useCallback(() => {
    stopHeartbeat();
    heartbeatRef.current = setInterval(() => {
      flush();
    }, HEARTBEAT_MS);
  }, [flush, stopHeartbeat]);

  const onFocus = useCallback(() => {
    // A double focus event (some custom elements re-fire focus without an
    // intervening blur) must not discard the unflushed delta since the last
    // anchor; bank it before re-anchoring.
    flush();
    anchorRef.current = performance.now();
    focusedRef.current = true;
    attachListeners();
    startHeartbeat();
    const { value: current, onChange: commit } = latest.current;
    if (current.meta.firstFocusAt === undefined) {
      // firstFocusAt is a wall-clock instant (display/forensic), so Date.now().
      commit({ ...current, meta: { ...current.meta, firstFocusAt: Date.now() } });
    }
  }, [flush, attachListeners, startHeartbeat]);

  const onBlur = useCallback(() => {
    flush();
    anchorRef.current = null;
    focusedRef.current = false;
    stopHeartbeat();
    detachListeners();
  }, [flush, stopHeartbeat, detachListeners]);

  // Unmount without a blur (client-side route change, conditional unmount): bank
  // remaining time and clean up. Deps are all stable, so this runs once.
  useEffect(
    () => () => {
      flush();
      anchorRef.current = null;
      focusedRef.current = false;
      stopHeartbeat();
      detachListeners();
    },
    [flush, stopHeartbeat, detachListeners],
  );

  return { onFocus, onBlur };
}
