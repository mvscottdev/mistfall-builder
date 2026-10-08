// Small readers for untrusted JSON. Each takes the value and its path
// (e.g. `prices.json: low["1130101"]`) and throws a SnapshotError naming
// that path when the value has the wrong shape.

export class SnapshotError extends Error {
  override name = 'SnapshotError';
}

export type JsonObject = Record<string, unknown>;

function describe(value: unknown): string {
  if (value === undefined) return 'nothing';
  return JSON.stringify(value)?.slice(0, 40) ?? String(value);
}

export function fail(at: string, expected: string, value: unknown): never {
  throw new SnapshotError(`${at}: expected ${expected}, got ${describe(value)}`);
}

export function readObject(value: unknown, at: string): JsonObject {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    fail(at, 'an object', value);
  }
  return value as JsonObject;
}

export function readArray(value: unknown, at: string): unknown[] {
  if (!Array.isArray(value)) fail(at, 'an array', value);
  return value;
}

export function readNumber(value: unknown, at: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) fail(at, 'a number', value);
  return value;
}

export function readInteger(value: unknown, at: string): number {
  if (!Number.isInteger(value)) fail(at, 'an integer', value);
  return value as number;
}

export function readPositive(value: unknown, at: string): number {
  const n = readNumber(value, at);
  if (n <= 0) fail(at, 'a positive number', value);
  return n;
}

export function readString(value: unknown, at: string): string {
  if (typeof value !== 'string') fail(at, 'a string', value);
  return value;
}

export function readBoolean(value: unknown, at: string): boolean {
  if (typeof value !== 'boolean') fail(at, 'true or false', value);
  return value;
}

/** Reads each element of an array with `read`, giving it the path `at[i]`. */
export function readList<T>(value: unknown, at: string, read: (v: unknown, at: string) => T): T[] {
  return readArray(value, at).map((v, i) => read(v, `${at}[${i}]`));
}

/** Reads an object whose keys are integer ids, e.g. `{ "4": 1 }`. */
export function readIdMap<T>(
  value: unknown,
  at: string,
  read: (v: unknown, at: string) => T,
): Map<number, T> {
  const map = new Map<number, T>();
  for (const [key, v] of Object.entries(readObject(value, at))) {
    const keyAt = `${at}["${key}"]`;
    if (!/^\d+$/.test(key)) fail(keyAt, 'an integer id as key', key);
    map.set(Number(key), read(v, keyAt));
  }
  return map;
}
