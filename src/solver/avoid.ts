import type { AttributeId, SetPiece } from '../domain/types';
import { variantName, type AvoidCut } from './lp-model';
import type { SlotVariants, Variant } from './variants';

const givesLevels = (variant: Variant) => variant.vector.some((n) => n > 0);

function chosenVariant(slot: SlotVariants, piece: SetPiece): Variant {
  const found = slot.variants.find(
    (variant) =>
      variant.item.id === piece.itemId &&
      variant.gems.every((gem, i) => (gem?.id ?? null) === (piece.gemIds[i] ?? null)),
  );
  if (!found) throw new Error(`an earlier Set has no variant in ${slot.slot}`);
  return found;
}

/** Gems in the variant that give a Target levels, counted by id; Fillers left out. */
function targetGems(variant: Variant, order: AttributeId[]): Map<number, number> {
  const counts = new Map<number, number>();
  for (const gem of variant.gems) {
    if (gem && order.some((attribute) => gem.contribution[attribute])) {
      counts.set(gem.id, (counts.get(gem.id) ?? 0) + 1);
    }
  }
  return counts;
}

/**
 * The rows that keep the earlier Set number `i` from coming back: the new Set
 * must put another Item in a Slot the earlier one took levels from, or buy
 * fewer of some Gem it took levels from. The same Items and Gems moved between
 * Slots, or Fillers swapped, are not a different Set. Null when the earlier
 * Set took no levels from Items: then no Set can differ from it this way.
 */
export function avoidCut(
  slots: SlotVariants[],
  pieces: SetPiece[],
  order: AttributeId[],
  i: number,
): AvoidCut | null {
  const chosen = slots.map((slot) => {
    const piece = pieces.find((p) => p.slot === slot.slot);
    return piece ? chosenVariant(slot, piece) : null;
  });
  const sources = chosen.flatMap((variant, s) => (variant && givesLevels(variant) ? [s] : []));
  if (!sources.length) return null;

  const otherItem = `e_${i}`;
  const sameItems = sources.flatMap((s) =>
    (slots[s]?.variants ?? []).flatMap((variant, v) =>
      variant.item.id === chosen[s]?.item.id ? [variantName(s, v)] : [],
    ),
  );
  const rows = [` avoid${i}_items: ${[...sameItems, otherItem].join(' + ')} <= ${sources.length}`];
  const binaries = [otherItem];

  const earlierGems = new Map<number, number>();
  for (const variant of chosen) {
    if (!variant) continue;
    for (const [id, n] of targetGems(variant, order)) {
      earlierGems.set(id, (earlierGems.get(id) ?? 0) + n);
    }
  }
  for (const [id, count] of earlierGems) {
    const fewer = `d_${i}_${id}`;
    const terms: string[] = [];
    let most = 0;
    slots.forEach((slot, s) => {
      let slotMost = 0;
      slot.variants.forEach((variant, v) => {
        const n = variant.gems.filter((gem) => gem?.id === id).length;
        if (n) terms.push(`${n} ${variantName(s, v)}`);
        slotMost = Math.max(slotMost, n);
      });
      most += slotMost;
    });
    // fewer = 1 forces at most count - 1 of this Gem; `most` makes the row slack otherwise.
    const slack = most - count + 1;
    rows.push(` avoid${i}_gem${id}: ${[...terms, `${slack} ${fewer}`].join(' + ')} <= ${most}`);
    binaries.push(fewer);
  }
  rows.push(` avoid${i}: ${binaries.join(' + ')} >= 1`);
  return { rows, binaries };
}
