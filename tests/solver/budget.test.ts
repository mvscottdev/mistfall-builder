import { describe, expect, test } from 'vitest';
import { budget } from '../../src/solver/budget';
import { builtIn, catalogueWith, gem, item, socket, SQUARE, TRIANGLE } from './make';
import { noLocks } from './page-catalogue';

describe('Budget', () => {
  test('Budget is the sum over active Slots of the most points an Item there can give', () => {
    const catalogue = catalogueWith(
      [
        item({ id: 1, slot: 'helmet', modSlots: [builtIn({ 0: 1 })] }),
        item({ id: 2, slot: 'helmet', modSlots: [builtIn({ 0: 1 }), socket(TRIANGLE)] }),
        item({ id: 3, slot: 'chest', modSlots: [socket(SQUARE)] }),
      ],
      [gem({ id: 10, shape: TRIANGLE }), gem({ id: 20, shape: SQUARE })],
    );
    // helmet: best Item gives 1 + 1; chest: 1; the other Slots are inactive.
    expect(budget(catalogue, 10, noLocks)).toBe(3);
  });

  test('a double Gem counts 2', () => {
    const catalogue = catalogueWith(
      [item({ id: 1, modSlots: [socket(TRIANGLE)] })],
      [gem({ id: 10, contribution: { 0: 1 } }), gem({ id: 20, contribution: { 0: 1, 1: 1 } })],
    );
    expect(budget(catalogue, 10, noLocks)).toBe(2);
  });

  test('Locks shrink the Budget to the Items they allow', () => {
    const catalogue = catalogueWith([
      item({ id: 1, quality: 3, modSlots: [builtIn({ 0: 1 })] }),
      item({ id: 2, quality: 6, modSlots: [builtIn({ 0: 1 }), builtIn({ 1: 2 })] }),
    ]);
    expect(budget(catalogue, 10, noLocks)).toBe(3);
    expect(budget(catalogue, 10, { ...noLocks, quality: 3 })).toBe(1);
  });

  test('the Second weapon adds nothing to the Budget', () => {
    const catalogue = catalogueWith([
      item({ id: 1, slot: 'weapon', modSlots: [builtIn({ 0: 3 })] }),
      item({ id: 2, slot: 'weapon', modSlots: [builtIn({ 0: 1 })] }),
    ]);
    expect(budget(catalogue, 10, noLocks)).toBe(3);
  });
});
