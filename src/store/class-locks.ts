import type { Catalogue, ClassId, Item, Locks } from '../domain/types';

/** Priced weapons the Class can wear: the only ones the solver offers it. */
function classWeapons(catalogue: Catalogue, classId: ClassId): Item[] {
  return catalogue.items.filter(
    (item) =>
      item.slot === 'weapon' &&
      item.price !== null &&
      (item.classes.length === 0 || item.classes.includes(classId)),
  );
}

/**
 * The Locks with the weapon type and Second weapon Locks dropped if the Class
 * has no such weapon. Quality and amulet/ring base Locks don't depend on the Class.
 * Weapon types are checked at any quality: in the Snapshot every Class has each of
 * its weapon types at every quality, so a quality Lock never empties the weapon Slot.
 */
export function locksForClass(catalogue: Catalogue, classId: ClassId, locks: Locks): Locks {
  const weapons = classWeapons(catalogue, classId);
  const keepType =
    locks.weaponType === null || weapons.some((item) => item.weaponType === locks.weaponType);
  const keepSecond =
    locks.secondWeapon === null || weapons.some((item) => item.id === locks.secondWeapon);
  if (keepType && keepSecond) return locks;
  return {
    ...locks,
    weaponType: keepType ? locks.weaponType : null,
    secondWeapon: keepSecond ? locks.secondWeapon : null,
  };
}
