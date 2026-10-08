import { useT } from '../i18n/use-t';
import { selectPricesUpdatedAt } from '../store/selectors';
import { useBuild } from '../store/use-build';
import type { Design } from './design';
import { Segmented } from './Segmented';

/** App name, price date, language and look switches. */
export function Header({
  design,
  onDesign,
}: {
  design: Design;
  onDesign: (design: Design) => void;
}) {
  const t = useT();
  const language = useBuild((state) => state.language);
  const setLanguage = useBuild((state) => state.setLanguage);
  const pricesUpdatedAt = useBuild(selectPricesUpdatedAt);

  return (
    <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b border-line pb-4">
      <div className="min-w-0">
        <h1 className="font-display text-2xl font-semibold tracking-wide sm:text-3xl">
          {t('appTitle')}
        </h1>
        <p className="text-sm text-muted">{t('tagline')}</p>
        <p className="text-xs text-muted sm:hidden">
          <time dateTime={pricesUpdatedAt}>{t('pricesFrom', { date: pricesUpdatedAt })}</time>
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="control hidden px-2.5 py-1.5 text-xs text-muted sm:inline">
          <time dateTime={pricesUpdatedAt}>{t('pricesFrom', { date: pricesUpdatedAt })}</time>
        </span>
        <Segmented
          label={t('design')}
          value={design}
          onChange={onDesign}
          options={[
            { value: 'forge', label: t('designForge') },
            { value: 'mist', label: t('designMist') },
          ]}
        />
        <Segmented
          label={t('language')}
          value={language}
          onChange={setLanguage}
          options={[
            { value: 'ru', label: 'RU', title: 'Русский' },
            { value: 'en', label: 'EN', title: 'English' },
          ]}
        />
      </div>
    </header>
  );
}
