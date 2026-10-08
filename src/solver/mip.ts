import type highsLoader from 'highs';
import { lpText, topUpName, variantName, type LpModel } from './lp-model';

export type Highs = Awaited<ReturnType<typeof highsLoader>>;
type HighsSolution = ReturnType<Highs['solve']>;

export interface MipChoice {
  /** Gold, rounded. */
  cost: number;
  /** Index of the chosen variant, per Slot. */
  variantIndex: number[];
  /** Top-up per Target, in Target order. */
  topUp: number[];
}

const OPTIONS = { output_flag: false } as const;

function primal(solution: HighsSolution, column: string): number {
  const found = solution.Columns[column];
  return found && 'Primal' in found ? found.Primal : 0;
}

/** The variant with the largest primal value; the first one on a tie. */
function chosenVariant(solution: HighsSolution, model: LpModel, s: number): number {
  let best = 0;
  let bestValue = -1;
  model.slots[s]?.variants.forEach((_, v) => {
    const value = primal(solution, variantName(s, v));
    if (value > bestValue) {
      bestValue = value;
      best = v;
    }
  });
  return best;
}

/**
 * Two phases: minimise gold; then, with gold capped at that minimum, minimise
 * Top-up spent. If the second phase isn't Optimal the first one's answer stands.
 * Returns null when no Set meets the Targets. HiGHS errors are thrown.
 */
export function solveMip(highs: Highs, model: LpModel): MipChoice | null {
  const first = highs.solve(lpText(model, { minimise: 'cost' }), OPTIONS);
  if (first.Status !== 'Optimal') return null;
  const cost = Math.round(first.ObjectiveValue);
  let final = first;
  if (model.targets.length) {
    const second = highs.solve(lpText(model, { minimise: 'topUp', costCap: cost }), OPTIONS);
    if (second.Status === 'Optimal') final = second;
  }
  return {
    cost,
    variantIndex: model.slots.map((_, s) => chosenVariant(final, model, s)),
    topUp: model.targets.map((target) => Math.round(primal(final, topUpName(target)))),
  };
}
