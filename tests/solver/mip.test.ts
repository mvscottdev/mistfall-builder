// @vitest-environment node
import { describe, expect, test } from 'vitest';
import packageRaw from '../../package.json?raw';
import highsPackageRaw from '../../node_modules/highs/package.json?raw';
import type { LpModel } from '../../src/solver/lp-model';
import { solveMip, type Highs } from '../../src/solver/mip';
import type { Variant } from '../../src/solver/variants';
import { item } from './make';

type Solution = ReturnType<Highs['solve']>;

const variant = (price: number, vector: number[]) =>
  ({ item: item({ id: 1, price }), gems: [], price, vector }) as Variant;

const model: LpModel = {
  slots: [{ slot: 'helmet', variants: [variant(100, [1]), variant(150, [2])] }],
  targets: [{ attribute: 3, level: 2 }],
  topUp: { total: 8, perAttribute: 2 },
};

function solution(status: string, objective: number, primal: Record<string, number>): Solution {
  const Columns = Object.fromEntries(
    Object.entries(primal).map(([name, value]) => [name, { Primal: value }]),
  );
  return { Status: status, ObjectiveValue: objective, Columns, Rows: [] } as unknown as Solution;
}

/** A HiGHS stand-in that answers each solve() call with the next scripted solution. */
function scriptedHighs(...answers: Solution[]) {
  const problems: string[] = [];
  const highs = {
    solve(problem: string) {
      problems.push(problem);
      const next = answers.shift();
      if (!next) throw new Error('unexpected solve');
      return next;
    },
  } as Highs;
  return { highs, problems };
}

describe('the two-phase MIP', () => {
  test('phase 1 minimises gold; phase 2 fixes gold and minimises Top-up', () => {
    const { highs, problems } = scriptedHighs(
      solution('Optimal', 100, { x_0_0: 1, x_0_1: 0, t_3: 1 }),
      solution('Optimal', 0, { x_0_0: 0, x_0_1: 1, t_3: 0 }),
    );
    expect(solveMip(highs, model)).toEqual({ cost: 100, variantIndex: [1], topUp: [0] });
    expect(problems[0]).toContain(' obj: 100 x_0_0 + 150 x_0_1');
    expect(problems[1]).toContain(' obj: 1 t_3');
    expect(problems[1]).toContain(' costcap: 100 x_0_0 + 150 x_0_1 <= 100');
  });

  test('if phase 2 isn’t Optimal, the phase 1 Set stands', () => {
    const { highs } = scriptedHighs(
      solution('Optimal', 100, { x_0_0: 1, x_0_1: 0, t_3: 1 }),
      solution('Time limit reached', 0, {}),
    );
    expect(solveMip(highs, model)).toEqual({ cost: 100, variantIndex: [0], topUp: [1] });
  });

  test('gold is rounded and the chosen variant is the one with the largest value in its Slot', () => {
    const { highs } = scriptedHighs(
      solution('Optimal', 149.9999997, { x_0_0: 0.0000002, x_0_1: 0.9999998, t_3: 0 }),
      solution('Optimal', 0.0000001, { x_0_0: 0.0000002, x_0_1: 0.9999998, t_3: 0.0000001 }),
    );
    expect(solveMip(highs, model)).toEqual({ cost: 150, variantIndex: [1], topUp: [0] });
  });

  test('with no Targets only the gold phase runs', () => {
    const { highs, problems } = scriptedHighs(solution('Optimal', 100, { x_0_0: 1, x_0_1: 0 }));
    expect(solveMip(highs, { ...model, targets: [] })).toEqual({
      cost: 100,
      variantIndex: [0],
      topUp: [],
    });
    expect(problems).toHaveLength(1);
  });

  test('no Optimal first phase means no Set', () => {
    const { highs } = scriptedHighs(solution('Infeasible', 0, {}));
    expect(solveMip(highs, model)).toBeNull();
  });

  test('a HiGHS error is thrown, not hidden behind a fallback', () => {
    const { highs } = scriptedHighs();
    expect(() => solveMip(highs, model)).toThrow('unexpected solve');
  });
});

describe('the HiGHS version', () => {
  test('highs is pinned to 1.15.2: tie-breaking between equal-cost Sets can change between versions', () => {
    expect(JSON.parse(packageRaw).dependencies.highs).toBe('1.15.2');
    expect(JSON.parse(highsPackageRaw).version).toBe('1.15.2');
  });
});
