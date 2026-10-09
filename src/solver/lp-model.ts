import type { Target, TopUp } from '../domain/types';
import type { SlotVariants } from './variants';

/** Rows, and the binaries they add, that keep one earlier Set from coming back. */
export interface AvoidCut {
  rows: string[];
  binaries: string[];
}

/** What the MIP is built from. */
export interface LpModel {
  slots: SlotVariants[];
  targets: Target[];
  topUp: TopUp;
  /** One per earlier Set an Alternative must differ from; none for the first Set. */
  avoid?: AvoidCut[];
}

export type LpGoal =
  | { minimise: 'cost' }
  /** Second phase: least Top-up among Sets costing at most `costCap`. */
  | { minimise: 'topUp'; costCap: number };

export const variantName = (s: number, v: number) => `x_${s}_${v}`;
export const topUpName = (target: Target) => `t_${target.attribute}`;

function priceTerms({ slots }: LpModel): string[] {
  return slots.flatMap((slot, s) =>
    slot.variants.flatMap((variant, v) =>
      variant.price ? [`${variant.price} ${variantName(s, v)}`] : [],
    ),
  );
}

function constraints(model: LpModel, goal: LpGoal, firstVariant: string): string[] {
  const { slots, targets, topUp } = model;
  const rows = slots.map(
    (slot, s) => ` slot${s}: ${slot.variants.map((_, v) => variantName(s, v)).join(' + ')} = 1`,
  );
  targets.forEach((target, d) => {
    const terms = slots.flatMap((slot, s) =>
      slot.variants.flatMap((variant, v) =>
        variant.vector[d] ? [`${variant.vector[d]} ${variantName(s, v)}`] : [],
      ),
    );
    terms.push(topUpName(target));
    rows.push(` attr${d}: ${terms.join(' + ')} >= ${target.level}`);
  });
  if (targets.length) rows.push(` topup: ${targets.map(topUpName).join(' + ')} <= ${topUp.total}`);
  for (const cut of model.avoid ?? []) rows.push(...cut.rows);
  if (goal.minimise === 'topUp') {
    const cost = priceTerms(model).join(' + ') || `0 ${firstVariant}`;
    rows.push(` costcap: ${cost} <= ${goal.costCap}`);
  }
  return rows;
}

/**
 * The MIP in CPLEX LP text, as HiGHS reads it.
 *
 * - `x_<slot>_<variant>`: binary, 1 = this variant fills the Slot; exactly one per Slot.
 * - `t_<attribute>`: integer Top-up for a Target, 0 ≤ t ≤ min(per-Attribute cap, level),
 *   all together ≤ the Top-up total.
 * - Per Target: levels from the chosen variants + Top-up ≥ the Target level.
 * - Per earlier Set to avoid: the rows of its cut (see avoidCut).
 *
 * The text is kept byte-for-byte as the old solver wrote it: HiGHS breaks ties
 * between equal-cost Sets by variable and row order.
 */
export function lpText(model: LpModel, goal: LpGoal): string {
  const { slots, targets, topUp } = model;
  const binaries = slots.flatMap((slot, s) => slot.variants.map((_, v) => variantName(s, v)));
  const firstVariant = binaries[0] ?? '';
  for (const cut of model.avoid ?? []) binaries.push(...cut.binaries);
  const objective =
    goal.minimise === 'cost' ? priceTerms(model) : targets.map((t) => `1 ${topUpName(t)}`);

  const lines = ['Minimize', ` obj: ${objective.join(' + ') || `0 ${firstVariant}`}`, 'Subject To'];
  lines.push(...constraints(model, goal, firstVariant));
  if (targets.length) {
    lines.push('Bounds');
    lines.push(
      ...targets.map((t) => ` 0 <= ${topUpName(t)} <= ${Math.min(topUp.perAttribute, t.level)}`),
    );
  }
  lines.push('Binary', ...binaries);
  if (targets.length) lines.push('General', ...targets.map(topUpName));
  lines.push('End');
  return lines.join('\n');
}
