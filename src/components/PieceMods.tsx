import { useLocalized, useT } from '../i18n/use-t';
import { selectAttributeById } from '../store/selectors';
import type { ShownPiece } from '../store/shown-set';
import { useBuild } from '../store/use-build';
import { SocketIcon } from './SocketIcon';

/**
 * What a shown Item gives, one line per bonus: Built-in effects marked ◆, Gems in
 * their Socket frame. The Second weapon's lines are faded: they count for no Target.
 */
export function PieceMods({ piece }: { piece: ShownPiece }) {
  const t = useT();
  const local = useLocalized();
  const attributes = useBuild(selectAttributeById);

  return (
    <ul
      title={piece.slot === 'weapon2' ? t('secondWeaponNote') : undefined}
      className={`slot-mods w-full space-y-0.5 text-left text-[0.7rem] leading-tight ${
        piece.slot === 'weapon2' ? 'opacity-55' : ''
      }`}
    >
      {piece.item.modSlots.flatMap((mod, i) => {
        const gem = mod.kind === 'socket' ? (piece.gems[i] ?? null) : null;
        const marker =
          mod.kind === 'builtIn' ? (
            <span
              aria-hidden
              title={t('builtIn')}
              className="grid size-4 shrink-0 place-items-center text-[0.6rem] text-muted"
            >
              ◆
            </span>
          ) : (
            <SocketIcon socket={mod} gem={gem} className="size-4" />
          );
        const contribution =
          mod.kind === 'builtIn'
            ? mod.contribution
            : gem && !('unknown' in gem)
              ? gem.contribution
              : null;
        if (!contribution) {
          return [
            <li key={i} className="flex items-center gap-1 text-muted italic">
              {marker}
              {gem ? t('unknownGem') : t('emptySocket')}
            </li>,
          ];
        }
        return Object.entries(contribution).map(([id, n]) => {
          const attribute = attributes.get(Number(id));
          return (
            <li key={`${i}-${id}`} className="flex items-center gap-1">
              {marker}
              <span className="sr-only">
                {mod.kind === 'builtIn' ? t('builtIn') : t('socket')}:
              </span>
              <span className="min-w-0 flex-1 truncate">
                {attribute ? local(attribute.name) : id}
              </span>
              <span className="text-accent tabular-nums">+{n}</span>
            </li>
          );
        });
      })}
    </ul>
  );
}
