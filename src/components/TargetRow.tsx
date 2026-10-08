import { motion } from 'motion/react';
import type { Attribute } from '../domain/types';
import { useLocalized, useT } from '../i18n/use-t';
import { useBuild } from '../store/use-build';
import { AttributeGlyph } from './AttributeGlyph';
import { Stepper } from './Stepper';
import { TierList } from './TierList';

/** One Target: the Attribute, a level stepper capped at the Budget plus wine, and its tiers. */
export function TargetRow({
  attribute,
  level,
  max,
}: {
  attribute: Attribute;
  level: number;
  max: number;
}) {
  const t = useT();
  const local = useLocalized();
  const setTargetLevel = useBuild((state) => state.setTargetLevel);
  const removeTarget = useBuild((state) => state.removeTarget);
  const name = local(attribute.name);

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -12 }}
      className="rounded-ui border border-line bg-panel-2/60 p-2.5"
    >
      <div className="flex items-center gap-2">
        <AttributeGlyph attribute={attribute} className="size-9" />
        <span className="min-w-0 flex-1 truncate font-medium" title={local(attribute.description)}>
          {name}
        </span>
        <Stepper
          value={level}
          min={1}
          max={max}
          onChange={(value) => setTargetLevel(attribute.id, value)}
          label={t('levelOf', { name })}
          lowerLabel={t('lowerLevel', { name })}
          raiseLabel={t('raiseLevel', { name })}
          raiseTitle={t('atBudget')}
        />
        <button
          type="button"
          aria-label={t('removeTarget', { name })}
          onClick={() => removeTarget(attribute.id)}
          className="grid size-10 place-items-center rounded-ui text-muted md:size-8 transition-colors hover:bg-panel hover:text-danger"
        >
          ✕
        </button>
      </div>
      <TierList attribute={attribute} level={level} />
    </motion.li>
  );
}
