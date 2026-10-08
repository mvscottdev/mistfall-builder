import { AnimatePresence } from 'motion/react';
import { useT } from '../i18n/use-t';
import { selectAttributeById, selectBudget, selectTargetLevelCap } from '../store/selectors';
import { useBuild } from '../store/use-build';
import { TargetPickerGrid } from './TargetPickerGrid';
import { TargetRow } from './TargetRow';

/** The Targets: an icon grid to pick them, their rows, and the Budget plus wine they share. */
export function TargetsPanel() {
  const t = useT();
  const byId = useBuild(selectAttributeById);
  const targets = useBuild((state) => state.inputs.targets);
  const budget = useBuild(selectBudget);
  const levelCap = useBuild(selectTargetLevelCap);
  const wine = useBuild((state) => state.inputs.topUp.total);
  const requested = targets.reduce((sum, target) => sum + target.level, 0);

  return (
    <section aria-labelledby="targets-title" className="space-y-3">
      <div>
        <h2 id="targets-title" className="panel-title">
          {t('targets')}
        </h2>
        <p className="text-xs text-muted">{t('targetsHint')}</p>
      </div>

      <TargetPickerGrid />
      {targets.length === 0 ? (
        <p className="rounded-ui border border-dashed border-line p-3 text-center text-sm text-muted">
          {t('noTargets')}
        </p>
      ) : (
        <ul className="space-y-2">
          <AnimatePresence initial={false}>
            {targets.map((target) => {
              const attribute = byId.get(target.attribute);
              return attribute ? (
                <TargetRow
                  key={target.attribute}
                  attribute={attribute}
                  level={target.level}
                  max={levelCap}
                />
              ) : null;
            })}
          </AnimatePresence>
        </ul>
      )}

      <p
        className={`text-xs tabular-nums ${requested > budget + wine ? 'text-danger' : 'text-muted'}`}
      >
        {t('budgetLeft', { used: requested, max: budget + wine, budget, wine })}
      </p>
    </section>
  );
}
