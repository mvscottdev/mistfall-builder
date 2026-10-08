import type { Locks, Target } from '../domain/types';
import type { DecodedSet } from '../setcode/types';
import type { Inputs } from './inputs';
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
    entry.item ? [{ ...entry, item: entry.item }] : [],
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

/**
 * The inputs Load as target leaves: Top-up goes to 0, or Calculate would trade
 * Items for Top-up levels and show a cheaper, different Set.
 */
export function loadedInputs(set: DecodedSet, inputs: Inputs): Inputs {
  return { ...inputs, ...loadAsTarget(set, inputs.locks), topUp: { total: 0, perAttribute: 0 } };
}
