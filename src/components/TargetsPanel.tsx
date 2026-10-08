import { AnimatePresence } from 'motion/react';
import type { AttributeCategory } from '../domain/types';
import type { TextKey } from '../i18n/dictionary';
import { useLocalized, useT } from '../i18n/use-t';
import { selectAttributeById, selectAttributes, selectBudget } from '../store/selectors';
import { useBuild } from '../store/use-build';
import { TargetRow } from './TargetRow';

const CATEGORIES: [AttributeCategory, TextKey][] = [
  ['offense', 'categoryOffense'],
  ['defense', 'categoryDefense'],
  ['utility', 'categoryUtility'],
];

/** The Targets list with an Attribute picker and the Budget they share. */
export function TargetsPanel() {
  const t = useT();
  const local = useLocalized();
  const attributes = useBuild(selectAttributes);
  const byId = useBuild(selectAttributeById);
  const targets = useBuild((state) => state.inputs.targets);
  const budget = useBuild(selectBudget);
  const addTarget = useBuild((state) => state.addTarget);

  const targeted = new Set(targets.map((target) => target.attribute));
  const requested = targets.reduce((sum, target) => sum + target.level, 0);
  const byName = (a: { name: { ru: string; en: string } }, b: typeof a) =>
    local(a.name).localeCompare(local(b.name));

  return (
    <section aria-labelledby="targets-title" className="space-y-3">
      <div>
        <h2 id="targets-title" className="panel-title">
          {t('targets')}
        </h2>
        <p className="text-xs text-muted">{t('targetsHint')}</p>
      </div>

      <select
        aria-label={t('addTarget')}
        value=""
        onChange={(event) => {
          if (event.target.value) addTarget(Number(event.target.value));
        }}
        className="control h-10 w-full px-2.5 text-sm"
      >
        <option value="">{t('addTarget')}</option>
        {CATEGORIES.map(([category, label]) => (
          <optgroup key={category} label={t(label)}>
            {attributes
              .filter((a) => a.category === category && !targeted.has(a.id))
              .sort(byName)
              .map((a) => (
                <option key={a.id} value={a.id}>
                  {local(a.name)}
                </option>
              ))}
          </optgroup>
        ))}
      </select>

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
