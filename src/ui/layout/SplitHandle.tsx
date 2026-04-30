import { useCallback, useEffect, useRef, type KeyboardEvent, type PointerEvent } from 'react';

type SplitHandleProps = {
  splitFraction: number;
  onChange: (nextFraction: number) => void;
};

const MIN_SPLIT = 0.25;
const MAX_SPLIT = 0.75;

function clampSplit(value: number): number {
  return Math.min(MAX_SPLIT, Math.max(MIN_SPLIT, value));
}

function toPercentValue(value: number): number {
  return Math.round(clampSplit(value) * 100);
}

export function SplitHandle({ splitFraction, onChange }: SplitHandleProps) {
  const handleRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef(false);
  const pointerIdRef = useRef<number | null>(null);

  const applyPointerPosition = useCallback(
    (clientX: number) => {
      const parentRect = handleRef.current?.parentElement?.getBoundingClientRect();
      if (!parentRect || parentRect.width <= 0) {
        return;
      }
      const next = clampSplit((clientX - parentRect.left) / parentRect.width);
      onChange(next);
    },
    [onChange],
  );

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    const pointerId = event.pointerId ?? 1;
    draggingRef.current = true;
    pointerIdRef.current = pointerId;
    event.currentTarget.setPointerCapture(pointerId);
    applyPointerPosition(event.clientX);
  };

  useEffect(() => {
    const handlePointerMove = (event: globalThis.PointerEvent) => {
      if (!draggingRef.current) {
        return;
      }
      const trackedId = pointerIdRef.current;
      if (trackedId !== null && event.pointerId !== trackedId) {
        return;
      }
      applyPointerPosition(event.clientX);
    };

    const handlePointerUp = (event: globalThis.PointerEvent) => {
      if (!draggingRef.current) {
        return;
      }
      const trackedId = pointerIdRef.current;
      if (trackedId !== null && event.pointerId !== trackedId) {
        return;
      }
      draggingRef.current = false;
      pointerIdRef.current = null;
      const handle = handleRef.current;
      if (!handle) {
        return;
      }
      const pointerId = event.pointerId ?? 1;
      if (handle.hasPointerCapture(pointerId)) {
        handle.releasePointerCapture(pointerId);
      }
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (!draggingRef.current || (event.buttons ?? 0) !== 1) {
        return;
      }
      applyPointerPosition(event.clientX);
    };

    const handleMouseUp = () => {
      if (!draggingRef.current) {
        return;
      }
      draggingRef.current = false;
      pointerIdRef.current = null;
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [applyPointerPosition]);

  const handleBlur = () => {
    draggingRef.current = false;
    pointerIdRef.current = null;
    const handle = handleRef.current;
    if (!handle) {
      return;
    }
    for (let pointerId = 1; pointerId <= 3; pointerId += 1) {
      if (handle.hasPointerCapture(pointerId)) {
        handle.releasePointerCapture(pointerId);
      }
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = event.shiftKey ? 0.1 : 0.02;
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      onChange(clampSplit(splitFraction - step));
      return;
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      onChange(clampSplit(splitFraction + step));
      return;
    }
    if (event.key === 'Home') {
      event.preventDefault();
      onChange(MIN_SPLIT);
      return;
    }
    if (event.key === 'End') {
      event.preventDefault();
      onChange(MAX_SPLIT);
    }
  };

  return (
    <div
      ref={handleRef}
      className="split-handle"
      role="separator"
      aria-label="Resize simulation and worksheet panes"
      aria-orientation="vertical"
      aria-valuemin={25}
      aria-valuemax={75}
      aria-valuenow={toPercentValue(splitFraction)}
      tabIndex={0}
      onPointerDown={handlePointerDown}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
    />
  );
}
