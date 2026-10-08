import { StrictMode, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { loadCatalogue } from './catalogue/load';
import { App } from './components/App';
import { LoadError } from './components/LoadError';
import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('#root element missing from index.html');
const root = createRoot(rootElement);

const render = (node: ReactNode) => root.render(<StrictMode>{node}</StrictMode>);

// Loading only validates the data for now; nothing reads the Catalogue yet.
loadCatalogue().then(
  () => render(<App />),
  (error: unknown) =>
    render(<LoadError message={error instanceof Error ? error.message : String(error)} />),
);
