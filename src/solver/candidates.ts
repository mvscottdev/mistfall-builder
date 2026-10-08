import type { Catalogue, ClassId, Item, Locks, QualityId, Slot } from '../domain/types';

/** An Item the solver may pick: it has a Price. */
export type PricedItem = Item & { price: number };

function isPriced(item: Item): item is PricedItem {
  return item.price !== null;
}

function fitsClass(item: Item, classId: ClassId): boolean {
  return item.classes.length === 0 || item.classes.includes(classId);
}

/** Per-Slot override, else the Set quality Lock, else any (null). */
function slotQuality(slot: Slot, locks: Locks): QualityId | null {
  return locks.slotQuality[slot] ?? locks.quality;
}

function fitsBaseLock(item: Item, locks: Locks): boolean {
  if (item.slot === 'weapon')
    return locks.weaponType === null || item.weaponType === locks.weaponType;
  if (item.slot === 'amulet') return locks.amuletBase === null || item.base === locks.amuletBase;
  if (item.slot === 'ring') return locks.ringBase === null || item.base === locks.ringBase;
  return true;
}

/** Priced Items for a main Slot that the Class can wear and the Locks allow, in catalogue order. */
export function slotCandidates(
  catalogue: Catalogue,
  slot: Slot,
  classId: ClassId,
  locks: Locks,
): PricedItem[] {
  const quality = slotQuality(slot, locks);
  return catalogue.items.filter(
    (item): item is PricedItem =>
      isPriced(item) &&
      item.slot === slot &&
      fitsClass(item, classId) &&
      (quality === null || item.quality === quality) &&
      fitsBaseLock(item, locks),
  );
}

/**
 * Priced weapons of the Class for the Second weapon. Only its own Locks apply:
 * an exact Item, else its weapon type and quality; never the main Slots' Locks.
 */
export function secondWeaponCandidates(
  catalogue: Catalogue,
  classId: ClassId,
  locks: Locks,
): PricedItem[] {
  return catalogue.items.filter(
    (item): item is PricedItem =>
      isPriced(item) &&
      item.slot === 'weapon' &&
      fitsClass(item, classId) &&
      (locks.secondWeapon !== null
        ? item.id === locks.secondWeapon
        : (locks.secondWeaponType === null || item.weaponType === locks.secondWeaponType) &&
          (locks.secondWeaponQuality === null || item.quality === locks.secondWeaponQuality)),
  );
}
