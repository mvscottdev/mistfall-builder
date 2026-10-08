import type { AttributeId, Catalogue, ClassId, Locks, SetSlot } from '../domain/types';
import { secondWeaponCandidates, slotCandidates, type PricedItem } from './candidates';
import { modOptions, type ModOption, type PricedGem } from './mod-options';

/** One way to fill a Slot: an Item plus a Gem per Socket. */
export interface Variant {
  item: PricedItem;
  /** Aligned to the Item's Mod slots; null at Built-in effects and empty Sockets. */
  gems: (PricedGem | null)[];
  /** Item + Gem prices. */
  price: number;
  /** Levels given per Target, in Target order. */
  vector: number[];
}

export interface SlotVariants {
  slot: SetSlot;
  variants: Variant[];
}

function cartesian(lists: ModOption[][]): ModOption[][] {
  let combos: ModOption[][] = [[]];
  for (const options of lists) {
    combos = combos.flatMap((combo) => options.map((option) => [...combo, option]));
  }
  return combos;
}

/**
 * Every Item × Gem combination for a main Slot, deduped by projected vector:
 * the cheapest kept, the first found on a price tie. Every Socket gets a Gem,
 * so an Item with a Socket no priced Gem fits gives no variants. A Socket no
 * Target needs projects to the zero vector for every Gem, so dedup leaves it
 * the cheapest fitting Gem: the Filler.
 */
export function mainSlotVariants(
  catalogue: Catalogue,
  items: PricedItem[],
  order: AttributeId[],
): Variant[] {
  const cheapest = new Map<string, Variant>();
  for (const item of items) {
    const optionLists = item.modSlots.map((mod) => modOptions(catalogue, mod, order));
    for (const combo of cartesian(optionLists)) {
      const vector = order.map((_, d) =>
        combo.reduce((sum, option) => sum + (option.vector[d] ?? 0), 0),
      );
      const price = item.price + combo.reduce((sum, option) => sum + option.price, 0);
      const key = vector.join(',');
      const current = cheapest.get(key);
      if (!current || price < current.price) {
        cheapest.set(key, { item, gems: combo.map((option) => option.gem), price, vector });
      }
    }
  }
  return [...cheapest.values()];
}

/** The Second weapon gives no Attributes: one variant per Item, Sockets left empty. */
function secondWeaponVariants(items: PricedItem[], order: AttributeId[]): Variant[] {
  return items.map((item) => ({
    item,
    gems: item.modSlots.map(() => null),
    price: item.price,
    vector: order.map(() => 0),
  }));
}

/**
 * Variants for every active Slot in Slot order, then the Second weapon.
 * A Slot with no candidate Items is inactive and left out.
 */
export function setVariants(
  catalogue: Catalogue,
  classId: ClassId,
  locks: Locks,
  order: AttributeId[],
): SlotVariants[] {
  const slots: SlotVariants[] = [];
  for (const slot of catalogue.slotOrder) {
    const items = slotCandidates(catalogue, slot, classId, locks);
    if (items.length) slots.push({ slot, variants: mainSlotVariants(catalogue, items, order) });
  }
  const secondWeapons = secondWeaponCandidates(catalogue, classId, locks);
  if (secondWeapons.length) {
    slots.push({ slot: 'weapon2', variants: secondWeaponVariants(secondWeapons, order) });
  }
  return slots;
}
