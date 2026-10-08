import { describe, expect, test } from 'vitest';
import gameCodesRaw from '../fixtures/game-codes.json?raw';
import { decodeSetCode } from '../../src/setcode/decode';
import { encodeSet } from '../../src/setcode/encode';
import type { DecodedSet } from '../../src/setcode/types';
import { catalogue, codeOf } from './catalogue';

interface GameEquip {
  cfgId: number;
  slot: number;
  gems?: number[];
}

const pairs = (JSON.parse(gameCodesRaw) as { pairs: { code: string; equips: GameEquip[] }[] })
  .pairs;

/**
 * A decoded Set in the game's logged plan format: Gem cfgIds per Socket,
 * 0 = empty; no `gems` for an empty Slot or an Item without Sockets.
 */
function asPlan(decoded: DecodedSet): GameEquip[] {
  return decoded.entries.map(({ slot, item, gems }) => {
    const codeSlot = catalogue.setCode.codeSlot[slot];
    if (!item) return { cfgId: 0, slot: codeSlot };
    const socketGems = gems.filter((_, i) => item.modSlots[i]?.kind === 'socket');
    if (!socketGems.length) return { cfgId: item.id, slot: codeSlot };
    return {
      cfgId: item.id,
      slot: codeSlot,
      gems: socketGems.map((g) => (g && 'id' in g ? g.id : 0)),
    };
  });
}

describe('Set codes exported by the game', () => {
  test('all 23 logged pairs are checked', () => {
    expect(pairs).toHaveLength(23);
  });

  test.each(pairs.map((p, i) => [i, p] as const))(
    'pair %i decodes to the plan the game logged',
    (_, pair) => {
      expect(asPlan(decodeSetCode(catalogue, pair.code))).toEqual(pair.equips);
    },
  );

  test.each(pairs.map((p, i) => [i, p] as const))(
    'pair %i re-encodes to the identical string',
    (_, pair) => {
      const decoded = decodeSetCode(catalogue, pair.code);
      expect(codeOf(encodeSet(catalogue.setCode, decoded.classId, decoded.entries))).toBe(
        pair.code,
      );
    },
  );

  test('decoded Gems sit at their Socket’s Mod slot, never at a Built-in effect', () => {
    const decoded = pairs.map((pair) => decodeSetCode(catalogue, pair.code));
    for (const { item, gems } of decoded.flatMap((set) => set.entries)) {
      if (!item) continue;
      expect(gems).toHaveLength(item.modSlots.length);
      item.modSlots.forEach((mod, i) => mod.kind === 'builtIn' && expect(gems[i]).toBeNull());
    }
    // These 13 codes hold a Gem after a Built-in effect: the case that breaks if
    // decoding gave Gems per Socket while encoding reads them per Mod slot.
    const gemAfterBuiltIn = decoded.filter((set) =>
      set.entries.some(({ item, gems }) => {
        const firstBuiltIn = item?.modSlots.findIndex((m) => m.kind === 'builtIn') ?? -1;
        return firstBuiltIn >= 0 && gems.some((g, i) => g && i > firstBuiltIn);
      }),
    );
    expect(gemAfterBuiltIn).toHaveLength(13);
  });
});
