import type {
  Catalogue,
  ClassId,
  Contribution,
  Locks,
  ModSlot,
  Target,
  TopUp,
} from '../domain/types';
import { slotCandidates } from './candidates';
import { fittingGems } from './mod-options';

function points(contribution: Contribution): number {
  return Object.values(contribution).reduce((sum, n) => sum + n, 0);
}

/** Most points a Mod slot can give: its Built-in effect, or the best fitting Gem (a double counts 2). */
function modMaxPoints(catalogue: Catalogue, mod: ModSlot): number {
  if (mod.kind === 'builtIn') return points(mod.contribution);
  return Math.max(0, ...fittingGems(catalogue, mod).map((gem) => points(gem.contribution)));
}

/** Sum over active Slots of the most points an Item there can give. The Second weapon is not in it. */
export function budget(catalogue: Catalogue, classId: ClassId, locks: Locks): number {
  let sum = 0;
  for (const slot of catalogue.slotOrder) {
    const items = slotCandidates(catalogue, slot, classId, locks);
    if (!items.length) continue;
    sum += Math.max(
      ...items.map((item) =>
        item.modSlots.reduce((total, mod) => total + modMaxPoints(catalogue, mod), 0),
      ),
    );
  }
  return sum;
}

/** Sum of Target levels. */
export function requestedPoints(targets: Target[]): number {
  return targets.reduce((sum, target) => sum + target.level, 0);
}

/** Targets asking for more than Budget + Top-up total can't be met; don't solve. */
export function isOverBudget(requested: number, budgetPoints: number, topUp: TopUp): boolean {
  return requested > budgetPoints + topUp.total;
}
