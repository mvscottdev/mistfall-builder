import { describe, expect, test } from 'vitest';
import goldenRaw from '../fixtures/golden.json?raw';
import type { SetSlot } from '../../src/domain/types';
import { decodeSetCode } from '../../src/setcode/decode';
import { shownDecodedSet, shownSolvedSet } from '../../src/store/shown-set';
import { pageCatalogue } from '../solver/page-catalogue';

const catalogue = pageCatalogue();

interface Golden {
  label: string;
  input: { classId: number };
  output: {
    cost: number;
    code: string;
    levels: Record<string, number>;
    path: { slot: SetSlot; itemId: number; gems: (number | null)[] }[];
  } | null;
}
const scenarios: Golden[] = Object.values(JSON.parse(goldenRaw).scenarios);
const golden = (label: string) => {
  const scenario = scenarios.find((s) => s.label === label);
  if (!scenario?.output) throw new Error(`no golden output for ${label}`);
  return { classId: scenario.input.classId, ...scenario.output };
};

function solvedFrom(label: string) {
  const g = golden(label);
  const set = {
    cost: g.cost,
    pieces: g.path.map((p) => ({ slot: p.slot, itemId: p.itemId, gemIds: p.gems })),
    topUp: {},
    topUpUsed: 0,
  };
  return { g, shown: shownSolvedSet(catalogue, g.classId, set) };
}

describe('shown Set', () => {
  test.each(['cls10-no-targets', 'cls10-n3', 'cls10-weapon2Lock'])(
    '%s: a solved Set shows the golden code and item levels',
    (label) => {
      const { g, shown } = solvedFrom(label);
      expect(shown.code).toEqual({ code: g.code });
      expect(shown.levels).toEqual(
        Object.fromEntries(Object.entries(g.levels).map(([k, v]) => [Number(k), v])),
      );
      expect(shown.cost).toBe(g.cost);
    },
  );

  test('the Second weapon adds no Attribute levels', () => {
    const { shown } = solvedFrom('cls10-weapon2Lock');
    const weapon2 = shown.pieces.find((piece) => piece.slot === 'weapon2');
    expect(weapon2).toBeDefined();
    const withoutIt = shownSolvedSet(catalogue, 10, {
      cost: 0,
      pieces: shown.pieces
        .filter((piece) => piece.slot !== 'weapon2')
        .map((piece) => ({
          slot: piece.slot,
          itemId: piece.item.id,
          gemIds: piece.gems.map((gem) => (gem && 'id' in gem ? gem.id : null)),
        })),
      topUp: {},
      topUpUsed: 0,
    });
    expect(shown.levels).toEqual(withoutIt.levels);
  });

  test('a decoded Set costs the sum of its pieces and leaves out empty Slots', () => {
    const { g, shown: solved } = solvedFrom('cls11-q7-holy-2targets');
    const decoded = shownDecodedSet(catalogue, decodeSetCode(catalogue, g.code));
    expect(decoded.pieces.map((p) => p.slot)).toEqual(solved.pieces.map((p) => p.slot));
    expect(decoded.cost).toBe(g.cost);
    expect(decoded.code).toEqual({ code: g.code });
  });

  test('a decoded Set with an unpriced Item has no cost', () => {
    const { g } = solvedFrom('cls10-no-targets');
    const decoded = decodeSetCode(catalogue, g.code);
    const first = decoded.entries.find((e) => e.item);
    if (!first?.item) throw new Error('no Item');
    first.item = { ...first.item, price: null };
    expect(shownDecodedSet(catalogue, decoded).cost).toBeNull();
  });
});
