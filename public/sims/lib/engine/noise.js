/**
 * Seeded measurement-noise layer (docs/specs/PHYSICS_ENGINE_SPEC.md, section 2.1.1).
 *
 * The engine integrates exact trajectories; this layer perturbs only the values a
 * student reads off an instrument. Every function here is a pure function of its
 * arguments: no global RNG state, no Math.random, no wall clock. The same
 * (cleanValue, descriptor, seed, sampleIndex) always yields the same reading on
 * every machine, so a grader can replay exactly what a student saw.
 *
 * Module contract (grep public/sims/* /index.html before changing exports):
 *   applyNoise(cleanValue, descriptor, seed, sampleIndex) -> number
 *   uniform01(seed, sampleIndex, stream) -> number in (0, 1)
 *   gaussian01(seed, sampleIndex) -> standard normal deviate
 */

/**
 * @typedef {(
 *   | { kind: 'gaussian', relative?: number, absolute?: number }
 *   | { kind: 'quantize', step: number }
 * )} NoiseDescriptor
 *
 * `gaussian`: additive noise with sigma = absolute, or |cleanValue| * relative when
 * no absolute sigma is given. `quantize`: deterministic rounding to the nearest
 * multiple of `step` (a simulated digital readout; seed and sampleIndex unused).
 */

/**
 * 32-bit avalanche hash (lowbias32 shape). Small changes in input flip roughly
 * half the output bits, which is what makes consecutive sampleIndex values
 * statistically independent.
 *
 * @param {number} x
 * @returns {number} unsigned 32-bit integer
 */
function mix32(x) {
  let h = x >>> 0;
  h = Math.imul(h ^ (h >>> 16), 0x21f0aaad);
  h = Math.imul(h ^ (h >>> 15), 0x735a2d97);
  h = (h ^ (h >>> 15)) >>> 0;
  return h;
}

/**
 * Deterministic uniform deviate in the open interval (0, 1).
 *
 * @param {number} seed integer seed (the envelope seed slot)
 * @param {number} sampleIndex integer index of this reading (or event id)
 * @param {number} [stream] independent sub-stream selector, default 0
 * @returns {number}
 */
export function uniform01(seed, sampleIndex, stream = 0) {
  let h = mix32((seed | 0) ^ Math.imul(sampleIndex | 0, 0x9e3779b9));
  h = mix32(h ^ Math.imul((stream | 0) + 1, 0x85ebca6b));
  return (h + 0.5) / 4294967296;
}

/**
 * Deterministic standard normal deviate (Box-Muller over two hashed uniforms).
 *
 * @param {number} seed
 * @param {number} sampleIndex
 * @returns {number}
 */
export function gaussian01(seed, sampleIndex) {
  const u1 = uniform01(seed, sampleIndex, 0);
  const u2 = uniform01(seed, sampleIndex, 1);
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

/**
 * Perturb a clean observable value per its noise descriptor.
 *
 * @param {number} cleanValue
 * @param {NoiseDescriptor} descriptor
 * @param {number} seed
 * @param {number} sampleIndex
 * @returns {number}
 */
export function applyNoise(cleanValue, descriptor, seed, sampleIndex) {
  switch (descriptor.kind) {
    case 'gaussian': {
      const sigma = descriptor.absolute ?? Math.abs(cleanValue) * (descriptor.relative ?? 0);
      return cleanValue + sigma * gaussian01(seed, sampleIndex);
    }
    case 'quantize': {
      const step = descriptor.step;
      if (typeof step !== 'number' || !(step > 0)) {
        throw new Error('quantize noise needs a positive "step"');
      }
      return Math.round(cleanValue / step) * step;
    }
    default: {
      /** @type {{ kind: string }} */
      const bad = descriptor;
      throw new Error(`Unknown noise kind "${bad.kind}"`);
    }
  }
}
