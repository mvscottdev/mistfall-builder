import { useT } from '../i18n/use-t';
import { MAX_ALTERNATIVES } from '../store/alternatives';
import { useBuild } from '../store/use-build';
import { formatGold } from './item-name';

const NUMBERS = Array.from({ length: MAX_ALTERNATIVES }, (_, i) => i);

/**
 * Buttons for the cheapest Set and up to four Alternatives. One not found yet
 * is solved when picked; past the last one the solver found, they are off.
 */
export function AlternativePicker() {
  const t = useT();
  const language = useBuild((state) => state.language);
  const alternatives = useBuild((state) => state.alternatives);
  const result = useBuild((state) => state.result);
  const noMore = useBuild((state) => state.noMoreAlternatives);
  const busy = useBuild((state) => state.busy);
  const showAlternative = useBuild((state) => state.showAlternative);
  const shownIndex = alternatives.findIndex((alternative) => alternative === result);
  if (shownIndex < 0) return null;
  const cheapest = alternatives[0]?.set.cost ?? 0;

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium tracking-wider text-muted uppercase">{t('alternatives')}</p>
      <div role="group" aria-label={t('alternatives')} aria-busy={busy} className="flex gap-1">
        {NUMBERS.map((i) => {
          const found = alternatives[i];
          const pressed = i === shownIndex;
          const name = found
            ? t('alternativeCost', { n: i + 1, cost: formatGold(found.set.cost, language) })
            : t('alternative', { n: i + 1 });
          return (
            <button
              key={i}
              type="button"
              aria-pressed={pressed}
              aria-label={name}
              title={name}
              disabled={busy || (!found && noMore)}
              onClick={() => void showAlternative(i)}
              className={`control flex min-h-10 flex-1 flex-col items-center justify-center rounded-[var(--radius)] px-1 text-sm transition-colors disabled:opacity-40 md:min-h-9 ${
                pressed ? 'bg-line-strong text-text' : 'text-muted hover:text-text'
              }`}
            >
              <span aria-hidden>{i + 1}</span>
              {found && i > 0 && (
                <span aria-hidden className="text-[10px] leading-none tabular-nums">
                  +{formatGold(found.set.cost - cheapest, language)}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-muted">
        {noMore && shownIndex === alternatives.length - 1
          ? t('noMoreAlternatives')
          : t('alternativesHint')}
      </p>
    </div>
  );
}
