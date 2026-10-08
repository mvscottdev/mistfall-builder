// The verified old page's data: catalogue.json joined with the page's own prices.
import pagePricesRaw from '../fixtures/prices-page.json?raw';
import catalogueRaw from '../../public/data/catalogue.json?raw';
import { joinPrices } from '../../src/catalogue/price';
import { readCatalogue } from '../../src/catalogue/read-catalogue';
import { readPrices } from '../../src/catalogue/read-prices';
import type { Catalogue, Locks } from '../../src/domain/types';

export function pageCatalogue(): Catalogue {
  const data = readCatalogue(JSON.parse(catalogueRaw));
  const knownIds = new Set([...data.items, ...data.gems].map((x) => x.id));
  return joinPrices(data, readPrices(JSON.parse(pagePricesRaw), knownIds));
}

export const noLocks: Locks = {
  quality: null,
  slotQuality: {},
  weaponType: null,
  amuletBase: null,
  ringBase: null,
  secondWeapon: null,
};
