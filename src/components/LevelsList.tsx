import { useLocalized, useT } from '../i18n/use-t';
import { selectAttributeById, selectShownSet } from '../store/selectors';
import { useBuild } from '../store/use-build';
import { AttributeIcon } from './AttributeIcon';

/** Each Target's level in the shown Set (Items + Top-up vs Target), then other bonuses it gives. */
export function LevelsList() {
  const t = useT();
  const local = useLocalized();
  const shown = useBuild(selectShownSet);
  const attributes = useBuild(selectAttributeById);
  const targets = useBuild((state) => state.resultInputs?.targets ?? null);
  if (!shown) return null;

  const wanted = targets ?? [];
  const targeted = new Set(wanted.map((target) => target.attribute));
  const extras = Object.entries(shown.levels)
    .map(([id, level]) => ({ attribute: attributes.get(Number(id)), level }))
    .filter((x) => x.attribute && !targeted.has(x.attribute.id) && x.level > 0);

  return (
    <div className="space-y-3">
      {wanted.length > 0 && (
        <div>
          <h3 className="text-xs font-medium tracking-wider text-muted uppercase">{t('levels')}</h3>
          <p className="mb-2 text-[0.7rem] text-muted">{t('levelsHint')}</p>
          <ul className="space-y-1.5">
            {wanted.map((target) => {
              const attribute = attributes.get(target.attribute);
              if (!attribute) return null;
              const items = shown.levels[target.attribute] ?? 0;
              const topUp = shown.topUp[target.attribute] ?? 0;
              const met = items + topUp >= target.level;
              return (
                <li key={target.attribute} className="flex items-center gap-2 text-sm">
                  <AttributeIcon attribute={attribute} className="size-5" />
                  <span className="min-w-0 flex-1 truncate">{local(attribute.name)}</span>
                  <span className={`tabular-nums ${met ? 'text-ok' : 'text-danger'}`}>
                    {items}
                    {topUp > 0 && <span className="text-accent"> +{topUp}</span>}
                    <span className="text-muted"> / {target.level}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
      {extras.length > 0 && (
        <div>
          <h3 className="mb-2 text-xs font-medium tracking-wider text-muted uppercase">
            {t('extraBonuses')}
          </h3>
          <ul className="flex flex-wrap gap-1.5">
            {extras.map(({ attribute, level }) =>
              attribute ? (
                <li
                  key={attribute.id}
                  className="flex items-center gap-1 rounded-ui bg-panel-2 py-0.5 pr-2 pl-0.5 text-xs"
                >
                  <AttributeIcon attribute={attribute} className="size-5" />
                  {local(attribute.name)} <span className="text-muted tabular-nums">{level}</span>
                </li>
              ) : null,
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
