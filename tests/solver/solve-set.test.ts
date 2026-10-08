// @vitest-environment node
import highsLoader from 'highs';
import { describe, expect, test } from 'vitest';
import type { Highs } from '../../src/solver/mip';
import { solveSet, type SolveRequest } from '../../src/solver/solve-set';
import { catalogueWith, gem, item, socket, SQUARE, TRIANGLE } from './make';
import { noLocks } from './page-catalogue';

const neverCalled = {
  solve() {
    throw new Error('the MIP must not run');
  },
} as Highs;

const helmetCatalogue = catalogueWith(
  [item({ id: 1, modSlots: [socket(TRIANGLE)] })],
  [gem({ id: 10, contribution: { 0: 1 } })],
);

const request = (fields: Partial<SolveRequest>): SolveRequest => ({
  classId: 10,
  targets: [],
  locks: noLocks,
  topUp: { total: 8, perAttribute: 2 },
  ...fields,
});

describe('solving a Set', () => {
  test('Targets over Budget + Top-up total are not solved; the outcome says why', () => {
    const outcome = solveSet(
      helmetCatalogue,
      neverCalled,
      request({ targets: [{ attribute: 0, level: 4 }], topUp: { total: 2, perAttribute: 2 } }),
    );
    expect(outcome).toEqual({ kind: 'overBudget', requested: 4, budget: 1, topUpTotal: 2 });
  });

  test('Targets exactly at Budget + Top-up total are still solved', async () => {
    const highs = await highsLoader();
    const outcome = solveSet(
      helmetCatalogue,
      highs,
      request({ targets: [{ attribute: 0, level: 3 }], topUp: { total: 2, perAttribute: 2 } }),
    );
    expect(outcome.kind).toBe('solved');
  });

  test('Targets no Set can meet give one generic infeasible outcome', async () => {
    const highs = await highsLoader();
    const outcome = solveSet(
      helmetCatalogue,
      highs,
      request({ targets: [{ attribute: 1, level: 1 }], topUp: { total: 0, perAttribute: 0 } }),
    );
    expect(outcome).toEqual({ kind: 'infeasible' });
  });

  test('an active Slot whose Items all have a Socket no Gem fits makes the Set infeasible', () => {
    const catalogue = catalogueWith(
      [item({ id: 1, modSlots: [socket(SQUARE)] })],
      [gem({ id: 10, shape: TRIANGLE })],
    );
    expect(solveSet(catalogue, neverCalled, request({}))).toEqual({ kind: 'infeasible' });
  });

  test('Top-up is spent only when it lowers the cost, and reported per Attribute', async () => {
    const highs = await highsLoader();
    const catalogue = catalogueWith(
      [
        item({ id: 1, price: 100, modSlots: [socket(TRIANGLE)] }),
        item({ id: 2, price: 500, modSlots: [socket(TRIANGLE), socket(TRIANGLE)] }),
      ],
      [gem({ id: 10, contribution: { 0: 1 } })],
    );
    const solved = solveSet(catalogue, highs, request({ targets: [{ attribute: 0, level: 2 }] }));
    expect(solved).toEqual({
      kind: 'solved',
      set: {
        cost: 110,
        pieces: [{ slot: 'helmet', itemId: 1, gemIds: [10] }],
        topUp: { 0: 1 },
        topUpUsed: 1,
      },
    });
    const noNeed = solveSet(catalogue, highs, request({ targets: [{ attribute: 0, level: 1 }] }));
    expect(noNeed.kind === 'solved' && noNeed.set.topUpUsed).toBe(0);
  });

  test('a HiGHS error reaches the caller; there is no fallback', () => {
    const failing = {
      solve() {
        throw new Error('HiGHS crashed');
      },
    } as Highs;
    expect(() => solveSet(helmetCatalogue, failing, request({}))).toThrow('HiGHS crashed');
  });
});
