type CanonicalValue =
  | null
  | boolean
  | number
  | string
  | CanonicalValue[]
  | { [key: string]: CanonicalValue };

function normalizeNumber(value: number): number {
  if (!Number.isFinite(value)) {
    throw new TypeError('canonicalize only supports finite numbers');
  }

  return Object.is(value, -0) ? 0 : value;
}

/**
 * Order strings by UTF-16 code unit, which is the default behavior of the JS
 * relational operators on strings. Unlike `localeCompare`, this is deterministic
 * across environments and locales, so a canonical string (and any hash or
 * signature over it) is reproducible everywhere. See docs/SPEC.md section 6
 * (envelope v5).
 */
function compareCodeUnits(a: string, b: string): number {
  if (a < b) {
    return -1;
  }
  if (a > b) {
    return 1;
  }
  return 0;
}

function toCanonicalValue(input: unknown): CanonicalValue {
  if (input === null) {
    return null;
  }

  if (typeof input === 'boolean' || typeof input === 'string') {
    return input;
  }

  if (typeof input === 'number') {
    return normalizeNumber(input);
  }

  if (typeof input !== 'object') {
    throw new TypeError(`canonicalize cannot serialize type: ${typeof input}`);
  }

  if (Array.isArray(input)) {
    return input.map((item) => toCanonicalValue(item));
  }

  if ('toJSON' in input && typeof (input as { toJSON?: () => unknown }).toJSON === 'function') {
    return toCanonicalValue((input as { toJSON: () => unknown }).toJSON());
  }

  const entries = Object.entries(input as Record<string, unknown>)
    .filter(([, value]) => value !== undefined)
    .sort(([a], [b]) => compareCodeUnits(a, b));

  const sortedObject: { [key: string]: CanonicalValue } = {};
  for (const [key, value] of entries) {
    sortedObject[key] = toCanonicalValue(value);
  }

  return sortedObject;
}

export function canonicalize(input: unknown): string {
  return JSON.stringify(toCanonicalValue(input));
}
