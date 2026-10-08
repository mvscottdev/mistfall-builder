import type { ClassId, Gem, Item, SetSlot } from '../domain/types';

/** A Gem index the catalogue doesn't know. Kept so the code re-encodes unchanged. */
export interface UnknownGem {
  unknown: true;
  codeIndex: number;
}

/**
 * One Slot of a Set as the Set code sees it. `gems` is aligned to the Item's
 * Mod slots: `null` at a Built-in effect and at an empty Socket.
 */
export interface CodedEntry {
  slot: SetSlot;
  /** null = empty Slot. */
  item: Pick<Item, 'codeIndex' | 'modSlots'> | null;
  gems: (Pick<Gem, 'codeIndex'> | null)[];
}

export interface DecodedEntry extends CodedEntry {
  item: Item | null;
  gems: (Gem | UnknownGem | null)[];
}

/** A Set read from a Set code: the Class from its header and every code Slot in code order. */
export interface DecodedSet {
  classId: ClassId;
  entries: DecodedEntry[];
}
