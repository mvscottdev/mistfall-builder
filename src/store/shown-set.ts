import type {
  AttributeId,
  Catalogue,
  ClassId,
  Contribution,
  Gem,
  Item,
  SetSlot,
  SolvedSet,
} from '../domain/types';
import { encodeSet, type EncodeResult } from '../setcode/encode';
import type { DecodedSet, UnknownGem } from '../setcode/types';

/** One filled Slot of the Set on the doll. */
export interface ShownPiece {
  slot: SetSlot;
  item: Item;
  /** Aligned to the Item's Mod slots: null at Built-in effects and empty Sockets. */
  gems: (Gem | UnknownGem | null)[];
  /** Item + Gem gold; null if any part has no Price. */
  price: number | null;
}

/** A solved or decoded Set, ready to draw: the doll shows both the same way. */
export interface ShownSet {
  classId: ClassId;
  pieces: ShownPiece[];
  /** Solver gold; for a decoded Set, the sum of piece prices (null if any is unpriced). */
  cost: number | null;
  /** Attribute levels the main-Slot Items and Gems give; the Second weapon gives none. */
  levels: Record<AttributeId, number>;
  topUp: Record<AttributeId, number>;
  code: EncodeResult;
}

function addContribution(levels: Record<AttributeId, number>, contribution: Contribution) {
  for (const [attribute, n] of Object.entries(contribution)) {
    levels[Number(attribute)] = (levels[Number(attribute)] ?? 0) + n;
  }
}

/** Levels per Attribute from Built-in effects and Gems of the main Slots. */
function setLevels(pieces: ShownPiece[]): Record<AttributeId, number> {
  const levels: Record<AttributeId, number> = {};
  for (const piece of pieces) {
    if (piece.slot === 'weapon2') continue;
    piece.item.modSlots.forEach((mod, i) => {
      if (mod.kind === 'builtIn') return addContribution(levels, mod.contribution);
      const gem = piece.gems[i];
      if (gem && !('unknown' in gem)) addContribution(levels, gem.contribution);
    });
  }
  return levels;
}

function piecePrice(item: Item, gems: ShownPiece['gems']): number | null {
  let sum = item.price;
  for (const gem of gems) {
    if (gem === null || sum === null) continue;
    sum = 'unknown' in gem || gem.price === null ? null : sum + gem.price;
  }
  return sum;
}

function solvedPieces(catalogue: Catalogue, set: SolvedSet): ShownPiece[] {
  const items = new Map(catalogue.items.map((item) => [item.id, item]));
  const gems = new Map(catalogue.gems.map((gem) => [gem.id, gem]));
  return set.pieces.map((piece) => {
    const item = items.get(piece.itemId);
    if (!item) throw new Error(`solved Set has unknown Item ${piece.itemId}`);
    const pieceGems = piece.gemIds.map((id) => (id === null ? null : (gems.get(id) ?? null)));
    return { slot: piece.slot, item, gems: pieceGems, price: piecePrice(item, pieceGems) };
  });
}

function decodedPieces(set: DecodedSet): ShownPiece[] {
  return set.entries.flatMap((entry) =>
    entry.item
      ? [
          {
            slot: entry.slot,
            item: entry.item,
            gems: entry.gems,
            price: piecePrice(entry.item, entry.gems),
          },
        ]
      : [],
  );
}

function shownSet(
  catalogue: Catalogue,
  classId: ClassId,
  pieces: ShownPiece[],
  cost: number | null,
  topUp: Record<AttributeId, number>,
): ShownSet {
  return {
    classId,
    pieces,
    cost,
    levels: setLevels(pieces),
    topUp,
    code: encodeSet(catalogue.setCode, classId, pieces),
  };
}

export function shownSolvedSet(catalogue: Catalogue, classId: ClassId, set: SolvedSet): ShownSet {
  return shownSet(catalogue, classId, solvedPieces(catalogue, set), set.cost, set.topUp);
}

export function shownDecodedSet(catalogue: Catalogue, set: DecodedSet): ShownSet {
  const pieces = decodedPieces(set);
  const prices = pieces.map((piece) => piece.price);
  const cost = prices.includes(null)
    ? null
    : prices.reduce<number>((sum, price) => sum + (price ?? 0), 0);
  return shownSet(catalogue, set.classId, pieces, cost, {});
}
