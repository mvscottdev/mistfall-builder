import { render } from '@testing-library/react';
import { App } from '../../src/components/App';
import { createBuildStore } from '../../src/store/build-store';
import { BuildStoreContext } from '../../src/store/use-build';
import { pageCatalogue } from '../solver/page-catalogue';

export const catalogue = pageCatalogue();

/** The whole app on the old page's data, in English unless asked otherwise. */
export function renderApp(language: 'en' | 'ru' = 'en') {
  const store = createBuildStore(catalogue);
  store.getState().setLanguage(language);
  render(
    <BuildStoreContext value={store}>
      <App />
    </BuildStoreContext>,
  );
  return store;
}
