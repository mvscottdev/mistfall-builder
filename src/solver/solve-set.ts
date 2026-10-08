import type {
  AttributeId,
  Catalogue,
  ClassId,
  Locks,
  SolvedSet,
  Target,
  TopUp,
} from '../domain/types';
import { budget, isOverBudget, requestedPoints } from './budget';
import { solveMip, type Highs } from './mip';
import { setVariants } from './variants';

export interface SolveRequest {
  classId: ClassId;
  /** In the order the user added them; HiGHS tie-breaking follows it. */
  targets: Target[];
  locks: Locks;
  topUp: TopUp;
}

export type SolveOutcome =
  | { kind: 'solved'; set: SolvedSet }
  /** Targets ask for more than Budget + Top-up total; the solver didn't run. */
  | { kind: 'overBudget'; requested: number; budget: number; topUpTotal: number }
  /** No Set meets the Targets. */
  | { kind: 'infeasible' };

/** The cheapest Set for the request; at equal cost, the one with least Top-up. */
export function solveSet(catalogue: Catalogue, highs: Highs, request: SolveRequest): SolveOutcome {
  const { classId, targets, locks, topUp } = request;
  const requested = requestedPoints(targets);
  const budgetPoints = budget(catalogue, classId, locks);
  if (isOverBudget(requested, budgetPoints, topUp)) {
    return { kind: 'overBudget', requested, budget: budgetPoints, topUpTotal: topUp.total };
  }

  const order = targets.map((target) => target.attribute);
  const slots = setVariants(catalogue, classId, locks, order);
  if (slots.some((slot) => slot.variants.length === 0)) return { kind: 'infeasible' };
  const choice = solveMip(highs, { slots, targets, topUp });
  if (!choice) return { kind: 'infeasible' };

  const topUpSpent: Record<AttributeId, number> = {};
  order.forEach((attribute, d) => {
    const levels = choice.topUp[d] ?? 0;
    if (levels) topUpSpent[attribute] = levels;
  });
  const pieces = slots.map((slot, s) => {
    const variant = slot.variants[choice.variantIndex[s] ?? 0];
    if (!variant) throw new Error(`solver chose no variant for ${slot.slot}`);
    return {
      slot: slot.slot,
      itemId: variant.item.id,
      gemIds: variant.gems.map((gem) => gem?.id ?? null),
    };
  });
  return {
    kind: 'solved',
    set: {
      cost: choice.cost,
      pieces,
      topUp: topUpSpent,
      topUpUsed: Object.values(topUpSpent).reduce((sum, n) => sum + n, 0),
    },
  };
}
