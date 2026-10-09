import type { Catalogue } from '../domain/types';
import { solve, type SolveOutcome, type SolveRequest } from '../solver/solve';

/** A solver outcome that holds a Set. */
export type SolvedResult = Extract<SolveOutcome, { kind: 'solved' }>;

/** Most Alternatives offered, the cheapest Set included. */
export const MAX_ALTERNATIVES = 5;

/**
 * Solves Alternatives after `found`, one at a time, until there is one at
 * `index` or the solver finds no more (`noMore`). Each must differ from every
 * Alternative before it, so they can't be solved out of order.
 */
export async function findAlternatives(
  catalogue: Catalogue,
  asked: SolveRequest,
  found: SolvedResult[],
  index: number,
): Promise<{ found: SolvedResult[]; noMore: boolean }> {
  while (found.length <= index) {
    const avoid = found.map((alternative) => alternative.set.pieces);
    const outcome = await solve(catalogue, asked, avoid);
    if (outcome.kind !== 'solved') return { found, noMore: true };
    found = [...found, outcome];
  }
  return { found, noMore: false };
}
