import { createContext, useContext } from 'react';
import { useStore } from 'zustand';
import type { BuildState, BuildStore } from './build-store';

/** Provided once in main.tsx, after the Snapshot has loaded. */
export const BuildStoreContext = createContext<BuildStore | null>(null);

/** Reads the build store through a selector; re-renders only when the selected value changes. */
export function useBuild<T>(selector: (state: BuildState) => T): T {
  const store = useContext(BuildStoreContext);
  if (!store) throw new Error('useBuild needs a BuildStoreContext provider');
  return useStore(store, selector);
}
