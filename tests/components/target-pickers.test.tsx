import { act, cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, test } from 'vitest';
import { selectBudget } from '../../src/store/selectors';
import { renderApp } from './render-app';

afterEach(() => {
  cleanup();
  localStorage.clear();
});

function renderWith(picker: 'grid' | 'codex' | 'tiles') {
  localStorage.setItem('mistfall-builder.picker', picker);
  return renderApp();
}

const targetsOf = (store: ReturnType<typeof renderApp>) => store.getState().inputs.targets;

describe('picker switch', () => {
  test('starts on the icon grid and remembers the chosen picker', () => {
    renderApp();
    const picker = screen.getByRole('group', { name: 'Target picker' });
    expect(within(picker).getByRole('button', { name: 'A — icon grid' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    fireEvent.click(within(picker).getByRole('button', { name: 'C — Target tiles' }));
    expect(localStorage.getItem('mistfall-builder.picker')).toBe('tiles');
  });
});

describe('A — icon grid', () => {
  test('a tap adds a Target at level 1, a second tap removes it', () => {
    const store = renderWith('grid');
    fireEvent.click(screen.getByRole('button', { name: 'Wrath', pressed: false }));
    expect(targetsOf(store)).toEqual([{ attribute: 0, level: 1 }]);
    fireEvent.click(screen.getByRole('button', { name: 'Wrath', pressed: true }));
    expect(targetsOf(store)).toEqual([]);
  });

  test('category tabs show only that category, and count its picked Targets', () => {
    renderWith('grid');
    expect(screen.queryByRole('button', { name: 'Tenacious' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /^Defense/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Tenacious' }));
    expect(screen.getByRole('button', { name: /^Defense\s*1$/ })).toBeInTheDocument();
  });

  test('hovering or focusing an icon tells what it does', () => {
    renderWith('grid');
    expect(screen.getByText(/Hover or tap an icon/)).toBeInTheDocument();
    fireEvent.mouseEnter(screen.getByRole('button', { name: 'Wrath' }));
    expect(screen.getByText(/When Health is below N%/)).toBeInTheDocument();
    expect(screen.getByText('Tiers from level: 1 · 5')).toBeInTheDocument();
  });
});

describe('B — searchable codex', () => {
  const open = () => fireEvent.click(screen.getByRole('button', { name: 'Add a Target' }));

  test('search narrows the icons by name; a tap toggles a Target and the Codex stays open', () => {
    const store = renderWith('codex');
    open();
    const codex = screen.getByRole('dialog', { name: 'Add a Target' });
    fireEvent.change(within(codex).getByRole('searchbox'), { target: { value: 'wra' } });
    expect(within(codex).getByRole('button', { name: 'Wrath' })).toBeInTheDocument();
    expect(within(codex).queryByRole('button', { name: 'Valor' })).toBeNull();
    fireEvent.click(within(codex).getByRole('button', { name: 'Wrath' }));
    expect(targetsOf(store)).toEqual([{ attribute: 0, level: 1 }]);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.change(within(codex).getByRole('searchbox'), { target: { value: 'zzz' } });
    expect(within(codex).getByText('Nothing found')).toBeInTheDocument();
  });

  test('Escape closes it and focus goes back to the button; Done closes it too', () => {
    renderWith('codex');
    open();
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByRole('button', { name: 'Add a Target' })).toHaveFocus();
    open();
    fireEvent.click(screen.getByRole('button', { name: 'Done' }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  test('a press outside closes it', () => {
    renderWith('codex');
    open();
    fireEvent.pointerDown(document.body);
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});

describe('C — Target tiles', () => {
  test('the + tile opens the Codex; a picked Target becomes a tile with its level', async () => {
    const store = renderWith('tiles');
    fireEvent.click(screen.getByRole('button', { name: 'Add a Target' }));
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Wrath' }));
    fireEvent.click(screen.getByRole('button', { name: 'Done' }));
    fireEvent.click(screen.getByRole('button', { name: 'Raise level: Wrath' }));
    expect(targetsOf(store)).toEqual([{ attribute: 0, level: 2 }]);
    fireEvent.click(screen.getByRole('button', { name: 'Remove Target: Wrath' }));
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Tiers: Wrath' })).toBeNull());
  });

  test('+ is disabled at the Budget', () => {
    const store = renderWith('tiles');
    act(() => store.getState().addTarget(0));
    act(() => store.getState().setTargetLevel(0, selectBudget(store.getState())));
    expect(screen.getByRole('button', { name: 'Raise level: Wrath' })).toBeDisabled();
  });

  test('tapping a tile badge shows its tiers', () => {
    const store = renderWith('tiles');
    act(() => store.getState().addTarget(0));
    fireEvent.click(screen.getByRole('button', { name: 'Tiers: Wrath' }));
    expect(screen.getByText('Lv 5–7')).toBeInTheDocument();
  });
});
