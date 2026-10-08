import type { Slot } from '../domain/types';
import { useLocalized, useT } from '../i18n/use-t';
import { BASE_LOCK, baseOf, selectBaseOptions, selectQualities } from '../store/selectors';
import { useBuild } from '../store/use-build';
import { Segmented } from './Segmented';

/** A main Slot's quality override and, where the Slot has 2+ bases, its weapon type or base Lock. */
export function SlotLocks({ slot }: { slot: Slot }) {
  const t = useT();
  const local = useLocalized();
  const qualities = useBuild(selectQualities);
  const override = useBuild((state) => state.inputs.locks.slotQuality[slot] ?? null);
  const setSlotQuality = useBuild((state) => state.setSlotQuality);
  const setLock = useBuild((state) => state.setLock);
  const baseLock = BASE_LOCK[slot];
  const bases = useBuild(selectBaseOptions(slot));
  const lockedBase = useBuild((state) => (baseLock ? state.inputs.locks[baseLock] : null));
  // Base stats of the locked base, shown under the picker (option tooltips rarely show).
  const chosen = bases.find((item) => baseOf(item) === lockedBase);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="mb-2 text-xs font-medium tracking-wider text-muted uppercase">
          {t('slotQuality')}
        </h3>
        <Segmented
          label={t('slotQuality')}
          value={override}
          onChange={(quality) => setSlotQuality(slot, quality)}
          options={[
            { value: null, label: t('followSet') },
            ...qualities.map((q) => ({
              value: q.id,
              label: <span style={{ color: q.color }}>{local(q.name)}</span>,
              title: local(q.name),
            })),
          ]}
        />
      </div>
      {baseLock && bases.length >= 2 && (
        <label className="block">
          <span className="mb-2 block text-xs font-medium tracking-wider text-muted uppercase">
            {t(baseLock === 'weaponType' ? 'weaponTypeLock' : 'baseLock')}
          </span>
          <select
            value={lockedBase ?? ''}
            onChange={(event) =>
              setLock(baseLock, event.target.value === '' ? null : Number(event.target.value))
            }
            className="control h-10 w-full px-2.5 text-sm"
          >
            <option value="">{t('anyBase')}</option>
            {bases.map((item) => (
              <option key={baseOf(item)} value={baseOf(item)}>
                {item.baseName ? local(item.baseName) : String(baseOf(item))}
              </option>
            ))}
          </select>
          {chosen?.baseStats && (
            <span className="mt-2 flex flex-wrap gap-1.5">
              {Object.entries(chosen.baseStats).map(([stat, n]) => (
                <span key={stat} className="rounded-ui bg-panel-2 px-2 py-0.5 text-xs text-muted">
                  {stat} <span className="text-text tabular-nums">{n}</span>
                </span>
              ))}
            </span>
          )}
        </label>
      )}
    </div>
  );
}
