import { describe, expect, test } from 'vitest';
import type { Item } from '../../src/domain/types';
import { locksForClass } from '../../src/store/class-locks';
import { NO_LOCKS } from '../../src/store/inputs';
import { pageCatalogue } from '../solver/page-catalogue';

const catalogue = pageCatalogue();
const weaponsOf = (classId: number): Item[] =>
  catalogue.items.filter(
    (it) => it.slot === 'weapon' && it.price !== null && it.classes.includes(classId),
  );

// Two Classes with a weapon type only the first has, for the drop cases.
const [from, to] = [10, 11];
const fromWeapon = weaponsOf(from).find(
  (w) => !weaponsOf(to).some((other) => other.weaponType === w.weaponType),
);
const toWeapon = weaponsOf(to)[0];
if (!fromWeapon?.weaponType || !toWeapon?.weaponType) {
  throw new Error(`Class ${from} needs a weapon type Class ${to} lacks`);
}
const fromType = fromWeapon.weaponType;
const toType = toWeapon.weaponType;

describe('locksForClass', () => {
  test('a weapon type the new Class has no weapon of is dropped', () => {
    const locks = { ...NO_LOCKS, weaponType: fromType };
    expect(locksForClass(catalogue, to, locks).weaponType).toBeNull();
  });

  test('a Second weapon the new Class can’t wear is dropped', () => {
    const locks = { ...NO_LOCKS, secondWeapon: fromWeapon.id };
    expect(locksForClass(catalogue, to, locks).secondWeapon).toBeNull();
  });

  test('a Second weapon type the new Class has no weapon of is dropped; one it has stays', () => {
    expect(
      locksForClass(catalogue, to, { ...NO_LOCKS, secondWeaponType: fromType }).secondWeaponType,
    ).toBeNull();
    const kept = { ...NO_LOCKS, secondWeaponType: toType };
    expect(locksForClass(catalogue, to, kept)).toBe(kept);
  });

  test('weapon Locks that exist for the new Class stay', () => {
    const locks = { ...NO_LOCKS, weaponType: toType, secondWeapon: toWeapon.id };
    expect(locksForClass(catalogue, to, locks)).toBe(locks);
  });

  test('quality and amulet/ring base Locks stay on any Class change', () => {
    const locks = {
      ...NO_LOCKS,
      quality: 5,
      slotQuality: { weapon: 7 },
      amuletBase: 1,
      ringBase: 2,
      weaponType: fromType,
    };
    expect(locksForClass(catalogue, to, locks)).toEqual({ ...locks, weaponType: null });
  });
});
