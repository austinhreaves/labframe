// Vitest setup: enables @testing-library/jest-dom matchers.
import '@testing-library/jest-dom/vitest';
import { configure } from '@testing-library/react';
import { vi } from 'vitest';

// Section views (InstructionsSectionView, calculation/table renderers) are
// React.lazy chunks pulling in KaTeX + the markdown pipeline. Under the full
// suite's parallel workers on a loaded machine, those chunks can take longer
// than testing-library's 1000 ms default to resolve, so waitFor/findBy calls
// waiting on post-Suspense content flake with "Unable to find role=..." while
// the DOM still shows .section-skeleton. Raise the async timeout suite-wide so
// these settle; tests that expect a timeout still pass their own shorter value.
configure({ asyncUtilTimeout: 10_000 });

Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: vi.fn(() => ({
    canvas: document.createElement('canvas'),
    fillRect: vi.fn(),
    clearRect: vi.fn(),
    getImageData: vi.fn(() => ({ data: new Uint8ClampedArray() })),
    putImageData: vi.fn(),
    createImageData: vi.fn(() => []),
    setTransform: vi.fn(),
    drawImage: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    stroke: vi.fn(),
    translate: vi.fn(),
    scale: vi.fn(),
    rotate: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    measureText: vi.fn(() => ({ width: 0 })),
    transform: vi.fn(),
    rect: vi.fn(),
    clip: vi.fn(),
  })),
});
