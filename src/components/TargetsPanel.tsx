import { AnimatePresence } from 'motion/react';
import { useT } from '../i18n/use-t';
import { selectAttributeById, selectBudget } from '../store/selectors';
import { useBuild } from '../store/use-build';
import { useChoice } from './choice';
import { Segmented } from './Segmented';
import { TargetPickerCodex } from './TargetPickerCodex';
import { TargetPickerGrid } from './TargetPickerGrid';
import { TargetRow } from './TargetRow';
import { TargetTiles } from './TargetTiles';

/** The three ways to pick Targets on offer while the maintainer chooses one. */
const PICKERS = ['grid', 'codex', 'tiles'] as const;

/** The Targets, a way to pick them, and the Budget they share. */
export function TargetsPanel() {
  const t = useT();
  const byId = useBuild(selectAttributeById);
  const targets = useBuild((state) => state.inputs.targets);
  const budget = useBuild(selectBudget);
  const [picker, setPicker] = useChoice('picker', PICKERS);
  const requested = targets.reduce((sum, target) => sum + target.level, 0);

  return (
    <section aria-labelledby="targets-title" className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 id="targets-title" className="panel-title">
            {t('targets')}
          </h2>
          <p className="text-xs text-muted">{t('targetsHint')}</p>
        </div>
        <Segmented
          label={t('pickerLabel')}
          value={picker}
          onChange={setPicker}
          className="text-xs"
          options={[
            { value: 'grid', label: 'A', title: t('pickerGrid') },
            { value: 'codex', label: 'B', title: t('pickerCodex') },
            { value: 'tiles', label: 'C', title: t('pickerTiles') },
          ]}
        />
      </div>

      {picker === 'grid' && <TargetPickerGrid />}
      {picker === 'codex' && <TargetPickerCodex />}
      {picker === 'tiles' ? (
        <TargetTiles />
      ) : targets.length === 0 ? (
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
                  budget={budget}
                />
              ) : null;
            })}
          </AnimatePresence>
        </ul>
      )}

      <p className={`text-xs tabular-nums ${requested > budget ? 'text-danger' : 'text-muted'}`}>
        {t('budgetLeft', { used: requested, budget })}
      </p>
    </section>
  );
}
