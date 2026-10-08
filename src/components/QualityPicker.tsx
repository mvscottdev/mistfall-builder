import { useLocalized, useT } from '../i18n/use-t';
import { selectQualities } from '../store/selectors';
import { useBuild } from '../store/use-build';
import { Segmented } from './Segmented';

/** The Set quality Lock: Any or one quality for every Slot without its own override. */
export function QualityPicker() {
  const t = useT();
  const local = useLocalized();
  const qualities = useBuild(selectQualities);
  const quality = useBuild((state) => state.inputs.locks.quality);
  const setLock = useBuild((state) => state.setLock);

  return (
    <div>
      <p className="mb-2 text-xs font-medium tracking-wider text-muted uppercase">
        {t('setQuality')}
      </p>
      <Segmented
        label={t('setQuality')}
        value={quality}
        onChange={(value) => setLock('quality', value)}
        className="w-full"
        options={[
          { value: null, label: t('anyQuality') },
          ...qualities.map((q) => ({
            value: q.id,
            title: local(q.name),
            label: (
              <span className="flex items-center gap-1.5">
                <span
                  aria-hidden
                  className="size-2.5 rounded-full"
                  style={{ background: q.color }}
                />
                <span className="hidden sm:inline lg:hidden xl:inline">{local(q.name)}</span>
              </span>
            ),
          })),
        ]}
      />
    </div>
  );
}
