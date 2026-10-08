import type { Catalogue, Locks, Slot, Target } from '../domain/types';
import type { SolveRequest } from '../solver/solve';

/** What the user asked for: everything a Calculate click sends to the solver. */
export type Inputs = SolveRequest;

/** Top-up defaults of the old page (8 total, 2 per Attribute; unconfirmed in game). */
const DEFAULT_TOP_UP = { total: 8, perAttribute: 2 };

export const NO_LOCKS: Locks = {
  quality: null,
  slotQuality: {},
  weaponType: null,
  amuletBase: null,
  ringBase: null,
  secondWeapon: null,
};

/** First Class, no Targets, no Locks: the cheapest Set of the first Class. */
export function defaultInputs(catalogue: Catalogue): Inputs {
  const first = catalogue.classes[0];
  if (!first) throw new Error('the catalogue has no Classes');
  return { classId: first.id, targets: [], locks: NO_LOCKS, topUp: DEFAULT_TOP_UP };
}

function sameTargets(a: Target[], b: Target[]): boolean {
  // Order counts: the solver breaks ties in the order Targets were added.
  return (
    a.length === b.length &&
    a.every((t, i) => t.attribute === b[i]?.attribute && t.level === b[i]?.level)
  );
}

function sameLocks(a: Locks, b: Locks): boolean {
  const overridden = [...Object.keys(a.slotQuality), ...Object.keys(b.slotQuality)] as Slot[];
  return (
    a.quality === b.quality &&
    a.weaponType === b.weaponType &&
    a.amuletBase === b.amuletBase &&
    a.ringBase === b.ringBase &&
    a.secondWeapon === b.secondWeapon &&
    overridden.every((slot) => a.slotQuality[slot] === b.slotQuality[slot])
  );
}

/** True when both would give the same solve. */
export function sameInputs(a: Inputs, b: Inputs): boolean {
  return (
    a.classId === b.classId &&
    a.topUp.total === b.topUp.total &&
    a.topUp.perAttribute === b.topUp.perAttribute &&
    sameTargets(a.targets, b.targets) &&
    sameLocks(a.locks, b.locks)
  );
}
