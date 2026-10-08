import { describe, expect, test } from 'vitest';
import type { ClassId, Gem, Item, QualityId, Socket } from '../../src/domain/types';
import { decodeSetCode } from '../../src/setcode/decode';
import { encodeSet } from '../../src/setcode/encode';
import type { CodedEntry } from '../../src/setcode/types';
import { catalogue, codeOf } from './catalogue';

const universal = new Set(catalogue.shapes.filter((s) => s.universal).map((s) => s.id));

function fits(gem: Gem, socket: Socket): boolean {
  return (gem.shape === socket.shape || universal.has(socket.shape)) && gem.tier <= socket.tier;
}

function wears(item: Item, classId: ClassId): boolean {
  return !item.classes.length || item.classes.includes(classId);
}

/** Fills each Socket with a fitting Gem, picked by `seed` so Sets differ; boots stay empty. */
function gemsFor(item: Item, seed: number): (Gem | null)[] {
  return item.modSlots.map((mod, i) => {
    if (mod.kind !== 'socket' || item.slot === 'boots') return null;
    const fitting = catalogue.gems.filter((g) => fits(g, mod));
    return fitting[(seed * 7 + i * 13) % fitting.length] ?? null;
  });
}

/** One Item per main Slot of this Class and Quality (the last one listed), plus a Second weapon. */
function setFor(classId: ClassId, quality: QualityId): CodedEntry[] {
  const entries: CodedEntry[] = catalogue.slotOrder.flatMap((slot, seed) => {
    const items = catalogue.items.filter(
      (i) => i.slot === slot && i.quality === quality && wears(i, classId),
    );
    const item = items.at(-1);
    return item ? [{ slot, item, gems: gemsFor(item, seed + classId) }] : [];
  });
  const weapon2 = catalogue.items.find((i) => i.slot === 'weapon' && wears(i, classId));
  if (weapon2) entries.push({ slot: 'weapon2', item: weapon2, gems: gemsFor(weapon2, quality) });
  return entries;
}

const ids = (entries: CodedEntry[]) =>
  entries
    .filter((e) => e.item)
    .map((e) => ({
      slot: e.slot,
      item: (e.item as Item).id,
      gems: e.gems.map((g) => (g && 'id' in g ? g.id : null)),
    }))
    .sort((a, b) => a.slot.localeCompare(b.slot));

const cases = catalogue.classes.flatMap((c) =>
  catalogue.qualities.map((q) => [c.id, q.id] as const),
);

describe('Set code round trip', () => {
  test('covers all 6 Classes × all 5 Qualities', () => {
    expect(cases).toHaveLength(30);
  });

  test.each(cases)('Class %i, Quality %i: a Set decodes to itself', (classId, quality) => {
    const set = setFor(classId, quality);
    // Holy exists only for weapons, so a Holy Set is the weapon and the Second weapon.
    expect(set).toHaveLength(quality === 7 ? 2 : 9);
    const code = codeOf(encodeSet(catalogue.setCode, classId, set));
    const decoded = decodeSetCode(catalogue, code);
    expect(decoded.classId).toBe(classId);
    expect(ids(decoded.entries)).toEqual(ids(set));
    expect(codeOf(encodeSet(catalogue.setCode, classId, decoded.entries))).toBe(code);
  });

  test('a code containing an Item without a Price still decodes', () => {
    const unpriced = catalogue.items.find((i) => i.price === null);
    expect(unpriced).toBeDefined();
    const item = unpriced as Item;
    const classId = item.classes[0] ?? 10;
    const set = [{ slot: item.slot, item, gems: gemsFor(item, 1) }];
    const code = codeOf(encodeSet(catalogue.setCode, classId, set));
    const decoded = decodeSetCode(catalogue, code).entries.find((e) => e.slot === item.slot);
    expect(decoded?.item?.id).toBe(item.id);
  });
});
