import { act, cleanup, fireEvent, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { solve, type SolveOutcome } from '../../src/solver/solve';
import { renderApp } from './render-app';
import { selectBudget } from '../../src/store/selectors';

vi.mock('../../src/solver/solve', () => ({ solve: vi.fn() }));
const solveMock = vi.mocked(solve);

const solved: SolveOutcome = {
  kind: 'solved',
  set: {
    cost: 609,
    pieces: [{ slot: 'weapon', itemId: 3030101, gemIds: [null] }],
    topUp: {},
    topUpUsed: 0,
  },
};

beforeEach(() => solveMock.mockReset().mockResolvedValue(solved));
afterEach(() => {
  cleanup();
  localStorage.clear();
  delete document.documentElement.dataset.design;
});

// The summary's button; the phone bar repeats it (jsdom ignores the CSS that hides one).
const calculateButton = () =>
  within(screen.getByRole('region', { name: 'Set cost' })).getByRole('button', {
    name: /^(Calculate|Calculating…)$/,
  });
// Offense icons show first in the default picker (A, icon grid).
const addTarget = (name: string) =>
  fireEvent.click(screen.getByRole('button', { name, pressed: false }));

describe('layout', () => {
  test('shows Classes, Targets, every Slot and the price date', () => {
    renderApp();
    expect(screen.getAllByRole('radio')).toHaveLength(6);
    expect(screen.getByRole('heading', { name: 'Targets' })).toBeInTheDocument();
    for (const slot of [
      'Weapon',
      'Helmet',
      'Chest',
      'Bracers',
      'Pants',
      'Boots',
      'Amulet',
      'Ring',
      'Second weapon',
    ]) {
      expect(
        screen.getByRole('button', { name: `${slot}: details and Locks` }),
      ).toBeInTheDocument();
    }
    expect(screen.getAllByText('Prices from 2026-08-20').length).toBeGreaterThan(0);
  });

  test('UI text and the page language follow the chosen language', () => {
    renderApp();
    fireEvent.click(screen.getByRole('button', { name: 'Русский' }));
    expect(screen.getByRole('heading', { name: 'Цели' })).toBeInTheDocument();
    expect(document.documentElement.lang).toBe('ru');
  });

  test('the look switch sets data-design and is remembered', () => {
    renderApp();
    expect(document.documentElement.dataset.design).toBe('forge');
    fireEvent.click(screen.getByRole('button', { name: 'Mist' }));
    expect(document.documentElement.dataset.design).toBe('mist');
    expect(localStorage.getItem('mistfall-builder.design')).toBe('mist');
  });
});

describe('Targets', () => {
  test('a picked Attribute becomes a Target at level 1 and shows as picked', () => {
    const store = renderApp();
    addTarget('Wrath');
    expect(store.getState().inputs.targets).toEqual([{ attribute: 0, level: 1 }]);
    expect(screen.getByRole('button', { name: 'Wrath', pressed: true })).toBeInTheDocument();
  });

  test('+ is disabled at the Budget plus the wine per bonus', () => {
    const store = renderApp();
    addTarget('Wrath');
    const budget = selectBudget(store.getState()) + 2;
    act(() => store.getState().setTargetLevel(0, budget));
    expect(screen.getByRole('button', { name: 'Raise level: Wrath' })).toBeDisabled();
    act(() => store.getState().setTargetLevel(0, budget - 1));
    expect(screen.getByRole('button', { name: 'Raise level: Wrath' })).toBeEnabled();
  });

  test('the levels line counts the wine and turns red only above Budget + wine', () => {
    const store = renderApp();
    addTarget('Wrath');
    const budget = selectBudget(store.getState());
    act(() => store.getState().setTargetLevel(0, budget + 2));
    const line = screen.getByText(/^Levels asked/);
    expect(line).toHaveTextContent(
      `Levels asked: ${budget + 2} of ${budget + 8} (${budget} from Items + 8 wine)`,
    );
    expect(line).not.toHaveClass('text-danger');
  });

  test('a typed level is applied on Enter, clamped to the Budget plus wine, and the field can be cleared first', () => {
    const store = renderApp();
    addTarget('Wrath');
    const field = screen.getByRole('textbox', { name: 'Level: Wrath' });
    fireEvent.change(field, { target: { value: '' } });
    expect(field).toHaveValue('');
    fireEvent.change(field, { target: { value: '3' } });
    fireEvent.keyDown(field, { key: 'Enter' });
    expect(store.getState().inputs.targets).toEqual([{ attribute: 0, level: 3 }]);
    fireEvent.change(field, { target: { value: '999' } });
    fireEvent.blur(field);
    expect(store.getState().inputs.targets[0]?.level).toBe(selectBudget(store.getState()) + 2);
  });

  test('a cleared level field goes back to the level on blur', () => {
    const store = renderApp();
    addTarget('Wrath');
    const field = screen.getByRole('textbox', { name: 'Level: Wrath' });
    fireEvent.change(field, { target: { value: '' } });
    fireEvent.blur(field);
    expect(field).toHaveValue('1');
    expect(store.getState().inputs.targets).toEqual([{ attribute: 0, level: 1 }]);
  });

  test('✕ removes the Target', () => {
    const store = renderApp();
    addTarget('Wrath');
    fireEvent.click(screen.getByRole('button', { name: 'Remove Target: Wrath' }));
    expect(store.getState().inputs.targets).toEqual([]);
  });

  test('a tier is reached at its fromLevel; English rows show "need N more" and no Russian text', () => {
    const store = renderApp();
    addTarget('Wrath');
    act(() => store.getState().setTargetLevel(0, 4));
    const row = screen.getByText('Lv 5–7').closest('li');
    expect(row).toHaveTextContent('need 1 more');
    expect(row?.textContent).not.toMatch(/[а-я]/i);
    act(() => store.getState().setTargetLevel(0, 5));
    expect(screen.getByText('Lv 5–7').closest('li')).not.toHaveTextContent('need');
  });

  test('Russian rows show the tier text', () => {
    const store = renderApp('ru');
    act(() => store.getState().addTarget(0));
    expect(screen.getByText('Ур. 1–4').closest('li')).toHaveTextContent('Физический урон +8.4%');
  });
});

describe('Calculate', () => {
  test('is marked stale until the shown result matches the inputs', async () => {
    renderApp();
    expect(calculateButton()).toHaveAttribute('data-stale', 'true');
    await act(async () => fireEvent.click(calculateButton()));
    expect(calculateButton()).toHaveAttribute('data-stale', 'false');
    addTarget('Wrath');
    expect(calculateButton()).toHaveAttribute('data-stale', 'true');
    expect(screen.getByText('Inputs changed — recalculate')).toBeInTheDocument();
  });

  test('shows a busy state while solving', async () => {
    let finish: (outcome: SolveOutcome) => void = () => {};
    solveMock.mockReturnValue(new Promise((resolve) => (finish = resolve)));
    renderApp();
    fireEvent.click(calculateButton());
    expect(calculateButton()).toHaveAttribute('aria-busy', 'true');
    expect(calculateButton()).toHaveTextContent('Calculating…');
    await act(async () => finish(solved));
    expect(calculateButton()).toHaveAttribute('aria-busy', 'false');
  });

  test('a solved Set shows its cost and its Item in the Slot', async () => {
    renderApp();
    await act(async () => fireEvent.click(calculateButton()));
    const summary = screen.getByRole('region', { name: 'Set cost' });
    expect(within(summary).getByText('609')).toBeInTheDocument();
    const weapon = screen.getByRole('button', { name: 'Weapon: details and Locks' });
    expect(weapon).toHaveTextContent('Sword and Shield');
  });

  test('Targets over Budget + wine give a message, not a Set', async () => {
    solveMock.mockResolvedValue({ kind: 'overBudget', requested: 40, budget: 30, topUpTotal: 8 });
    renderApp();
    await act(async () => fireEvent.click(calculateButton()));
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Targets ask for 40 levels; the set gives at most 30 + 8 wine.',
    );
  });

  test('a solver error is shown', async () => {
    solveMock.mockRejectedValueOnce(new Error('HiGHS crashed'));
    renderApp();
    await act(async () => fireEvent.click(calculateButton()));
    expect(screen.getByRole('alert')).toHaveTextContent('Solver error: HiGHS crashed');
  });
});

describe('Variants (Alternatives)', () => {
  const variants = () => screen.getByRole('group', { name: 'Variants' });

  test('show only once a Set is solved, the cheapest one pressed', async () => {
    renderApp();
    expect(screen.queryByRole('group', { name: 'Variants' })).toBeNull();
    await act(async () => fireEvent.click(calculateButton()));
    const buttons = within(variants()).getAllByRole('button');
    expect(buttons).toHaveLength(5);
    expect(buttons[0]).toHaveAttribute('aria-pressed', 'true');
    expect(buttons[0]).toHaveAccessibleName('Variant 1: 609 gold');
    expect(buttons[1]).toHaveAccessibleName('Variant 2');
  });

  test('a picked Variant is solved, shown, and named with its cost', async () => {
    renderApp();
    await act(async () => fireEvent.click(calculateButton()));
    solveMock.mockResolvedValueOnce({
      kind: 'solved',
      set: { ...solved.set, cost: 650 },
    } as SolveOutcome);
    await act(async () =>
      fireEvent.click(within(variants()).getByRole('button', { name: 'Variant 2' })),
    );
    const second = within(variants()).getByRole('button', { name: 'Variant 2: 650 gold' });
    expect(second).toHaveAttribute('aria-pressed', 'true');
    expect(second).toHaveTextContent('+41');
    expect(screen.getByText('Set cost: 650 gold')).toBeInTheDocument();
  });

  test('when there is no other Set, the rest are off and the summary says so', async () => {
    renderApp();
    await act(async () => fireEvent.click(calculateButton()));
    solveMock.mockResolvedValueOnce({ kind: 'infeasible' });
    await act(async () =>
      fireEvent.click(within(variants()).getByRole('button', { name: 'Variant 4' })),
    );
    const buttons = within(variants()).getAllByRole('button');
    expect(buttons.slice(1).every((button) => button.hasAttribute('disabled'))).toBe(true);
    expect(buttons[0]).toHaveAttribute('aria-pressed', 'true');
    expect(
      screen.getByText('No other set meets these Targets with other Items or Gems.'),
    ).toBeInTheDocument();
  });
});
