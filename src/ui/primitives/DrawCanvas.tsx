import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Eraser, Maximize2, Minimize2, Pen, RotateCcw, Trash2 } from 'lucide-react';

import { Icon } from '@/ui/primitives/Icon';
import {
  DRAW_COLORS,
  DRAW_PAGE_HEIGHT,
  DRAW_PAGE_WIDTH,
  DRAW_WIDTH_THICK,
  DRAW_WIDTH_THIN,
  type DrawDocument,
  type DrawPoint,
  type DrawStroke,
  drawStrokesToContext,
  parseDrawing,
  serializeDrawing,
} from '@/ui/primitives/drawStrokes';

type Props = {
  id?: string;
  /** Serialized DrawDocument JSON, or undefined / '' for an empty canvas. */
  value: string | undefined;
  onChange: (serialized: string) => void;
  /** Accessible name for the drawing surface (the calculation prompt). */
  label: string;
};

// Stroke-eraser hit radius in logical units; erasing removes whole strokes near
// the pointer rather than clearing pixels, which keeps the vector model intact.
const ERASE_RADIUS = 22;

function distanceToStroke(stroke: DrawStroke, x: number, y: number): number {
  let min = Infinity;
  for (const point of stroke.points) {
    const dx = point.x - x;
    const dy = point.y - y;
    const distance = Math.hypot(dx, dy);
    if (distance < min) {
      min = distance;
    }
  }
  return min;
}

export function DrawCanvas({ id, value, onChange, label }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [strokes, setStrokes] = useState<DrawStroke[]>(() => parseDrawing(value)?.strokes ?? []);
  const [color, setColor] = useState<string>(DRAW_COLORS[0]);
  const [width, setWidth] = useState<number>(DRAW_WIDTH_THIN);
  const [erasing, setErasing] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);

  // Track the JSON we last emitted so an external reset (reload, "Start fresh")
  // re-seeds the canvas while our own edits do not bounce back through props.
  const lastEmitted = useRef<string | undefined>(value);
  const activeStroke = useRef<DrawStroke | null>(null);
  const strokesRef = useRef<DrawStroke[]>(strokes);
  strokesRef.current = strokes;

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const cssWidth = canvas.clientWidth;
    const cssHeight = canvas.clientHeight;
    if (cssWidth === 0 || cssHeight === 0) {
      return;
    }
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    canvas.width = Math.max(1, Math.round(cssWidth * dpr));
    canvas.height = Math.max(1, Math.round(cssHeight * dpr));
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }
    // Map logical page units to device pixels (display size x dpr).
    ctx.setTransform(
      (cssWidth / DRAW_PAGE_WIDTH) * dpr,
      0,
      0,
      (cssHeight / DRAW_PAGE_HEIGHT) * dpr,
      0,
      0,
    );
    ctx.clearRect(0, 0, DRAW_PAGE_WIDTH, DRAW_PAGE_HEIGHT);
    drawStrokesToContext(ctx, strokesRef.current);
    if (activeStroke.current) {
      drawStrokesToContext(ctx, [activeStroke.current]);
    }
  }, []);

  // Re-seed from props when an external change replaces our last emitted value.
  useEffect(() => {
    if (value === lastEmitted.current) {
      return;
    }
    lastEmitted.current = value;
    setStrokes(parseDrawing(value)?.strokes ?? []);
  }, [value]);

  // `fullscreen` is a dependency because toggling it moves the canvas between the
  // inline tree and the portal, remounting the node; the effects must repaint and
  // re-observe the new element.
  useEffect(() => {
    redraw();
  }, [strokes, redraw, fullscreen]);

  useEffect(() => {
    if (typeof ResizeObserver === 'undefined') {
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const observer = new ResizeObserver(() => redraw());
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [redraw, fullscreen]);

  // Lock body scroll and move focus into the overlay while fullscreen is open.
  useEffect(() => {
    if (!fullscreen) {
      return;
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.querySelector<HTMLButtonElement>('button')?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [fullscreen]);

  const emit = useCallback(
    (next: DrawStroke[]) => {
      const doc: DrawDocument = { version: 2, strokes: next };
      const serialized = serializeDrawing(doc);
      lastEmitted.current = serialized;
      onChange(serialized);
    },
    [onChange],
  );

  const pointFromEvent = (event: React.PointerEvent<HTMLCanvasElement>): DrawPoint => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const pressure = event.pointerType === 'pen' ? event.pressure : 0;
    // Display pixels to logical page units.
    return {
      x: ((event.clientX - rect.left) / rect.width) * DRAW_PAGE_WIDTH,
      y: ((event.clientY - rect.top) / rect.height) * DRAW_PAGE_HEIGHT,
      pressure,
    };
  };

  const eraseAt = (point: DrawPoint) => {
    const remaining = strokesRef.current.filter(
      (stroke) => distanceToStroke(stroke, point.x, point.y) > ERASE_RADIUS,
    );
    if (remaining.length !== strokesRef.current.length) {
      setStrokes(remaining);
      emit(remaining);
    }
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    canvasRef.current?.setPointerCapture(event.pointerId);
    const point = pointFromEvent(event);
    if (erasing) {
      eraseAt(point);
      return;
    }
    activeStroke.current = { color, width, points: [point] };
    redraw();
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (erasing) {
      if (event.buttons !== 0) {
        eraseAt(pointFromEvent(event));
      }
      return;
    }
    if (!activeStroke.current) {
      return;
    }
    event.preventDefault();
    activeStroke.current.points.push(pointFromEvent(event));
    redraw();
  };

  const finishStroke = () => {
    const stroke = activeStroke.current;
    activeStroke.current = null;
    if (!stroke || stroke.points.length === 0) {
      return;
    }
    const next = [...strokesRef.current, stroke];
    setStrokes(next);
    emit(next);
  };

  const undo = useCallback(() => {
    if (strokesRef.current.length === 0) {
      return;
    }
    const next = strokesRef.current.slice(0, -1);
    setStrokes(next);
    emit(next);
  }, [emit]);

  const clear = () => {
    if (strokesRef.current.length === 0) {
      return;
    }
    setStrokes([]);
    emit([]);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLCanvasElement>) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z') {
      event.preventDefault();
      undo();
    }
  };

  // Escape closes the overlay; Tab is trapped within the panel.
  const handleOverlayKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      setFullscreen(false);
      return;
    }
    if (event.key !== 'Tab') {
      return;
    }
    const root = panelRef.current;
    if (!root) {
      return;
    }
    const focusable = Array.from(
      root.querySelectorAll<HTMLElement>('button, [tabindex]:not([tabindex="-1"])'),
    ).filter((el) => !el.hasAttribute('disabled'));
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (!first || !last) {
      return;
    }
    const active = document.activeElement;
    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const content = (
    <>
      <div className="draw-canvas-toolbar" role="toolbar" aria-label="Drawing tools">
        <div className="draw-canvas-colors" role="group" aria-label="Stroke color">
          {DRAW_COLORS.map((preset) => (
            <button
              key={preset}
              type="button"
              className="draw-canvas-swatch"
              style={{ backgroundColor: preset }}
              aria-label={`Color ${preset}`}
              aria-pressed={!erasing && color === preset}
              data-active={!erasing && color === preset ? '' : undefined}
              onClick={() => {
                setColor(preset);
                setErasing(false);
              }}
            />
          ))}
        </div>
        <div className="draw-canvas-tools" role="group" aria-label="Stroke width and tools">
          <button
            type="button"
            aria-label="Thin stroke"
            aria-pressed={!erasing && width === DRAW_WIDTH_THIN}
            data-active={!erasing && width === DRAW_WIDTH_THIN ? '' : undefined}
            onClick={() => {
              setWidth(DRAW_WIDTH_THIN);
              setErasing(false);
            }}
          >
            <Icon icon={Pen} size={14} /> Thin
          </button>
          <button
            type="button"
            aria-label="Thick stroke"
            aria-pressed={!erasing && width === DRAW_WIDTH_THICK}
            data-active={!erasing && width === DRAW_WIDTH_THICK ? '' : undefined}
            onClick={() => {
              setWidth(DRAW_WIDTH_THICK);
              setErasing(false);
            }}
          >
            <Icon icon={Pen} size={18} /> Thick
          </button>
          <button
            type="button"
            aria-label="Eraser"
            aria-pressed={erasing}
            data-active={erasing ? '' : undefined}
            onClick={() => setErasing((prev) => !prev)}
          >
            <Icon icon={Eraser} size={16} /> Erase
          </button>
          <button type="button" aria-label="Undo last stroke" onClick={undo}>
            <Icon icon={RotateCcw} size={16} /> Undo
          </button>
          <button type="button" aria-label="Clear drawing" onClick={clear}>
            <Icon icon={Trash2} size={16} /> Clear
          </button>
          <button
            type="button"
            aria-label={fullscreen ? 'Exit full screen' : 'Draw full screen'}
            aria-pressed={fullscreen}
            onClick={() => setFullscreen((prev) => !prev)}
          >
            <Icon icon={fullscreen ? Minimize2 : Maximize2} size={16} />{' '}
            {fullscreen ? 'Exit' : 'Full screen'}
          </button>
        </div>
      </div>
      <canvas
        id={id}
        ref={canvasRef}
        className="draw-canvas-surface"
        style={{ touchAction: 'none' }}
        role="application"
        aria-label={`Drawing area: ${label}`}
        tabIndex={0}
        data-erasing={erasing ? '' : undefined}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishStroke}
        onPointerCancel={finishStroke}
        onPointerLeave={(event) => {
          if (event.buttons !== 0 && !erasing) {
            finishStroke();
          }
        }}
        onKeyDown={handleKeyDown}
      />
    </>
  );

  if (fullscreen) {
    return createPortal(
      <div className="draw-fullscreen-backdrop" onKeyDown={handleOverlayKeyDown}>
        <div
          ref={panelRef}
          className="draw-canvas draw-fullscreen-panel"
          role="dialog"
          aria-modal="true"
          aria-label={`Drawing: ${label}`}
        >
          {content}
        </div>
      </div>,
      document.body,
    );
  }

  return <div className="draw-canvas">{content}</div>;
}

export default DrawCanvas;
