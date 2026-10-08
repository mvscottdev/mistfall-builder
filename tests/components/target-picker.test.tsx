import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, test } from 'vitest';
import { renderApp } from './render-app';

afterEach(() => {
  cleanup();
  localStorage.clear();
});

const targetsOf = (store: ReturnType<typeof renderApp>) => store.getState().inputs.targets;

describe('Target picker (icon grid)', () => {
  test('a tap adds a Target at level 1, a second tap removes it', () => {
    const store = renderApp();
    fireEvent.click(screen.getByRole('button', { name: 'Wrath', pressed: false }));
    expect(targetsOf(store)).toEqual([{ attribute: 0, level: 1 }]);
    fireEvent.click(screen.getByRole('button', { name: 'Wrath', pressed: true }));
    expect(targetsOf(store)).toEqual([]);
  });

  test('category tabs show only that category, and count its picked Targets', () => {
    renderApp();
    expect(screen.queryByRole('button', { name: 'Tenacious' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /^Defense/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Tenacious' }));
    expect(screen.getByRole('button', { name: /^Defense\s*1$/ })).toBeInTheDocument();
  });

  test('hovering or focusing an icon tells what it does', () => {
    renderApp();
    expect(screen.getByText(/Hover or tap an icon/)).toBeInTheDocument();
    fireEvent.mouseEnter(screen.getByRole('button', { name: 'Wrath' }));
    expect(screen.getByText(/When Health is below N%/)).toBeInTheDocument();
    expect(screen.getByText('Tiers from level: 1 · 5')).toBeInTheDocument();
  });
});
