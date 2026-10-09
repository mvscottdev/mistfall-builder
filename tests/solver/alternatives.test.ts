// @vitest-environment node
import highsLoader from 'highs';
import { beforeAll, describe, expect, test } from 'vitest';
import type { Catalogue, SetPiece } from '../../src/domain/types';
import type { Highs } from '../../src/solver/mip';
import { solveSet, type SolveRequest } from '../../src/solver/solve-set';
import { builtIn, catalogueWith, gem, item, socket, TRIANGLE } from './make';
import { noLocks } from './page-catalogue';

let highs: Highs;
beforeAll(async () => {
  highs = await highsLoader();
});

const request = (fields: Partial<SolveRequest>): SolveRequest => ({
  classId: 10,
  targets: [],
  locks: noLocks,
  topUp: { total: 0, perAttribute: 0 },
  ...fields,
});

/** Solves the cheapest Set, then each Alternative, until the solver finds no more. */
function allAlternatives(catalogue: Catalogue, asked: SolveRequest) {
  const found: { cost: number; pieces: SetPiece[] }[] = [];
  for (;;) {
    const outcome = solveSet(
      catalogue,
      highs,
      asked,
      found.map((set) => set.pieces),
    );
    if (outcome.kind !== 'solved') return found;
    found.push({ cost: outcome.set.cost, pieces: outcome.set.pieces });
  }
}

const itemIds = (pieces: SetPiece[]) => pieces.map((piece) => piece.itemId);

describe('Alternatives', () => {
  test('come cheapest first, each with another Item where levels come from, until none is left', () => {
    const catalogue = catalogueWith([
      item({ id: 1, slot: 'helmet', price: 100, modSlots: [builtIn({ 0: 2 })] }),
      item({ id: 2, slot: 'helmet', price: 140, modSlots: [builtIn({ 0: 2, 1: 1 })] }),
      item({ id: 3, slot: 'helmet', price: 160, modSlots: [builtIn({ 0: 1 })] }),
      item({ id: 11, slot: 'boots', price: 50 }),
      item({ id: 12, slot: 'boots', price: 70, modSlots: [builtIn({ 0: 1 })] }),
      item({ id: 13, slot: 'boots', price: 80, modSlots: [builtIn({ 1: 1 })] }),
    ]);
    const asked = request({
      targets: [
        { attribute: 0, level: 2 },
        { attribute: 1, level: 1 },
      ],
    });
    const found = allAlternatives(catalogue, asked);
    expect(found.map((set) => set.cost)).toEqual([180, 190]);
    expect(found.map((set) => itemIds(set.pieces))).toEqual([
      [1, 13],
      [2, 11],
    ]);
  });

  test('another Item that gives the same levels and more still counts as different', () => {
    const catalogue = catalogueWith([
      item({ id: 1, price: 100, modSlots: [builtIn({ 0: 1 })] }),
      item({ id: 2, price: 120, modSlots: [builtIn({ 0: 1, 1: 1 })] }),
      item({ id: 3, price: 150, modSlots: [builtIn({ 1: 1 })] }),
    ]);
    const asked = request({
      targets: [
        { attribute: 0, level: 1 },
        { attribute: 1, level: 1 },
      ],
      topUp: { total: 1, perAttribute: 1 },
    });
    const found = allAlternatives(catalogue, asked);
    expect(found.map((set) => itemIds(set.pieces))).toEqual([[1], [2], [3]]);
  });

  test('the same Gems moved to other Slots are not a different Set; another Gem is', () => {
    const catalogue = catalogueWith(
      [
        item({ id: 1, slot: 'helmet', modSlots: [socket(TRIANGLE)] }),
        item({ id: 2, slot: 'boots', modSlots: [socket(TRIANGLE)] }),
      ],
      [
        gem({ id: 10, contribution: { 0: 1 }, price: 10 }),
        gem({ id: 11, contribution: { 1: 1 }, price: 10 }),
        gem({ id: 12, contribution: { 0: 1, 1: 1 }, price: 30 }),
      ],
    );
    const asked = request({
      targets: [
        { attribute: 0, level: 1 },
        { attribute: 1, level: 1 },
      ],
    });
    const found = allAlternatives(catalogue, asked);
    // 10 + 11 once only, not again as 11 + 10; then the three ways with Gem 12.
    expect(found.map((set) => set.cost)).toEqual([220, 240, 240, 260]);
    const gemIds = (pieces: SetPiece[]) =>
      pieces
        .flatMap((piece) => piece.gemIds)
        .sort()
        .join(',');
    expect(new Set(found.map((set) => gemIds(set.pieces))).size).toBe(4);
  });

  test('a Set that takes no levels from Items has no Alternative', () => {
    const catalogue = catalogueWith([
      item({ id: 1, price: 100 }),
      item({ id: 2, price: 120, modSlots: [builtIn({ 0: 1 })] }),
    ]);
    expect(allAlternatives(catalogue, request({})).map((set) => set.cost)).toEqual([100]);
  });

  test('with nothing to avoid the cheapest Set comes back as before', () => {
    const catalogue = catalogueWith([item({ id: 1, price: 100, modSlots: [builtIn({ 0: 1 })] })]);
    const asked = request({ targets: [{ attribute: 0, level: 1 }] });
    expect(solveSet(catalogue, highs, asked, [])).toEqual(solveSet(catalogue, highs, asked));
  });
});
