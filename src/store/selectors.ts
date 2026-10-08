import type {
  Attribute,
  AttributeId,
  Catalogue,
  ClassId,
  Item,
  Quality,
  QualityId,
  Shape,
  ShapeId,
  Slot,
} from '../domain/types';
import { budget } from '../solver/budget';
import type { BuildState } from './build-store';
import { sameInputs } from './inputs';
import { shownDecodedSet, shownSolvedSet, type ShownSet } from './shown-set';

// Selectors must return the same reference while nothing they read changed,
// or useBuild re-renders forever; derived values are cached per input.

/** The shown result no longer matches the inputs (or there is none): Calculate would change it. */
export const selectStale = (state: BuildState): boolean =>
  state.resultInputs === null || !sameInputs(state.inputs, state.resultInputs);

/** A solved Set is shown for other inputs than the current ones (a decoded Set never is). */
export const selectOutdated = (state: BuildState): boolean =>
  state.result?.kind === 'solved' && selectStale(state);

export const selectClasses = (state: BuildState) => state.catalogue.classes;
export const selectQualities = (state: BuildState) => state.catalogue.qualities;
export const selectAttributes = (state: BuildState) => state.catalogue.attributes;
export const selectSlotLabels = (state: BuildState) => state.catalogue.slotLabels;
export const selectPricesUpdatedAt = (state: BuildState) => state.catalogue.pricesUpdatedAt;

function cachedById<T extends { id: number }>(list: (c: Catalogue) => T[]) {
  const cache = new WeakMap<Catalogue, Map<number, T>>();
  return (catalogue: Catalogue): Map<number, T> => {
    let byId = cache.get(catalogue);
    if (!byId) cache.set(catalogue, (byId = new Map(list(catalogue).map((x) => [x.id, x]))));
    return byId;
  };
}

const attributesById = cachedById((c) => c.attributes);
const qualitiesById = cachedById((c) => c.qualities);
const shapesById = cachedById((c) => c.shapes);

export const selectAttributeById = (state: BuildState): Map<AttributeId, Attribute> =>
  attributesById(state.catalogue);
export const selectQualityById = (state: BuildState): Map<QualityId, Quality> =>
  qualitiesById(state.catalogue);
export const selectShapeById = (state: BuildState): Map<ShapeId, Shape> =>
  shapesById(state.catalogue);

let budgetFor: { catalogue: Catalogue; classId: ClassId; locks: object; value: number } | null =
  null;

/** Most levels the Items can give for the current Class and Locks; caps each Target. */
export function selectBudget(state: BuildState): number {
  const { catalogue, inputs } = state;
  if (
    budgetFor?.catalogue !== catalogue ||
    budgetFor.classId !== inputs.classId ||
    budgetFor.locks !== inputs.locks
  ) {
    const value = budget(catalogue, inputs.classId, inputs.locks);
    budgetFor = { catalogue, classId: inputs.classId, locks: inputs.locks, value };
  }
  return budgetFor.value;
}

/** The Lock a Slot's base picker sets, if it has one. */
export type BaseLock = 'weaponType' | 'amuletBase' | 'ringBase';

export const BASE_LOCK: Partial<Record<Slot, BaseLock>> = {
  weapon: 'weaponType',
  amulet: 'amuletBase',
  ring: 'ringBase',
};

/** The base value a Lock compares: weapon type for weapons, base for amulets and rings. */
export const baseOf = (item: Item): number | undefined =>
  item.slot === 'weapon' ? item.weaponType : item.base;

const baseOptionsCache = new WeakMap<Catalogue, Map<string, Item[]>>();

/** One priced Item per base the Class can wear in a Slot, in catalogue order; it names the base. */
function baseOptions(catalogue: Catalogue, classId: ClassId, slot: Slot): Item[] {
  let bySlot = baseOptionsCache.get(catalogue);
  if (!bySlot) baseOptionsCache.set(catalogue, (bySlot = new Map()));
  const key = `${classId}:${slot}`;
  let options = bySlot.get(key);
  if (!options) {
    const seen = new Set<number>();
    options = catalogue.items.filter((item) => {
      const base = baseOf(item);
      if (item.slot !== slot || item.price === null || base === undefined || seen.has(base))
        return false;
      if (item.classes.length && !item.classes.includes(classId)) return false;
      seen.add(base);
      return true;
    });
    bySlot.set(key, options);
  }
  return options;
}

export const selectBaseOptions =
  (slot: Slot) =>
  (state: BuildState): Item[] =>
    baseOptions(state.catalogue, state.inputs.classId, slot);

const shownCache = new WeakMap<object, ShownSet>();

/** The result's Set as the doll draws it; null when the result holds no Set. */
export function selectShownSet(state: BuildState): ShownSet | null {
  const { result, resultInputs, catalogue } = state;
  if (!result) return null;
  let shown = shownCache.get(result);
  if (!shown) {
    if (result.kind === 'solved' && resultInputs) {
      shown = shownSolvedSet(catalogue, resultInputs.classId, result.set);
    } else if (result.kind === 'decoded') {
      shown = shownDecodedSet(catalogue, result.set);
    } else return null;
    shownCache.set(result, shown);
  }
  return shown;
}
