import { describe, expect, test } from 'vitest';
import { lpText, type LpModel } from '../../src/solver/lp-model';
import type { Variant } from '../../src/solver/variants';
import { item } from './make';

const variant = (price: number, vector: number[]) =>
  ({ item: item({ id: 1, price }), gems: [], price, vector }) as Variant;

const model: LpModel = {
  slots: [
    { slot: 'helmet', variants: [variant(100, [1, 0]), variant(150, [2, 1])] },
    { slot: 'weapon2', variants: [variant(0, [0, 0]), variant(70, [0, 0])] },
  ],
  targets: [
    { attribute: 7, level: 3 },
    { attribute: 4, level: 1 },
  ],
  topUp: { total: 2, perAttribute: 2 },
};

describe('the MIP model', () => {
  test('one binary per variant, exactly one per Slot; Top-up only for Targets, capped at min(cap, level) and the pool; items + Top-up ≥ Target', () => {
    expect(lpText(model, { minimise: 'cost' }).split('\n')).toEqual([
      'Minimize',
      ' obj: 100 x_0_0 + 150 x_0_1 + 70 x_1_1',
      'Subject To',
      ' slot0: x_0_0 + x_0_1 = 1',
      ' slot1: x_1_0 + x_1_1 = 1',
      ' attr0: 1 x_0_0 + 2 x_0_1 + t_7 >= 3',
      ' attr1: 1 x_0_1 + t_4 >= 1',
      ' topup: t_7 + t_4 <= 2',
      'Bounds',
      ' 0 <= t_7 <= 2',
      ' 0 <= t_4 <= 1',
      'Binary',
      'x_0_0',
      'x_0_1',
      'x_1_0',
      'x_1_1',
      'General',
      't_7',
      't_4',
      'End',
    ]);
  });

  test('the second phase minimises Top-up with gold capped at the first phase’s minimum', () => {
    const lines = lpText(model, { minimise: 'topUp', costCap: 170 }).split('\n');
    expect(lines[1]).toBe(' obj: 1 t_7 + 1 t_4');
    expect(lines).toContain(' costcap: 100 x_0_0 + 150 x_0_1 + 70 x_1_1 <= 170');
  });

  test('with no Targets there are no Target rows and no Top-up', () => {
    const text = lpText({ ...model, targets: [] }, { minimise: 'cost' });
    expect(text).not.toMatch(/attr|topup|t_|Bounds|General/);
  });
});
