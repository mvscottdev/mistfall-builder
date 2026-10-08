import { describe, expect, test } from 'vitest';
import type { Locks } from '../../src/domain/types';
import { secondWeaponCandidates, slotCandidates } from '../../src/solver/candidates';
import { catalogueWith, item } from './make';
import { noLocks } from './page-catalogue';

const locks = (fields: Partial<Locks>): Locks => ({ ...noLocks, ...fields });
const ids = (items: { id: number }[]) => items.map((i) => i.id);

describe('Item candidates for a main Slot', () => {
  test('only Items of the Class are candidates; an Item with no Classes fits every Class', () => {
    const catalogue = catalogueWith([
      item({ id: 1, classes: [10] }),
      item({ id: 2, classes: [11] }),
      item({ id: 3, classes: [] }),
    ]);
    expect(ids(slotCandidates(catalogue, 'helmet', 10, noLocks))).toEqual([1, 3]);
  });

  test('an Item without a Price is not a candidate', () => {
    const catalogue = catalogueWith([item({ id: 1, price: null }), item({ id: 2 })]);
    expect(ids(slotCandidates(catalogue, 'helmet', 10, noLocks))).toEqual([2]);
  });

  test('with no quality Lock every quality is a candidate', () => {
    const catalogue = catalogueWith([item({ id: 1, quality: 3 }), item({ id: 2, quality: 6 })]);
    expect(ids(slotCandidates(catalogue, 'helmet', 10, noLocks))).toEqual([1, 2]);
  });

  test('the Set quality Lock keeps only that quality', () => {
    const catalogue = catalogueWith([item({ id: 1, quality: 3 }), item({ id: 2, quality: 6 })]);
    expect(ids(slotCandidates(catalogue, 'helmet', 10, locks({ quality: 6 })))).toEqual([2]);
  });

  test('a per-Slot quality override wins over the Set quality Lock', () => {
    const catalogue = catalogueWith([item({ id: 1, quality: 3 }), item({ id: 2, quality: 6 })]);
    const override = locks({ quality: 6, slotQuality: { helmet: 3 } });
    expect(ids(slotCandidates(catalogue, 'helmet', 10, override))).toEqual([1]);
    expect(ids(slotCandidates(catalogue, 'chest', 10, override))).toEqual([]);
  });

  test('the weapon type Lock keeps only that weapon type', () => {
    const catalogue = catalogueWith([
      item({ id: 1, slot: 'weapon', weaponType: 1 }),
      item({ id: 2, slot: 'weapon', weaponType: 2 }),
    ]);
    expect(ids(slotCandidates(catalogue, 'weapon', 10, locks({ weaponType: 2 })))).toEqual([2]);
  });

  test('amulet and ring base Locks keep only that base, each in its own Slot', () => {
    const catalogue = catalogueWith([
      item({ id: 1, slot: 'amulet', classes: [], base: 7 }),
      item({ id: 2, slot: 'amulet', classes: [], base: 8 }),
      item({ id: 3, slot: 'ring', classes: [], base: 9 }),
      item({ id: 4, slot: 'ring', classes: [], base: 5 }),
    ]);
    const baseLocks = locks({ amuletBase: 8, ringBase: 9 });
    expect(ids(slotCandidates(catalogue, 'amulet', 10, baseLocks))).toEqual([2]);
    expect(ids(slotCandidates(catalogue, 'ring', 10, baseLocks))).toEqual([3]);
  });
});

describe('Second weapon candidates', () => {
  const weapons = catalogueWith([
    item({ id: 1, slot: 'weapon', quality: 3, weaponType: 1 }),
    item({ id: 2, slot: 'weapon', quality: 7, weaponType: 2 }),
    item({ id: 3, slot: 'weapon', classes: [11] }),
    item({ id: 4, slot: 'weapon', price: null }),
  ]);

  test('the Second weapon ignores quality and weapon type Locks', () => {
    const mainLocks = locks({ quality: 3, slotQuality: { weapon: 3 }, weaponType: 1 });
    expect(ids(secondWeaponCandidates(weapons, 10, mainLocks))).toEqual([1, 2]);
  });

  test('an exact Item Lock keeps only that Item, whatever its type and quality Locks say', () => {
    const pinned = locks({ secondWeapon: 2, secondWeaponType: 1, secondWeaponQuality: 3 });
    expect(ids(secondWeaponCandidates(weapons, 10, pinned))).toEqual([2]);
  });

  test('its own weapon type and quality Locks keep only matching weapons', () => {
    expect(ids(secondWeaponCandidates(weapons, 10, locks({ secondWeaponType: 2 })))).toEqual([2]);
    expect(ids(secondWeaponCandidates(weapons, 10, locks({ secondWeaponQuality: 3 })))).toEqual([
      1,
    ]);
    const both = locks({ secondWeaponType: 1, secondWeaponQuality: 7 });
    expect(ids(secondWeaponCandidates(weapons, 10, both))).toEqual([]);
  });
});
