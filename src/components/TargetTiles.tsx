import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useRef, useState } from 'react';
import type { AttributeId } from '../domain/types';
import { useLocalized, useT } from '../i18n/use-t';
import { selectAttributeById, selectBudget } from '../store/selectors';
import { useBuild } from '../store/use-build';
import { AttributeGlyph } from './AttributeGlyph';
import { CodexPanel } from './CodexPanel';
import { Stepper } from './Stepper';
import { TierList } from './TierList';

/**
 * Variant C: each Target is a small tile (badge, tier marks, level Stepper); a "+" tile opens
 * the Codex. Tapping a badge shows that Target's tiers under the tiles.
 */
export function TargetTiles() {
  const t = useT();
  const local = useLocalized();
  const byId = useBuild(selectAttributeById);
  const targets = useBuild((state) => state.inputs.targets);
  const budget = useBuild(selectBudget);
  const setTargetLevel = useBuild((state) => state.setTargetLevel);
  const removeTarget = useBuild((state) => state.removeTarget);
  const [codexOpen, setCodexOpen] = useState(false);
  const addButton = useRef<HTMLButtonElement>(null);
  const closeCodex = useCallback(() => {
    setCodexOpen(false);
    addButton.current?.focus();
  }, []);
  const [opened, setOpened] = useState<AttributeId | null>(null);
  const openedTarget = targets.find((target) => target.attribute === opened);
  const openedAttribute = openedTarget && byId.get(openedTarget.attribute);

  return (
    <div className="relative space-y-2">
      {/* Two columns where the panel is narrow, so the level Stepper keeps full-size buttons. */}
      <ul className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 md:grid-cols-2">
        <AnimatePresence initial={false}>
          {targets.map(({ attribute: id, level }) => {
            const attribute = byId.get(id);
            if (!attribute) return null;
            const name = local(attribute.name);
            return (
              <motion.li
                key={id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={`relative flex flex-col items-center gap-1 rounded-ui border bg-panel-2/60 px-1 pt-2 pb-1 ${
                  opened === id ? 'border-accent' : 'border-line'
                }`}
              >
                <button
                  type="button"
                  aria-expanded={opened === id}
                  aria-label={t('showTiers', { name })}
                  onClick={() => setOpened(opened === id ? null : id)}
                  className="rounded-ui"
                >
                  <AttributeGlyph attribute={attribute} className="size-11" />
                </button>
                <span
                  className="w-full truncate text-center text-[0.7rem] leading-tight"
                  title={name}
                >
                  {name}
                </span>
                <span aria-hidden className="flex gap-1">
                  {attribute.tiers.map((tier) => (
                    <span
                      key={tier.fromLevel}
                      className={`h-1 w-3 rounded-full ${level >= tier.fromLevel ? 'bg-accent' : 'bg-line-strong'}`}
                    />
                  ))}
                </span>
                <Stepper
                  value={level}
                  min={1}
                  max={budget}
                  onChange={(value) => setTargetLevel(id, value)}
                  label={t('levelOf', { name })}
                  lowerLabel={t('lowerLevel', { name })}
                  raiseLabel={t('raiseLevel', { name })}
                  raiseTitle={t('atBudget')}
                />
                <button
                  type="button"
                  aria-label={t('removeTarget', { name })}
                  onClick={() => {
                    removeTarget(id);
                    if (opened === id) setOpened(null);
                    addButton.current?.focus();
                  }}
                  className="absolute top-0.5 right-0.5 grid size-8 place-items-center rounded-ui text-xs text-muted hover:text-danger"
                >
                  ✕
                </button>
              </motion.li>
            );
          })}
        </AnimatePresence>
        <li>
          <button
            ref={addButton}
            type="button"
            aria-expanded={codexOpen}
            aria-haspopup="dialog"
            onClick={() => setCodexOpen((o) => !o)}
            className="flex size-full min-h-[7.25rem] flex-col items-center justify-center gap-1 rounded-ui border border-dashed border-line-strong text-xs text-muted transition-colors hover:border-accent hover:text-accent"
          >
            <span aria-hidden className="text-2xl leading-none">
              +
            </span>
            {t('addTargetButton')}
          </button>
        </li>
      </ul>
      {codexOpen && <CodexPanel onClose={closeCodex} />}
      {openedTarget && openedAttribute && (
        <div className="rounded-ui border border-line bg-panel-2/60 p-2.5">
          <p className="text-sm font-semibold">{local(openedAttribute.name)}</p>
          <p className="text-xs text-muted">{local(openedAttribute.description)}</p>
          <TierList attribute={openedAttribute} level={openedTarget.level} />
        </div>
      )}
    </div>
  );
}
