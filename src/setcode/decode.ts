import type { Catalogue, ClassId, SetCodeLayout, SetSlot } from '../domain/types';
import { codeToBytes } from './base62';
import { SetCodeError } from './error';
import type { DecodedEntry, DecodedSet } from './types';

type CodeCatalogue = Pick<Catalogue, 'setCode' | 'classes' | 'items' | 'gems'>;

/** Bits are read low bit first, from bytes packed low bit first. */
function bitReader(bytes: number[]) {
  let pos = 0;
  return (width: number): number => {
    if (pos + width > bytes.length * 8) throw new SetCodeError('tooShort', 'the code ends early');
    let value = 0;
    for (let i = 0; i < width; i++, pos++) {
      value |= (((bytes[pos >> 3] ?? 0) >> (pos & 7)) & 1) << i;
    }
    return value >>> 0;
  };
}

/** The Class in a header, or null if the low 24 bits aren't the layout's constant. */
function classFromHeader(layout: SetCodeLayout, header: number): ClassId | null {
  const top = Math.floor(header / 0x1000000);
  if (header - top * 0x1000000 !== layout.headerBase || top % 4) return null;
  return top / 4;
}

function readEntry(
  catalogue: CodeCatalogue,
  classId: ClassId,
  slot: SetSlot,
  read: (width: number) => number,
): DecodedEntry {
  const { fieldBits } = catalogue.setCode;
  const index = read(fieldBits);
  if (!index) return { slot, item: null, gems: [] };
  // The Second weapon shares the weapon list and its indexes.
  const itemSlot = slot === 'weapon2' ? 'weapon' : slot;
  const item = catalogue.items.find(
    (it) =>
      it.slot === itemSlot &&
      it.codeIndex === index &&
      (!it.classes.length || it.classes.includes(classId)),
  );
  if (!item) {
    throw new SetCodeError('unknownItem', `no ${slot} with index ${index} for Class ${classId}`);
  }
  const gems = item.modSlots.map((mod) => {
    if (mod.kind !== 'socket') return null;
    const gemIndex = read(fieldBits);
    if (!gemIndex) return null;
    return (
      catalogue.gems.find((g) => g.codeIndex === gemIndex) ?? {
        unknown: true as const,
        codeIndex: gemIndex,
      }
    );
  });
  return { slot, item, gems };
}

/**
 * Reads a Set code. Gems come back aligned to each Item's Mod slots, so the
 * result re-encodes to the same string. Throws a SetCodeError if it can't.
 */
export function decodeSetCode(catalogue: CodeCatalogue, code: string): DecodedSet {
  const layout = catalogue.setCode;
  const read = bitReader(codeToBytes(code));
  const classId = classFromHeader(layout, read(layout.headerBits));
  if (classId === null) throw new SetCodeError('badHeader', 'not a Set code of this game version');
  if (!catalogue.classes.some((c) => c.id === classId)) {
    throw new SetCodeError('unknownClass', `the header names Class ${classId}`);
  }
  const slotByCodeSlot = new Map(
    Object.entries(layout.codeSlot).map(([slot, codeSlot]) => [codeSlot, slot as SetSlot]),
  );
  const entries = layout.order.map((codeSlot) => {
    const slot = slotByCodeSlot.get(codeSlot);
    // Without the Slot its Socket count is unknown, so nothing after it can be read.
    if (!slot) throw new SetCodeError('unmodelledSlot', `code slot ${codeSlot} has no Slot`);
    return readEntry(catalogue, classId, slot, read);
  });
  return { classId, entries };
}
