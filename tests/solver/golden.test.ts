// @vitest-environment node
import highsLoader from 'highs';
import { beforeAll, describe, expect, test } from 'vitest';
import goldenRaw from '../fixtures/golden.json?raw';
import type { Locks, Slot } from '../../src/domain/types';
import type { Highs } from '../../src/solver/mip';
import { solveSet, type SolveRequest } from '../../src/solver/solve-set';
import { pageCatalogue } from './page-catalogue';

interface GoldenInput {
  classId: number;
  targets: Record<string, number>;
  quality?: number | null;
  slotQuality?: Partial<Record<Slot, number>>;
  weaponBase?: number | null;
  amuletBase?: number | null;
  ringBase?: number | null;
  weapon2Lock?: number | null;
  topup?: { total: number; perAttr: number };
}

interface GoldenOutput {
  cost: number;
  topupUsed: number;
  topup: Record<string, number>;
  path: { slot: string; itemId: number; gems: (number | null)[] }[];
}

interface GoldenScenario {
  label: string;
  input: GoldenInput;
  output: GoldenOutput | null;
}

const scenarios: GoldenScenario[] = JSON.parse(goldenRaw).scenarios;

function requestFor(input: GoldenInput): SolveRequest {
  const locks: Locks = {
    quality: input.quality ?? null,
    slotQuality: input.slotQuality ?? {},
    weaponType: input.weaponBase ?? null,
    amuletBase: input.amuletBase ?? null,
    ringBase: input.ringBase ?? null,
    secondWeapon: input.weapon2Lock ?? null,
  };
  return {
    classId: input.classId,
    // Object.entries lists integer keys in ascending order, as the old generator read them.
    targets: Object.entries(input.targets).map(([id, level]) => ({ attribute: Number(id), level })),
    locks,
    topUp: input.topup
      ? { total: input.topup.total, perAttribute: input.topup.perAttr }
      : { total: 8, perAttribute: 2 },
  };
}

const catalogue = pageCatalogue();
let highs: Highs;

beforeAll(async () => {
  highs = await highsLoader();
});

describe('the solver gives the old page’s Set for every golden scenario', () => {
  test.each(scenarios)('$label', ({ input, output }) => {
    const outcome = solveSet(catalogue, highs, requestFor(input));
    if (output === null) {
      expect(outcome.kind).not.toBe('solved');
      return;
    }
    if (outcome.kind !== 'solved') throw new Error(`expected a Set, got ${outcome.kind}`);
    const { set } = outcome;
    expect(set.cost).toBe(output.cost);
    expect(set.topUpUsed).toBe(output.topupUsed);
    expect(set.topUp).toEqual(output.topup);
    expect(set.pieces.map((p) => ({ slot: p.slot, itemId: p.itemId, gems: p.gemIds }))).toEqual(
      output.path,
    );
  });
});
