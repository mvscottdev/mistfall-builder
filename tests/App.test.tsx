import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, test } from 'vitest';
import { App } from '../src/components/App';
import { createBuildStore } from '../src/store/build-store';
import { BuildStoreContext } from '../src/store/use-build';
import { pageCatalogue } from './solver/page-catalogue';

afterEach(() => {
  cleanup();
  localStorage.clear();
});

function renderApp() {
  const store = createBuildStore(pageCatalogue());
  render(
    <BuildStoreContext value={store}>
      <App />
    </BuildStoreContext>,
  );
  return store;
}

test('placeholder page shows the app name', () => {
  renderApp();
  expect(screen.getByRole('heading', { name: 'Mistfall Builder' })).toBeInTheDocument();
});

test('UI text and the page language follow the chosen language', () => {
  const store = renderApp();
  act(() => store.getState().setLanguage('ru'));
  expect(screen.getByText('Скоро будет.')).toBeInTheDocument();
  expect(document.documentElement.lang).toBe('ru');
  act(() => store.getState().setLanguage('en'));
  expect(screen.getByText('Coming soon.')).toBeInTheDocument();
  expect(document.documentElement.lang).toBe('en');
});
