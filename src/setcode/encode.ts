import type { ClassId, SetCodeLayout, SetSlot } from '../domain/types';
import { bytesToCode } from './base62';
import type { CodedEntry } from './types';

/** An Item or Gem with no code index; the Set can't be written as a code. */
export interface MissingIndex {
  slot: SetSlot;
  what: 'item' | 'gem';
}

export type EncodeResult = { code: string } | { missing: MissingIndex[] };

/** Header: Class × 4 in the top bits, the layout's constant in the low 24. */
function headerFor(layout: SetCodeLayout, classId: ClassId): number {
  return classId * 4 * 0x1000000 + layout.headerBase;
}

/** Bits are written low bit first, packed into bytes low bit first. */
function bitWriter() {
  const bytes: number[] = [];
  let pos = 0;
  const write = (width: number, value: number) => {
    for (let i = 0; i < width; i++, pos++) {
      while (pos >> 3 >= bytes.length) bytes.push(0);
      if ((value >>> i) & 1) bytes[pos >> 3] = (bytes[pos >> 3] ?? 0) | (1 << (pos & 7));
    }
  };
  return { bytes, write };
}

/** Code fields of one Slot: the Item's index, then one Gem index per Socket. */
function slotFields(entry: CodedEntry, missing: MissingIndex[]): number[] {
  const { item, slot } = entry;
  // Index 0 = empty Slot: no Gem fields follow, or every later Slot would shift.
  if (!item) return [0];
  if (!item.codeIndex) missing.push({ slot, what: 'item' });
  const fields = [item.codeIndex];
  item.modSlots.forEach((mod, i) => {
    if (mod.kind !== 'socket') return;
    const gem = entry.gems[i];
    if (gem && !gem.codeIndex) missing.push({ slot, what: 'gem' });
    fields.push(gem?.codeIndex ?? 0);
  });
  return fields;
}

/**
 * Writes a Set as the game's import string. Slots not in `entries` are empty.
 * Gems are read by Mod slot position (`null` at a Built-in effect).
 */
export function encodeSet(
  layout: SetCodeLayout,
  classId: ClassId,
  entries: CodedEntry[],
): EncodeResult {
  const missing: MissingIndex[] = [];
  const fieldsByCodeSlot = new Map<number, number[]>();
  for (const entry of entries) {
    fieldsByCodeSlot.set(layout.codeSlot[entry.slot], slotFields(entry, missing));
  }
  if (missing.length) return { missing };

  const { bytes, write } = bitWriter();
  write(layout.headerBits, headerFor(layout, classId));
  for (const codeSlot of layout.order) {
    for (const field of fieldsByCodeSlot.get(codeSlot) ?? [0]) write(layout.fieldBits, field);
  }
  return { code: bytesToCode(bytes) };
}
