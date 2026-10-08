import type { Attribute } from '../domain/types';
import { useT } from '../i18n/use-t';
import { useBuild } from '../store/use-build';

/**
 * A level bar with tier ticks, and one row per tier. A tier is reached at
 * `fromLevel` (its `level` is the top of its range). Tier text exists only in
 * Russian, so English rows show the level range and how many levels are missing.
 */
export function TierList({ attribute, level }: { attribute: Attribute; level: number }) {
  const t = useT();
  const language = useBuild((state) => state.language);
  const top = Math.max(level, ...attribute.tiers.map((tier) => tier.level), 1);

  return (
    <div className="mt-2 space-y-1.5">
      <div aria-hidden className="relative h-1.5 overflow-hidden rounded-full bg-panel-2">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-accent transition-[width] duration-200"
          style={{ width: `${(Math.min(level, top) / top) * 100}%` }}
        />
        {attribute.tiers.map((tier) => (
          <span
            key={tier.fromLevel}
            className="absolute inset-y-0 w-px bg-bg"
            style={{ left: `${((tier.fromLevel - 1) / top) * 100}%` }}
          />
        ))}
      </div>
      <ul className="space-y-1">
        {attribute.tiers.map((tier) => {
          const reached = level >= tier.fromLevel;
          const range =
            tier.fromLevel === tier.level ? `${tier.level}` : `${tier.fromLevel}–${tier.level}`;
          return (
            <li
              key={tier.fromLevel}
              className={`flex gap-2 text-xs leading-snug ${reached ? 'text-text' : 'text-muted'}`}
            >
              <span
                className={`shrink-0 self-start rounded px-1.5 py-px font-semibold tabular-nums ${
                  reached ? 'bg-accent text-accent-ink' : 'bg-panel-2'
                }`}
              >
                {t('tierLevel', { level: range })}
              </span>
              <span>
                {language === 'ru' && <span>{tier.text} </span>}
                {reached ? (
                  <span className="sr-only">{t('reached')}</span>
                ) : (
                  <span className="text-muted italic">
                    {t('needMore', { n: tier.fromLevel - level })}
                  </span>
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
