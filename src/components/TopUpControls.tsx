import { useT } from '../i18n/use-t';
import { useBuild } from '../store/use-build';
import { Stepper } from './Stepper';

/** Most Top-up the controls allow; the game's real limits are unconfirmed. */
const MAX_TOP_UP = 99;

/** Top-up pool and per-Attribute cap. */
export function TopUpControls() {
  const t = useT();
  const topUp = useBuild((state) => state.inputs.topUp);
  const setTopUp = useBuild((state) => state.setTopUp);
  const fields = [
    { key: 'total', label: t('topUpTotal') },
    { key: 'perAttribute', label: t('topUpPerAttribute') },
  ] as const;

  return (
    <fieldset>
      <legend className="mb-1 text-xs font-medium tracking-wider text-muted uppercase">
        {t('topUp')}
      </legend>
      <p className="mb-2 text-xs text-muted">{t('topUpHint')}</p>
      <div className="flex flex-wrap gap-x-4 gap-y-2">
        {fields.map(({ key, label }) => (
          <div key={key} className="flex items-center gap-2 text-sm">
            <span>{label}</span>
            <Stepper
              value={topUp[key]}
              min={0}
              max={MAX_TOP_UP}
              onChange={(value) => setTopUp({ ...topUp, [key]: value })}
              label={`${t('topUp')}: ${label}`}
              lowerLabel={`− ${label}`}
              raiseLabel={`+ ${label}`}
            />
          </div>
        ))}
      </div>
    </fieldset>
  );
}
