import { beforeEach, describe, expect, test, vi } from 'vitest';
import goldenRaw from '../fixtures/golden.json?raw';
import { budget } from '../../src/solver/budget';
import { solve, type SolveOutcome } from '../../src/solver/solve';
import { createBuildStore } from '../../src/store/build-store';
import { NO_LOCKS } from '../../src/store/inputs';
import { selectStale } from '../../src/store/selectors';
import { pageCatalogue } from '../solver/page-catalogue';

vi.mock('../../src/solver/solve', () => ({ solve: vi.fn() }));
const solveMock = vi.mocked(solve);

const catalogue = pageCatalogue();
const solved: SolveOutcome = {
  kind: 'solved',
  set: { cost: 609, pieces: [], topUp: {}, topUpUsed: 0 },
};

let store = createBuildStore(catalogue);
const state = () => store.getState();

beforeEach(() => {
  localStorage.clear();
  solveMock.mockReset().mockResolvedValue(solved);
  store = createBuildStore(catalogue);
});

describe('starting state', () => {
  test('first Class, no Targets, no Locks, Top-up 8 total / 2 per Attribute', () => {
    expect(state().inputs).toEqual({
      classId: catalogue.classes[0]?.id,
      targets: [],
      locks: NO_LOCKS,
      topUp: { total: 8, perAttribute: 2 },
    });
  });

  test('no result yet counts as stale', () => {
    expect(state().result).toBeNull();
    expect(selectStale(state())).toBe(true);
  });
});

describe('Targets', () => {
  test('added Targets start at level 1, in the order added', () => {
    state().addTarget(5);
    state().addTarget(2);
    expect(state().inputs.targets).toEqual([
      { attribute: 5, level: 1 },
      { attribute: 2, level: 1 },
    ]);
  });

  test('adding an already targeted Attribute changes nothing', () => {
    state().addTarget(5);
    state().setTargetLevel(5, 3);
    state().addTarget(5);
    expect(state().inputs.targets).toEqual([{ attribute: 5, level: 3 }]);
  });

  test('a level change keeps the Target in its place', () => {
    state().addTarget(5);
    state().addTarget(2);
    state().setTargetLevel(5, 4);
    expect(state().inputs.targets.map((t) => t.attribute)).toEqual([5, 2]);
  });

  test('level 0 removes the Target', () => {
    state().addTarget(5);
    state().setTargetLevel(5, 0);
    expect(state().inputs.targets).toEqual([]);
  });

  test('a level above the Budget is capped at the Budget', () => {
    const { classId, locks } = state().inputs;
    state().addTarget(5);
    state().setTargetLevel(5, 999);
    expect(state().inputs.targets[0]?.level).toBe(budget(catalogue, classId, locks));
  });

  test('removing a Target leaves the others', () => {
    state().addTarget(5);
    state().addTarget(2);
    state().removeTarget(5);
    expect(state().inputs.targets).toEqual([{ attribute: 2, level: 1 }]);
  });
});

describe('Locks and Top-up', () => {
  test('one Lock changes, the others stay', () => {
    state().setLock('quality', 6);
    state().setLock('ringBase', 3);
    expect(state().inputs.locks).toEqual({ ...NO_LOCKS, quality: 6, ringBase: 3 });
  });

  test('a per-Slot quality override is set and cleared', () => {
    state().setSlotQuality('weapon', 7);
    expect(state().inputs.locks.slotQuality).toEqual({ weapon: 7 });
    state().setSlotQuality('weapon', null);
    expect(state().inputs.locks.slotQuality).toEqual({});
  });

  test('a Top-up change replaces the pool and the cap', () => {
    state().setTopUp({ total: 3, perAttribute: 1 });
    expect(state().inputs.topUp).toEqual({ total: 3, perAttribute: 1 });
  });

  test('a Class change drops a weapon type Lock the Class has no weapon of', () => {
    state().setLock('weaponType', -1);
    state().setLock('quality', 6);
    state().setClass(11);
    expect(state().inputs.classId).toBe(11);
    expect(state().inputs.locks).toEqual({ ...NO_LOCKS, quality: 6 });
  });
});

describe('calculate', () => {
  test('solves the current inputs and shows the outcome, not stale', async () => {
    state().addTarget(5);
    await state().calculate();
    expect(solveMock).toHaveBeenCalledWith(catalogue, state().inputs);
    expect(state().result).toEqual(solved);
    expect(selectStale(state())).toBe(false);
  });

  test('an input change after a solve makes the result stale; undoing it clears stale', async () => {
    await state().calculate();
    state().addTarget(5);
    expect(selectStale(state())).toBe(true);
    state().removeTarget(5);
    expect(selectStale(state())).toBe(false);
  });

  test('busy while solving; a second click while busy is ignored', async () => {
    const first = state().calculate();
    expect(state().busy).toBe(true);
    await state().calculate();
    await first;
    expect(solveMock).toHaveBeenCalledTimes(1);
    expect(state().busy).toBe(false);
  });

  test('inputs changed during a solve leave the result stale', async () => {
    const running = state().calculate();
    state().addTarget(5);
    await running;
    expect(state().resultInputs?.targets).toEqual([]);
    expect(selectStale(state())).toBe(true);
  });

  test.each<SolveOutcome>([
    { kind: 'infeasible' },
    { kind: 'overBudget', requested: 90, budget: 60, topUpTotal: 8 },
  ])('an unsolved outcome ($kind) is shown as the result', async (outcome) => {
    solveMock.mockResolvedValueOnce(outcome);
    await state().calculate();
    expect(state().result).toEqual(outcome);
  });

  test('a solver failure becomes a failed result with its message', async () => {
    solveMock.mockRejectedValueOnce(new Error('HiGHS crashed'));
    await state().calculate();
    expect(state().result).toEqual({ kind: 'failed', message: 'HiGHS crashed' });
    expect(state().busy).toBe(false);
  });
});

describe('language', () => {
  test('setLanguage switches and saves the choice', () => {
    state().setLanguage('ru');
    expect(state().language).toBe('ru');
    expect(createBuildStore(catalogue).getState().language).toBe('ru');
    state().setLanguage('en');
    expect(createBuildStore(catalogue).getState().language).toBe('en');
  });
});

describe('Set code import (ADR-0010)', () => {
  const golden = JSON.parse(goldenRaw).scenarios as {
    label: string;
    output: { code: string } | null;
  }[];
  const codeOf = (label: string) => golden.find((s) => s.label === label)?.output?.code ?? '';

  test('a pasted code shows its Set as it is and switches to its Class', () => {
    const problem = state().importSetCode(` ${codeOf('cls11-n1')} `);
    expect(problem).toBeNull();
    expect(state().inputs.classId).toBe(11);
    expect(state().result?.kind).toBe('decoded');
    expect(state().resultInputs).toBeNull();
  });

  test('an unreadable code says why and leaves the result alone', () => {
    expect(state().importSetCode('not a code!')).toBe('notBase62');
    expect(state().result).toBeNull();
  });

  test('Load as target turns the shown Set into Targets and Locks, with Top-up 0', () => {
    state().setLock('quality', 3);
    state().importSetCode(codeOf('cls10-n1'));
    state().loadAsTarget();
    const { targets, locks, topUp } = state().inputs;
    expect(targets.length).toBeGreaterThan(0);
    expect(locks.quality).toBe(3);
    expect(Object.keys(locks.slotQuality)).toHaveLength(8);
    expect(topUp).toEqual({ total: 0, perAttribute: 0 });
  });

  test('Load as target does nothing unless a decoded Set is shown', async () => {
    await state().calculate();
    const before = state().inputs;
    state().loadAsTarget();
    expect(state().inputs).toBe(before);
  });
});
