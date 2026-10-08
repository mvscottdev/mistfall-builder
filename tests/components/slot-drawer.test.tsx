import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, expect, test } from 'vitest';
import { renderApp } from './render-app';

afterEach(() => {
  cleanup();
  localStorage.clear();
});

function openSlot(slot: string) {
  const tile = screen.getByRole('button', { name: `${slot}: details and Locks` });
  fireEvent.click(tile);
  return { tile, dialog: screen.getByRole('dialog', { name: slot }) };
}

test('the drawer takes focus, closes on Escape and gives focus back to its Slot', async () => {
  renderApp();
  const { tile, dialog } = openSlot('Helmet');
  expect(dialog).toContainElement(document.activeElement as HTMLElement);
  fireEvent.keyDown(dialog, { key: 'Escape' });
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  expect(tile).toHaveFocus();
});

test('a per-Slot quality override is set and cleared in the drawer, and marks the Slot', () => {
  const store = renderApp();
  const { dialog } = openSlot('Helmet');
  fireEvent.click(within(dialog).getByRole('button', { name: 'Legendary' }));
  expect(store.getState().inputs.locks.slotQuality).toEqual({ helmet: 6 });
  expect(
    screen.getByRole('button', { name: 'Helmet: details and Locks, Locked' }),
  ).toBeInTheDocument();
  fireEvent.click(within(dialog).getByRole('button', { name: 'Same as set' }));
  expect(screen.getByRole('button', { name: 'Helmet: details and Locks' })).toBeInTheDocument();
  expect(store.getState().inputs.locks.slotQuality).toEqual({});
});

test('the weapon type picker shows for a Slot with 2+ types, sets its Lock and shows base stats', () => {
  const store = renderApp();
  const { dialog } = openSlot('Weapon');
  const picker = within(dialog).getByRole('combobox', { name: 'Weapon type' });
  fireEvent.change(picker, { target: { value: '2' } });
  expect(store.getState().inputs.locks.weaponType).toBe(2);
  expect(within(dialog).getByText('attack')).toBeInTheDocument();
  fireEvent.change(picker, { target: { value: '' } });
  expect(store.getState().inputs.locks.weaponType).toBeNull();
});

test('amulet bases are picked under the Base label', () => {
  renderApp();
  const { dialog } = openSlot('Amulet');
  expect(within(dialog).getByRole('combobox', { name: 'Base' })).toBeInTheDocument();
});

test('the page behind an open drawer is inert', async () => {
  renderApp();
  const { tile, dialog } = openSlot('Helmet');
  const page = tile.closest<HTMLElement>('body > *');
  expect(page?.inert).toBe(true);
  fireEvent.keyDown(dialog, { key: 'Escape' });
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  expect(page?.inert).toBe(false);
});

test('armour Slots have no base picker', () => {
  renderApp();
  const { dialog } = openSlot('Helmet');
  expect(within(dialog).queryByRole('combobox')).toBeNull();
});

test('the Second weapon drawer has no Locks yet', () => {
  renderApp();
  const { dialog } = openSlot('Second weapon');
  expect(within(dialog).queryByRole('group', { name: 'Slot quality' })).toBeNull();
});
