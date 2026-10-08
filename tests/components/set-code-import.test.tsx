import { act, cleanup, fireEvent, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, test } from 'vitest';
import goldenRaw from '../fixtures/golden.json?raw';
import { renderApp } from './render-app';

afterEach(() => {
  cleanup();
  localStorage.clear();
});

const scenarios = JSON.parse(goldenRaw).scenarios as {
  label: string;
  output: { code: string; path: { slot: string; itemId: number }[] } | null;
}[];
const codeOf = (label: string) => scenarios.find((s) => s.label === label)?.output?.code ?? '';

function paste(code: string) {
  fireEvent.change(screen.getByLabelText('Paste a Set code'), { target: { value: code } });
  fireEvent.click(screen.getByRole('button', { name: 'Show' }));
}

describe('Set code import', () => {
  test('a pasted golden code shows its Set on the doll and switches the Class', () => {
    renderApp();
    paste(codeOf('cls11-n1'));
    expect(screen.getByRole('radio', { name: 'Sorcerer' })).toBeChecked();
    const weapon = screen.getByRole('button', { name: /^Weapon: details/ });
    expect(weapon).not.toHaveTextContent('Empty');
    expect(screen.getByText(/Showing the Set from the code/)).toBeInTheDocument();
    expect(screen.queryByText('Inputs changed — recalculate')).toBeNull();
  });

  test('text that is not a Set code says so', () => {
    renderApp();
    paste('hello world');
    expect(screen.getByRole('alert')).toHaveTextContent('This is not a Set code.');
    expect(screen.getByLabelText('Paste a Set code')).toHaveAttribute('aria-invalid', 'true');
  });

  test('Load as target makes the shown Set the inputs, with Top-up 0', () => {
    const store = renderApp();
    paste(codeOf('cls10-weapon2Lock'));
    fireEvent.click(screen.getByRole('button', { name: 'Load as target' }));
    const { targets, locks, topUp } = store.getState().inputs;
    expect(targets.length).toBeGreaterThan(0);
    expect(locks.secondWeapon).not.toBeNull();
    expect(topUp).toEqual({ total: 0, perAttribute: 0 });
    expect(
      screen.getByRole('button', { name: 'Second weapon: details and Locks, Locked' }),
    ).toBeInTheDocument();
  });
});

describe('Second weapon picker', () => {
  const openSecond = () =>
    fireEvent.click(screen.getByRole('button', { name: /^Second weapon: details/ }));

  test('weapon type and quality are its own Locks', () => {
    const store = renderApp();
    openSecond();
    const dialog = screen.getByRole('dialog', { name: 'Second weapon' });
    fireEvent.change(within(dialog).getByRole('combobox', { name: 'Weapon type' }), {
      target: { value: '2' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Epic' }));
    const { locks } = store.getState().inputs;
    expect(locks.secondWeaponType).toBe(2);
    expect(locks.secondWeaponQuality).toBe(5);
    expect(locks.weaponType).toBeNull();
    expect(locks.quality).toBeNull();
  });

  test('while an exact weapon is pinned its type and quality are hidden; Unpin brings them back', () => {
    const store = renderApp();
    act(() => store.getState().setLock('secondWeapon', 3030101));
    openSecond();
    const dialog = screen.getByRole('dialog', { name: 'Second weapon' });
    expect(within(dialog).getByText(/Pinned to the exact weapon/)).toBeInTheDocument();
    expect(within(dialog).queryByRole('combobox', { name: 'Weapon type' })).toBeNull();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Unpin' }));
    expect(store.getState().inputs.locks.secondWeapon).toBeNull();
    expect(within(dialog).getByRole('combobox', { name: 'Weapon type' })).toBeInTheDocument();
  });
});
