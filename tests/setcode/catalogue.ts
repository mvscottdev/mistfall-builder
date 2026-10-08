// Test helpers: the committed catalogue joined with the verified page's prices,
// and lookups from cfgIds to catalogue objects.
import catalogueRaw from '../../public/data/catalogue.json?raw';
import pagePricesRaw from '../fixtures/prices-page.json?raw';
import type { Catalogue, Gem, Item } from '../../src/domain/types';
import { joinPrices } from '../../src/catalogue/price';
import { readCatalogue } from '../../src/catalogue/read-catalogue';
import { readPrices } from '../../src/catalogue/read-prices';

function load(): Catalogue {
  const data = readCatalogue(JSON.parse(catalogueRaw));
  const knownIds = new Set([...data.items, ...data.gems].map((x) => x.id));
  return joinPrices(data, readPrices(JSON.parse(pagePricesRaw), knownIds));
}

export const catalogue = load();

export function itemById(id: number): Item {
  const item = catalogue.items.find((i) => i.id === id);
  if (!item) throw new Error(`no item ${id}`);
  return item;
}

export function gemById(id: number): Gem {
  const gem = catalogue.gems.find((g) => g.id === id);
  if (!gem) throw new Error(`no gem ${id}`);
  return gem;
}

export function codeOf(result: { code: string } | { missing: unknown[] }): string {
  if (!('code' in result)) throw new Error(`missing code indexes: ${JSON.stringify(result)}`);
  return result.code;
}
