/**
 * Seeded measurement-noise layer (spec section 2.1.1): reproducible, pure in
 * (cleanValue, seed, sampleIndex), and applied only at the reading, never to the
 * underlying trajectory.
 */
import fc from 'fast-check';
import { applyNoise, gaussian01, uniform01 } from '../../../public/sims/lib/engine/noise.js';
import { createEngine } from '../../../public/sims/lib/engine/engine.js';
import type { Model, NoiseDescriptor } from '../../../public/sims/lib/engine/engine.js';

describe('primitive deviates', () => {
  it('uniform01 stays in the open interval (0, 1)', () => {
    for (let i = 0; i < 500; i += 1) {
      const u = uniform01(42, i);
      expect(u).toBeGreaterThan(0);
      expect(u).toBeLessThan(1);
    }
  });

  it('is a pure function of (seed, sampleIndex)', () => {
    fc.assert(
      fc.property(fc.integer(), fc.integer(), (seed, index) => {
        expect(uniform01(seed, index)).toBe(uniform01(seed, index));
        expect(gaussian01(seed, index)).toBe(gaussian01(seed, index));
      }),
    );
  });

  it('varies across sample indices and seeds', () => {
    const values = new Set<number>();
    for (let i = 0; i < 100; i += 1) values.add(gaussian01(7, i));
    expect(values.size).toBe(100);
    expect(gaussian01(1, 0)).not.toBe(gaussian01(2, 0));
  });
});

describe('applyNoise', () => {
  it('gaussian relative noise has the declared statistics', () => {
    const clean = 100;
    const descriptor: NoiseDescriptor = { kind: 'gaussian', relative: 0.01 }; // sigma = 1
    const n = 2000;
    let sum = 0;
    let sumSq = 0;
    for (let i = 0; i < n; i += 1) {
      const r = applyNoise(clean, descriptor, 42, i);
      sum += r;
      sumSq += (r - clean) ** 2;
    }
    const mean = sum / n;
    const std = Math.sqrt(sumSq / n);
    expect(Math.abs(mean - clean)).toBeLessThan(0.15);
    expect(std).toBeGreaterThan(0.9);
    expect(std).toBeLessThan(1.1);
  });

  it('gaussian absolute sigma overrides the relative one', () => {
    const descriptor: NoiseDescriptor = { kind: 'gaussian', absolute: 0.5, relative: 10 };
    let sumSq = 0;
    const n = 2000;
    for (let i = 0; i < n; i += 1) sumSq += (applyNoise(3, descriptor, 9, i) - 3) ** 2;
    const std = Math.sqrt(sumSq / n);
    expect(std).toBeGreaterThan(0.45);
    expect(std).toBeLessThan(0.55);
  });

  it('quantize rounds to the nearest step, deterministically', () => {
    expect(applyNoise(1.234, { kind: 'quantize', step: 0.05 }, 0, 0)).toBeCloseTo(1.25, 12);
    expect(applyNoise(-0.123, { kind: 'quantize', step: 0.01 }, 5, 3)).toBeCloseTo(-0.12, 12);
    // Seed and sampleIndex are irrelevant for a digital readout.
    expect(applyNoise(1.234, { kind: 'quantize', step: 0.05 }, 1, 99)).toBeCloseTo(1.25, 12);
  });

  it('rejects malformed descriptors', () => {
    expect(() => applyNoise(1, { kind: 'quantize', step: 0 } as NoiseDescriptor, 0, 0)).toThrow(
      /step/,
    );
    expect(() => applyNoise(1, { kind: 'lognormal' } as unknown as NoiseDescriptor, 0, 0)).toThrow(
      /Unknown noise kind/,
    );
  });
});

describe('engine.read: noise perturbs the reading, never the trajectory', () => {
  function fallModel(): Model {
    return {
      state: { y: 10, v: 0 },
      params: { g: 9.81, m: 1 },
      initialMode: 'fall',
      modes: { fall: { derivatives: (s, p) => ({ y: -s.v!, v: p.g }) } },
      observables: {
        KE: (s, p) => 0.5 * p.m * s.v ** 2,
        PE: (s, p) => p.m * p.g * s.y!,
        E_dissipated: () => 0,
        speedReading: { fn: (s) => s.v!, noise: { kind: 'gaussian', relative: 0.01 } },
      },
    };
  }

  it('same seed reproduces identical readings; different seeds differ', () => {
    const a = createEngine(fallModel(), { seed: 123 });
    const b = createEngine(fallModel(), { seed: 123 });
    const c = createEngine(fallModel(), { seed: 456 });
    for (const engine of [a, b, c]) engine.advance(1);
    expect(a.read('speedReading', 0)).toBe(b.read('speedReading', 0));
    expect(a.read('speedReading', 7)).toBe(b.read('speedReading', 7));
    expect(a.read('speedReading', 0)).not.toBe(c.read('speedReading', 0));
  });

  it('observe() stays clean and reading never mutates the state', () => {
    const noisy = createEngine(fallModel(), { seed: 123 });
    const control = createEngine(fallModel(), { seed: 123 });
    for (let i = 0; i < 100; i += 1) {
      noisy.step();
      noisy.read('speedReading', i);
      control.step();
    }
    expect(noisy.getState()).toEqual(control.getState());
    expect(noisy.observe('speedReading')).toBe(noisy.getState().v);
    // Observables without a descriptor read exact even through read().
    expect(noisy.read('KE', 0)).toBe(noisy.observe('KE'));
    // The noisy reading is a perturbation of the clean value, not a replacement.
    const clean = noisy.observe('speedReading');
    const reading = noisy.read('speedReading', 0);
    expect(reading).not.toBe(clean);
    expect(Math.abs(reading - clean)).toBeLessThan(0.1 * Math.abs(clean));
  });
});
