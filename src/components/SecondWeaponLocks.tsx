import { useLocalized, useT } from '../i18n/use-t';
import { baseOf, selectBaseOptions, selectQualities } from '../store/selectors';
import { useBuild } from '../store/use-build';
import { Segmented } from './Segmented';

/**
 * The Second weapon's own Locks (ADR-0003): a weapon type and a quality, each
 * "any" by default, so the cheapest weapon is taken. An exact Item pinned by
 * Load as target wins over both; they are hidden until it is unpinned.
 */
export function SecondWeaponLocks() {
  const t = useT();
  const local = useLocalized();
  const qualities = useBuild(selectQualities);
  const weapons = useBuild(selectBaseOptions('weapon'));
  const locks = useBuild((state) => state.inputs.locks);
  const setLock = useBuild((state) => state.setLock);
  const pinned = locks.secondWeapon !== null;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">{t('secondWeaponNote')}</p>
      {pinned && (
        <p className="flex items-center justify-between gap-2 rounded-ui border border-accent/50 bg-accent/10 p-2.5 text-sm">
          {t('secondWeaponPinned')}
          <button
            type="button"
            onClick={() => setLock('secondWeapon', null)}
            className="control h-9 shrink-0 px-3 text-sm"
          >
            {t('unpin')}
          </button>
        </p>
      )}
      {!pinned && (
        <>
          <label className="block">
            <span className="mb-2 block text-xs font-medium tracking-wider text-muted uppercase">
              {t('weaponTypeLock')}
            </span>
            <select
              value={locks.secondWeaponType ?? ''}
              onChange={(event) => {
                const value = event.target.value === '' ? null : Number(event.target.value);
                setLock('secondWeaponType', value);
              }}
              className="control h-10 w-full px-2.5 text-sm"
            >
              <option value="">{t('cheapestAny')}</option>
              {weapons.map((item) => (
                <option key={baseOf(item)} value={baseOf(item)}>
                  {item.baseName ? local(item.baseName) : String(baseOf(item))}
                </option>
              ))}
            </select>
          </label>
          <div>
            <h3 className="mb-2 text-xs font-medium tracking-wider text-muted uppercase">
              {t('slotQuality')}
            </h3>
            <Segmented
              label={t('slotQuality')}
              value={locks.secondWeaponQuality}
              onChange={(quality) => setLock('secondWeaponQuality', quality)}
              options={[
                { value: null, label: t('anyQuality') },
                ...qualities.map((q) => ({
                  value: q.id,
                  label: <span style={{ color: q.color }}>{local(q.name)}</span>,
                  title: local(q.name),
                })),
              ]}
            />
          </div>
        </>
      )}
    </div>
  );
}
