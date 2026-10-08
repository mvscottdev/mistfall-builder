// Small hand-made catalogues for solver rule tests.
import type { Catalogue, Gem, Item, ModSlot } from '../../src/domain/types';
import { pageCatalogue } from './page-catalogue';

export const TRIANGLE = 0;
export const SQUARE = 1;
export const ROUND = 4;

const base = pageCatalogue();

export function item(fields: Partial<Item> & Pick<Item, 'id'>): Item {
  return {
    slot: 'helmet',
    classes: [10],
    quality: 3,
    modSlots: [],
    codeIndex: 1,
    iconId: 1,
    price: 100,
    ...fields,
  };
}

export function gem(fields: Partial<Gem> & Pick<Gem, 'id'>): Gem {
  return { shape: TRIANGLE, tier: 1, contribution: { 0: 1 }, codeIndex: 1, price: 10, ...fields };
}

export const socket = (shape: number, tier = 1): ModSlot => ({ kind: 'socket', shape, tier });
export const builtIn = (contribution: Record<number, number>): ModSlot => ({
  kind: 'builtIn',
  contribution,
});

/** The real shapes, attributes and slots, with only the given Items and Gems. */
export function catalogueWith(items: Item[], gems: Gem[] = []): Catalogue {
  return { ...base, items, gems };
}
