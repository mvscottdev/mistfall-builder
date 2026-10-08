import { describe, expect, test } from 'vitest';
import type { Locks, TopUp } from '../../src/domain/types';
import { NO_LOCKS, sameInputs, type Inputs } from '../../src/store/inputs';

const base: Inputs = {
  classId: 10,
  targets: [
    { attribute: 1, level: 3 },
    { attribute: 2, level: 4 },
  ],
  locks: NO_LOCKS,
  topUp: { total: 8, perAttribute: 2 },
};

describe('sameInputs', () => {
  test('equal values in fresh objects are the same inputs', () => {
    expect(sameInputs(base, structuredClone(base))).toBe(true);
  });

  test.each<[string, Partial<Inputs>]>([
    ['Class', { classId: 11 }],
    [
      'Target level',
      {
        targets: [
          { attribute: 1, level: 3 },
          { attribute: 2, level: 5 },
        ],
      },
    ],
    [
      'Target order',
      {
        targets: [
          { attribute: 2, level: 4 },
          { attribute: 1, level: 3 },
        ],
      },
    ],
    ['Top-up total', { topUp: { total: 7, perAttribute: 2 } }],
    ['Top-up per Attribute', { topUp: { total: 8, perAttribute: 1 } }],
    ['Set quality Lock', { locks: { ...NO_LOCKS, quality: 6 } }],
    ['weapon type Lock', { locks: { ...NO_LOCKS, weaponType: 3 } }],
    ['amulet base Lock', { locks: { ...NO_LOCKS, amuletBase: 3 } }],
    ['ring base Lock', { locks: { ...NO_LOCKS, ringBase: 3 } }],
    ['Second weapon Lock', { locks: { ...NO_LOCKS, secondWeapon: 3 } }],
    ['per-Slot quality', { locks: { ...NO_LOCKS, slotQuality: { boots: 7 } } }],
  ])('a different %s makes different inputs', (_, change) => {
    const changed = { ...base, ...change };
    expect(sameInputs(base, changed)).toBe(false);
    expect(sameInputs(changed, base)).toBe(false);
  });
});

// Guards sameInputs against a Lock or Top-up field added later but not compared.
test('a change in any Lock or Top-up field makes different inputs', () => {
  for (const key of Object.keys(NO_LOCKS) as (keyof Locks)[]) {
    const value = key === 'slotQuality' ? { ring: 3 } : 99;
    expect(sameInputs(base, { ...base, locks: { ...NO_LOCKS, [key]: value } }), key).toBe(false);
  }
  for (const key of Object.keys(base.topUp) as (keyof TopUp)[]) {
    expect(sameInputs(base, { ...base, topUp: { ...base.topUp, [key]: 99 } }), key).toBe(false);
  }
});
