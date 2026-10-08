import { describe, expect, test } from 'vitest';
import { readPrices } from '../../src/catalogue/read-prices';

const knownIds = new Set([1130101, 221101]);
const valid = { updatedAt: '2026-10-07', low: { '1130101': 98 }, avg: { '221101': 120 } };

const read = (json: unknown) => () => readPrices(json, knownIds);

describe('prices.json validation', () => {
  test('a valid file reads into low and avg maps', () => {
    const prices = readPrices(valid, knownIds);
    expect(prices.low.get(1130101)).toBe(98);
    expect(prices.avg.get(221101)).toBe(120);
    expect(prices.updatedAt).toBe('2026-10-07');
  });

  test('a price that is not a number names its id', () => {
    expect(read({ ...valid, low: { '1130101': '98' } })).toThrow(
      'prices.json: low["1130101"]: expected a number, got "98"',
    );
  });

  test('a zero or negative price is rejected', () => {
    expect(read({ ...valid, avg: { '221101': 0 } })).toThrow('expected a positive number, got 0');
  });

  test('an id the catalogue does not know is rejected', () => {
    expect(read({ ...valid, low: { '999': 5 } })).toThrow(
      'prices.json: low["999"]: no Item or Gem has this id',
    );
  });

  test('a key that is not an id is rejected', () => {
    expect(read({ ...valid, low: { abc: 5 } })).toThrow('expected an integer id as key');
  });

  test('a missing price table is rejected', () => {
    expect(read({ updatedAt: '2026-10-07', low: {} })).toThrow(
      'prices.json: avg: expected an object, got nothing',
    );
  });

  test('a malformed date is rejected', () => {
    expect(read({ ...valid, updatedAt: '07.10.2026' })).toThrow(
      'prices.json: updatedAt: expected a date like 2026-10-07',
    );
  });
});
