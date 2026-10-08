// @vitest-environment node
import highsLoader from 'highs';
import { beforeAll, describe, expect, test } from 'vitest';
import goldenRaw from '../fixtures/golden.json?raw';
import type { SetSlot } from '../../src/domain/types';
import { decodeSetCode } from '../../src/setcode/decode';
import type { Highs } from '../../src/solver/mip';
import { solveSet } from '../../src/solver/solve-set';
import { NO_LOCKS } from '../../src/store/inputs';
import { loadAsTarget } from '../../src/store/load-as-target';
import { shownSolvedSet } from '../../src/store/shown-set';
import { pageCatalogue } from '../solver/page-catalogue';

const catalogue = pageCatalogue();

interface Golden {
  label: string;
  input: { topup?: { total: number; perAttr: number } };
  output: {
    cost: number;
    code: string;
    levels: Record<string, number>;
    path: { slot: SetSlot; itemId: number; gems: (number | null)[] }[];
  } | null;
}
const solved = (Object.values(JSON.parse(goldenRaw).scenarios) as Golden[]).filter(
  (s) => s.output !== null,
);
const golden = (label: string) => {
  const scenario = solved.find((s) => s.label === label);
  if (!scenario?.output) throw new Error(`no golden output for ${label}`);
  return scenario.output;
};

let highs: Highs;
beforeAll(async () => {
  highs = (await highsLoader()) as unknown as Highs;
});

describe('Load as target (ADR-0010)', () => {
  test('Targets are every Attribute the main-Slot Items give, at its level, by Attribute id', () => {
    const g = golden('cls10-n3');
    const { targets } = loadAsTarget(decodeSetCode(catalogue, g.code), NO_LOCKS);
    expect(targets).toEqual(
      Object.entries(g.levels).map(([id, level]) => ({ attribute: Number(id), level })),
    );
  });

  test('the Second weapon gives no Targets and is pinned to its exact Item', () => {
    const g = golden('cls10-weapon2Lock');
    const withoutIt = g.path.filter((p) => p.slot !== 'weapon2');
    const { targets, locks } = loadAsTarget(decodeSetCode(catalogue, g.code), NO_LOCKS);
    expect(locks.secondWeapon).toBe(g.path.find((p) => p.slot === 'weapon2')?.itemId);
    expect(targets.reduce((n, t) => n + t.level, 0)).toBe(
      Object.values(g.levels).reduce((n, l) => n + l, 0),
    );
    expect(withoutIt.length).toBeLessThan(g.path.length);
  });

  test('each filled Slot gets its quality, plus weapon type / amulet / ring base', () => {
    const g = golden('cls10-no-targets');
    const decoded = decodeSetCode(catalogue, g.code);
    const { locks } = loadAsTarget(decoded, NO_LOCKS);
    const item = (slot: SetSlot) => decoded.entries.find((e) => e.slot === slot)?.item;
    for (const slot of [
      'weapon',
      'helmet',
      'chest',
      'bracers',
      'pants',
      'boots',
      'amulet',
      'ring',
    ] as const) {
      expect(locks.slotQuality[slot]).toBe(item(slot)?.quality);
    }
    expect(locks.weaponType).toBe(item('weapon')?.weaponType);
    expect(locks.amuletBase).toBe(item('amulet')?.base);
    expect(locks.ringBase).toBe(item('ring')?.base);
  });

  test('old base Locks and overrides are cleared; the Set quality Lock stays; empty Slots get no Lock', () => {
    const g = golden('cls11-q7-holy-2targets'); // Holy: amulet and ring are empty
    const old = {
      ...NO_LOCKS,
      quality: 7,
      slotQuality: { ring: 3 },
      amuletBase: 1,
      ringBase: 2,
      secondWeaponType: 1,
      secondWeaponQuality: 4,
    };
    const { locks } = loadAsTarget(decodeSetCode(catalogue, g.code), old);
    expect(locks.quality).toBe(7);
    expect(locks.slotQuality.ring).toBeUndefined();
    expect(locks.slotQuality.amulet).toBeUndefined();
    expect(locks.amuletBase).toBeNull();
    expect(locks.ringBase).toBeNull();
    expect(locks.secondWeaponType).toBeNull();
    expect(locks.secondWeaponQuality).toBeNull();
  });

  // Golden Sets with every main Slot filled; with empty Slots (Holy) Calculate fills them.
  const full = solved.filter(
    (s) => (s.output?.path.filter((p) => p.slot !== 'weapon2').length ?? 0) === 8,
  );

  test.each(full.map((s) => [s.label, s] as const))(
    '%s: Calculate after Load as target (Top-up 0) gives a Set at the same cost with the same levels',
    (_, scenario) => {
      const g = scenario.output;
      if (!g) return;
      const decoded = decodeSetCode(catalogue, g.code);
      const { targets, locks } = loadAsTarget(decoded, NO_LOCKS);
      const topUp = { total: 0, perAttribute: 0 };
      const outcome = solveSet(catalogue, highs, {
        classId: decoded.classId,
        targets,
        locks,
        topUp,
      });
      if (outcome.kind !== 'solved') throw new Error(outcome.kind);
      expect(outcome.set.cost).toBe(g.cost);
      expect(shownSolvedSet(catalogue, decoded.classId, outcome.set).levels).toEqual(
        Object.fromEntries(Object.entries(g.levels).map(([id, n]) => [Number(id), n])),
      );
    },
    30000,
  );

  test('the same Items come back unless another Item ties on price (1 of 35 full golden Sets)', () => {
    const differing = full.filter((scenario) => {
      const g = scenario.output;
      if (!g) return false;
      const decoded = decodeSetCode(catalogue, g.code);
      const { targets, locks } = loadAsTarget(decoded, NO_LOCKS);
      const topUp = { total: 0, perAttribute: 0 };
      const outcome = solveSet(catalogue, highs, {
        classId: decoded.classId,
        targets,
        locks,
        topUp,
      });
      if (outcome.kind !== 'solved') return true;
      return outcome.set.pieces.some((p, i) => p.itemId !== g.path[i]?.itemId);
    });
    expect(differing.map((s) => s.label)).toEqual(['cls14-n3']);
  }, 60000);

  test('a Set with empty Slots keeps its Items; Calculate fills the empty Slots (they get no Lock)', () => {
    const g = golden('cls11-q7-holy-2targets');
    const decoded = decodeSetCode(catalogue, g.code);
    const { targets, locks } = loadAsTarget(decoded, NO_LOCKS);
    const topUp = { total: 0, perAttribute: 0 };
    const outcome = solveSet(catalogue, highs, { classId: decoded.classId, targets, locks, topUp });
    if (outcome.kind !== 'solved') throw new Error(outcome.kind);
    const itemIn = (slot: string) => outcome.set.pieces.find((p) => p.slot === slot)?.itemId;
    for (const piece of g.path) expect(itemIn(piece.slot)).toBe(piece.itemId);
    expect(outcome.set.pieces.length).toBeGreaterThan(g.path.length);
  });
});
