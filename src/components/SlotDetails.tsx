import type { SetSlot } from '../domain/types';
import { useLocalized, useT } from '../i18n/use-t';
import { selectAttributeById, selectQualityById, selectSlotLabels } from '../store/selectors';
import type { ShownPiece } from '../store/shown-set';
import { useBuild } from '../store/use-build';
import { AttributeIcon } from './AttributeIcon';
import { GameIcon } from './GameIcon';
import { formatGold, itemName } from './item-name';
import { SocketIcon } from './SocketIcon';

/** The shown Item of a Slot: art, quality, price and each Mod slot with what it gives. */
export function SlotDetails({ slot, piece }: { slot: SetSlot; piece: ShownPiece | undefined }) {
  const t = useT();
  const local = useLocalized();
  const language = useBuild((state) => state.language);
  const labels = useBuild(selectSlotLabels);
  const attributes = useBuild(selectAttributeById);
  const quality = useBuild(selectQualityById).get(piece?.item.quality ?? -1);

  if (!piece) return <p className="text-sm text-muted">{t('noSolvedItem')}</p>;
  const { item } = piece;
  const stats = item.baseStats
    ? Object.entries(item.baseStats)
        .map(([stat, value]) => `${stat}: ${value}`)
        .join('\n')
    : undefined;

  const contributionRows = (contribution: Record<number, number>) =>
    Object.entries(contribution).map(([id, n]) => {
      const attribute = attributes.get(Number(id));
      return attribute ? (
        <span key={id} className="flex items-center gap-1.5">
          <AttributeIcon attribute={attribute} className="size-5" />
          {local(attribute.name)} <span className="text-accent tabular-nums">+{n}</span>
        </span>
      ) : null;
    });

  return (
    <section aria-label={t('slotDetails')} className="space-y-4">
      <div className="flex items-center gap-3">
        <div
          className="slot-tile grid size-20 shrink-0 place-items-center p-1"
          style={{ ['--q' as string]: quality?.color }}
        >
          <GameIcon id={item.iconId} className="size-full object-contain" />
        </div>
        <div className="min-w-0">
          <p className="font-semibold" style={{ color: quality?.color }} title={stats}>
            {itemName(item, quality?.name, labels[slot], language)}
          </p>
          {quality && <p className="text-sm text-muted">{local(quality.name)}</p>}
          <p className="text-sm">
            {t('price')}:{' '}
            <span className="font-semibold text-accent tabular-nums">
              {piece.price === null ? t('unpriced') : formatGold(piece.price, language)}
            </span>
          </p>
        </div>
      </div>
      <div>
        <h3 className="mb-2 text-xs font-medium tracking-wider text-muted uppercase">
          {t('mods')}
        </h3>
        <ul className="space-y-1.5 text-sm">
          {item.modSlots.map((mod, i) => (
            <li key={i} className="flex items-center gap-2 rounded-ui bg-panel-2 px-2.5 py-1.5">
              {mod.kind === 'builtIn' ? (
                <>
                  <span className="w-20 shrink-0 text-xs text-muted">{t('builtIn')}</span>
                  <span className="flex flex-wrap gap-2">{contributionRows(mod.contribution)}</span>
                </>
              ) : (
                <>
                  <span className="flex w-20 shrink-0 items-center gap-1.5 text-xs text-muted">
                    <SocketIcon socket={mod} gem={piece.gems[i] ?? null} className="size-5" />
                    {t('socket')}
                  </span>
                  {!piece.gems[i] ? (
                    <span className="text-muted italic">{t('emptySocket')}</span>
                  ) : 'unknown' in piece.gems[i] ? (
                    <span className="text-muted">{t('unknownGem')}</span>
                  ) : (
                    <span className="flex flex-wrap gap-2">
                      {contributionRows(piece.gems[i].contribution)}
                    </span>
                  )}
                </>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
