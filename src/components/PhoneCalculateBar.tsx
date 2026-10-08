import { useT } from '../i18n/use-t';
import { selectShownSet } from '../store/selectors';
import { useBuild } from '../store/use-build';
import { CalculateButton } from './CalculateButton';
import { CostDisplay } from './CostDisplay';

/** Phones only: cost and Calculate stay at the bottom while the stacked page scrolls. */
export function PhoneCalculateBar() {
  const t = useT();
  const language = useBuild((state) => state.language);
  const shown = useBuild(selectShownSet);

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-panel/95 px-4 py-2.5 backdrop-blur md:hidden">
      <div className="mx-auto flex max-w-md items-center gap-3">
        <p className="min-w-0 shrink-0 leading-tight">
          <span className="block text-[0.65rem] tracking-wider text-muted uppercase">
            {t('totalCost')}
          </span>
          <span className="font-display text-xl font-semibold text-accent">
            {shown && shown.cost !== null ? (
              <CostDisplay cost={shown.cost} language={language} />
            ) : (
              '—'
            )}
          </span>
        </p>
        <div className="flex-1">
          <CalculateButton />
        </div>
      </div>
    </div>
  );
}
