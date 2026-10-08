import { describe, expect, test } from 'vitest';
import { slotCandidates } from '../../src/solver/candidates';
import { mainSlotVariants, setVariants } from '../../src/solver/variants';
import { builtIn, catalogueWith, gem, item, ROUND, socket, SQUARE, TRIANGLE } from './make';
import { noLocks, pageCatalogue } from './page-catalogue';

function variantsOf(catalogue: ReturnType<typeof catalogueWith>, order: number[]) {
  return mainSlotVariants(catalogue, slotCandidates(catalogue, 'helmet', 10, noLocks), order);
}

const summary = (variants: ReturnType<typeof variantsOf>) =>
  variants.map((v) => ({
    item: v.item.id,
    gems: v.gems.map((g) => g?.id ?? null),
    price: v.price,
    vector: v.vector,
  }));

describe('Slot variants', () => {
  test('every main-Slot Socket gets a Gem: no variant leaves a Socket empty', () => {
    const catalogue = catalogueWith(
      [item({ id: 1, modSlots: [socket(TRIANGLE), socket(SQUARE)] })],
      [gem({ id: 10, shape: TRIANGLE }), gem({ id: 20, shape: SQUARE, contribution: { 1: 1 } })],
    );
    expect(summary(variantsOf(catalogue, [0, 1]))).toEqual([
      { item: 1, gems: [10, 20], price: 120, vector: [1, 1] },
    ]);
  });

  test('an Item with a Socket no priced Gem fits gives no variants', () => {
    const catalogue = catalogueWith(
      [item({ id: 1, modSlots: [socket(SQUARE)] }), item({ id: 2, modSlots: [socket(TRIANGLE)] })],
      [gem({ id: 10, shape: TRIANGLE }), gem({ id: 20, shape: SQUARE, price: null })],
    );
    expect(variantsOf(catalogue, [0]).map((v) => v.item.id)).toEqual([2]);
  });

  test('a Gem fits if its Shape matches or the Socket is round, and its tier is at most the Socket tier', () => {
    const catalogue = catalogueWith(
      [item({ id: 1, modSlots: [socket(ROUND, 1)] })],
      [
        gem({ id: 10, shape: TRIANGLE, contribution: { 0: 1 } }),
        gem({ id: 20, shape: SQUARE, contribution: { 1: 1 } }),
        gem({ id: 30, shape: SQUARE, tier: 2, contribution: { 2: 1 } }),
      ],
    );
    expect(variantsOf(catalogue, [0, 1, 2]).map((v) => v.gems[0]?.id)).toEqual([10, 20]);
  });

  test('Gems with the same contribution on the Targets collapse to the cheapest', () => {
    const catalogue = catalogueWith(
      [item({ id: 1, modSlots: [socket(TRIANGLE)] })],
      [
        gem({ id: 10, contribution: { 0: 1, 5: 1 }, price: 30 }),
        gem({ id: 20, contribution: { 0: 1 }, price: 20 }),
        gem({ id: 30, contribution: { 0: 1, 6: 1 }, price: 25 }),
      ],
    );
    // Attribute 5 and 6 aren't targeted: all three give [1] on Target 0.
    expect(summary(variantsOf(catalogue, [0]))).toEqual([
      { item: 1, gems: [20], price: 120, vector: [1] },
    ]);
  });

  test('on a price tie the first Gem in catalogue order is kept', () => {
    const catalogue = catalogueWith(
      [item({ id: 1, modSlots: [socket(TRIANGLE)] })],
      [gem({ id: 10, price: 20 }), gem({ id: 20, price: 20 })],
    );
    expect(variantsOf(catalogue, [0])[0]?.gems[0]?.id).toBe(10);
  });

  test('Item+Gem combos with the same vector collapse to the cheapest; the first found wins a tie', () => {
    const catalogue = catalogueWith(
      [
        item({ id: 1, price: 100, modSlots: [socket(TRIANGLE)] }),
        item({ id: 2, price: 90, modSlots: [socket(TRIANGLE)] }),
        item({ id: 3, price: 90, modSlots: [socket(TRIANGLE)] }),
      ],
      [gem({ id: 10 })],
    );
    expect(summary(variantsOf(catalogue, [0]))).toEqual([
      { item: 2, gems: [10], price: 100, vector: [1] },
    ]);
  });

  test('a vector keeps the position where it was first found, even when a cheaper combo replaces it', () => {
    const catalogue = catalogueWith(
      [
        item({ id: 1, price: 100, modSlots: [socket(TRIANGLE)] }),
        item({ id: 2, price: 50, modSlots: [socket(ROUND)] }),
      ],
      [
        gem({ id: 20, shape: SQUARE, contribution: { 1: 1 } }),
        gem({ id: 10, shape: TRIANGLE, contribution: { 0: 1 } }),
      ],
    );
    // Item 1 finds [1, 0] first; Item 2 finds [0, 1], then a cheaper [1, 0].
    expect(summary(variantsOf(catalogue, [0, 1])).map((v) => [v.item, v.vector])).toEqual([
      [2, [1, 0]],
      [2, [0, 1]],
    ]);
  });

  test('Built-in effects add their vector at no extra cost', () => {
    const catalogue = catalogueWith(
      [item({ id: 1, modSlots: [builtIn({ 0: 2 }), socket(TRIANGLE)] })],
      [gem({ id: 10, contribution: { 0: 1 } })],
    );
    expect(summary(variantsOf(catalogue, [0]))).toEqual([
      { item: 1, gems: [null, 10], price: 110, vector: [3] },
    ]);
  });
});

describe('Set variants', () => {
  const catalogue = pageCatalogue();

  test('a Slot with no candidate Items is inactive and left out', () => {
    const slots = setVariants(catalogue, 11, { ...noLocks, quality: 7 }, [9, 15]);
    expect(slots.map((s) => s.slot)).toEqual(['weapon', 'weapon2']);
  });

  test('the Second weapon has its own pool: one variant per Item, empty Sockets, no Attributes', () => {
    const slots = setVariants(catalogue, 10, { ...noLocks, quality: 3 }, [0, 1]);
    const second = slots.find((s) => s.slot === 'weapon2');
    const classWeapons = catalogue.items.filter(
      (i) => i.slot === 'weapon' && i.classes.includes(10) && i.price !== null,
    );
    expect(second?.variants.map((v) => v.item.id)).toEqual(classWeapons.map((i) => i.id));
    for (const v of second?.variants ?? []) {
      expect(v.gems.every((g) => g === null)).toBe(true);
      expect(v.vector).toEqual([0, 0]);
      expect(v.price).toBe(v.item.price);
    }
  });
});
