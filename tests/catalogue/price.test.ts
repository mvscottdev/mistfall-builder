import { describe, expect, test } from 'vitest';
import pagePricesRaw from '../fixtures/prices-page.json?raw';
import catalogueRaw from '../../public/data/catalogue.json?raw';
import { joinPrices, priceOf } from '../../src/catalogue/price';
import { readCatalogue } from '../../src/catalogue/read-catalogue';
import { readPrices, type Prices } from '../../src/catalogue/read-prices';

const prices: Prices = {
  updatedAt: '2026-10-07',
  low: new Map([[1, 90]]),
  avg: new Map([
    [1, 120],
    [2, 150],
  ]),
};

describe('Price = low ?? avg', () => {
  test('low price wins over avg', () => {
    expect(priceOf(1, prices)).toBe(90);
  });

  test('avg is used when there is no low price', () => {
    expect(priceOf(2, prices)).toBe(150);
  });

  test('no low and no avg means no Price', () => {
    expect(priceOf(3, prices)).toBeNull();
  });
});

describe('price join on the real catalogue', () => {
  const data = readCatalogue(JSON.parse(catalogueRaw));
  const knownIds = new Set([...data.items, ...data.gems].map((x) => x.id));
  const catalogue = joinPrices(data, readPrices(JSON.parse(pagePricesRaw), knownIds));

  test('unpriced items stay in the catalogue with a null Price', () => {
    expect(catalogue.items).toHaveLength(1653);
    expect(catalogue.items.filter((item) => item.price === null)).toHaveLength(114);
  });

  test('every gem has a page price', () => {
    expect(catalogue.gems.every((gem) => gem.price !== null)).toBe(true);
  });

  test('price date comes from prices.json', () => {
    expect(catalogue.pricesUpdatedAt).toBe('2026-08-20');
  });
});
