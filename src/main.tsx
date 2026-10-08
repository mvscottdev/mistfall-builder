import { StrictMode, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { loadCatalogue } from './catalogue/load';
import { App } from './components/App';
import { LoadError } from './components/LoadError';
import './index.css';
import { createBuildStore } from './store/build-store';
import { BuildStoreContext } from './store/use-build';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('#root element missing from index.html');
const root = createRoot(rootElement);

const render = (node: ReactNode) => root.render(<StrictMode>{node}</StrictMode>);

loadCatalogue().then(
  (catalogue) =>
    render(
      <BuildStoreContext value={createBuildStore(catalogue)}>
        <App />
      </BuildStoreContext>,
    ),
  (error: unknown) =>
    render(<LoadError message={error instanceof Error ? error.message : String(error)} />),
);
