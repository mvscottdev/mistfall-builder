import { fail, readIdMap, readObject, readPositive, readString, SnapshotError } from './check';

/** prices.json after validation: `{ updatedAt, low: {id: gold}, avg: {id: gold} }`. */
export interface Prices {
  updatedAt: string;
  low: Map<number, number>;
  avg: Map<number, number>;
}

/**
 * Validates prices.json. Every price must be a positive number and every id
 * must be an Item or Gem the catalogue knows, so a typo can't silently leave
 * something unpriced.
 */
export function readPrices(json: unknown, knownIds: ReadonlySet<number>): Prices {
  const root = readObject(json, 'prices.json');
  const updatedAt = readString(root.updatedAt, 'prices.json: updatedAt');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(updatedAt)) {
    fail('prices.json: updatedAt', 'a date like 2026-10-07', updatedAt);
  }
  const prices = {
    updatedAt,
    low: readIdMap(root.low, 'prices.json: low', readPositive),
    avg: readIdMap(root.avg, 'prices.json: avg', readPositive),
  };
  for (const kind of ['low', 'avg'] as const) {
    for (const id of prices[kind].keys()) {
      if (!knownIds.has(id)) {
        throw new SnapshotError(`prices.json: ${kind}["${id}"]: no Item or Gem has this id`);
      }
    }
  }
  return prices;
}
