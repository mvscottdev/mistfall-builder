import type { BuildState } from './build-store';
import { sameInputs } from './inputs';

/** The shown result no longer matches the inputs (or there is none): Calculate would change it. */
export const selectStale = (state: BuildState): boolean =>
  state.resultInputs === null || !sameInputs(state.inputs, state.resultInputs);
