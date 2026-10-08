import type { Item, Locks, Target } from '../domain/types';
import type { DecodedSet } from '../setcode/types';
import { setLevels } from './shown-set';

/**
 * Inputs that make the next Calculate give back a decoded Set (ADR-0010):
 * - Targets: every Attribute the main-Slot Items give (Filler included), at its
 *   level, by Attribute id; the Second weapon gives none.
 * - Base Locks and per-Slot quality overrides are cleared, then each filled main
 *   Slot gets its Item's quality, plus weapon type / amulet / ring base.
 * - The Set quality Lock stays; empty Slots get no Lock.
 * - The Second weapon is pinned to its exact Item.
 */
export function loadAsTarget(set: DecodedSet, locks: Locks): { targets: Target[]; locks: Locks } {
  const filled = set.entries.flatMap((entry) =>
    entry.item ? [{ ...entry, item: entry.item as Item }] : [],
  );
  const targets = Object.entries(setLevels(filled))
    .map(([attribute, level]) => ({ attribute: Number(attribute), level }))
    .filter((target) => target.level > 0)
    .sort((a, b) => a.attribute - b.attribute);

  const loaded: Locks = {
    quality: locks.quality,
    slotQuality: {},
    weaponType: null,
    amuletBase: null,
    ringBase: null,
    secondWeapon: null,
    secondWeaponType: null,
    secondWeaponQuality: null,
  };
  for (const { slot, item } of filled) {
    if (slot === 'weapon2') {
      loaded.secondWeapon = item.id;
      continue;
    }
    loaded.slotQuality[slot] = item.quality;
    if (slot === 'weapon') loaded.weaponType = item.weaponType ?? null;
    if (slot === 'amulet') loaded.amuletBase = item.base ?? null;
    if (slot === 'ring') loaded.ringBase = item.base ?? null;
  }
  return { targets, locks: loaded };
}
