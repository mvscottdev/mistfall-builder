import { AnimatePresence, motion } from 'motion/react';
import { useT } from '../i18n/use-t';
import { selectShownSet, selectOutdated } from '../store/selectors';
import { useBuild } from '../store/use-build';
import { AlternativePicker } from './AlternativePicker';
import { CalculateButton } from './CalculateButton';
import { CostDisplay } from './CostDisplay';
import { LevelsList } from './LevelsList';
import { ResultMessage } from './ResultMessage';
import { SetCodeBox } from './SetCodeBox';
import { SetCodeImport } from './SetCodeImport';

/** Cost, Calculate, Attribute levels and Set code of the shown result. */
export function Summary() {
  const t = useT();
  const language = useBuild((state) => state.language);
  const shown = useBuild(selectShownSet);
  const outdated = useBuild(selectOutdated);
  const busy = useBuild((state) => state.busy);
  const topUpUsed = shown ? Object.values(shown.topUp).reduce((sum, n) => sum + n, 0) : 0;

  return (
    <section aria-label={t('totalCost')} className="space-y-4">
      <div aria-busy={busy}>
        <p className="text-xs font-medium tracking-wider text-muted uppercase">{t('totalCost')}</p>
        <p className="flex items-baseline gap-2">
          <span className="font-display text-4xl font-semibold text-accent">
            {shown && shown.cost !== null ? (
              <CostDisplay cost={shown.cost} language={language} />
            ) : (
              '—'
            )}
          </span>
          <span className="text-sm text-muted">{t('gold')}</span>
        </p>
        {/* Read out once, not every frame of the count-up. */}
        <p className="sr-only" aria-live="polite">
          {shown && shown.cost !== null ? `${t('totalCost')}: ${shown.cost} ${t('gold')}` : ''}
        </p>
        {topUpUsed > 0 && <p className="text-xs text-muted">{t('topUpUsed', { n: topUpUsed })}</p>}
      </div>
      <div className="hidden xl:block">
        <CalculateButton />
      </div>
      <AnimatePresence initial={false}>
        {outdated && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden text-center text-xs text-accent"
          >
            {t('stale')}
          </motion.p>
        )}
      </AnimatePresence>
      <ResultMessage />
      <AlternativePicker />
      <LevelsList />
      <SetCodeBox />
      <SetCodeImport />
    </section>
  );
}
