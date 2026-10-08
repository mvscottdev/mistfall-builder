import { AnimatePresence, motion } from 'motion/react';
import type { CSSProperties } from 'react';
import type { SetSlot } from '../domain/types';
import { useT } from '../i18n/use-t';
import { selectQualityById, selectSlotLabels } from '../store/selectors';
import type { ShownPiece } from '../store/shown-set';
import { useBuild } from '../store/use-build';
import { GameIcon } from './GameIcon';
import { formatGold, itemName } from './item-name';
import { SocketIcon } from './SocketIcon';

// Static strings so Tailwind sees them: each Slot's place around the figure.
const AREA: Record<SetSlot, string> = {
  helmet: 'md:[grid-area:helmet]',
  chest: 'md:[grid-area:chest]',
  bracers: 'md:[grid-area:bracers]',
  pants: 'md:[grid-area:pants]',
  boots: 'md:[grid-area:boots]',
  amulet: 'md:[grid-area:amulet]',
  ring: 'md:[grid-area:ring]',
  weapon: 'md:[grid-area:weapon]',
  weapon2: 'md:[grid-area:weapon2]',
};

/** One Slot on the doll: the Item's art in its quality colour, Gems, price and Lock mark. */
export function SlotTile({
  slot,
  piece,
  locked,
  onOpen,
}: {
  slot: SetSlot;
  piece: ShownPiece | undefined;
  locked: boolean;
  onOpen: (slot: SetSlot, opener: HTMLElement) => void;
}) {
  const t = useT();
  const language = useBuild((state) => state.language);
  const labels = useBuild(selectSlotLabels);
  const quality = useBuild(selectQualityById).get(piece?.item.quality ?? -1);
  const label = labels[slot][language];
  const item = piece?.item;

  return (
    <button
      type="button"
      aria-label={t('openSlot', { slot: label }) + (locked ? `, ${t('locked')}` : '')}
      onClick={(event) => onOpen(slot, event.currentTarget)}
      style={quality ? ({ '--q': quality.color } as CSSProperties) : undefined}
      className={`slot-tile group flex min-h-28 min-w-0 flex-col items-center gap-1 p-2 text-center ${AREA[slot]}`}
    >
      <span className="slot-label flex w-full items-start justify-between gap-1 text-left text-[0.68rem] leading-tight tracking-wider text-muted uppercase">
        <span className="line-clamp-2 break-words">{label}</span>
        {locked && (
          <span aria-hidden title={t('locked')} className="text-accent">
            ◆
          </span>
        )}
      </span>
      <span className="slot-art relative grid size-14 place-items-center sm:size-16">
        <AnimatePresence mode="popLayout" initial={false}>
          {item ? (
            <motion.span
              key={item.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute inset-0"
            >
              <GameIcon id={item.iconId} className="size-full object-contain drop-shadow-lg" />
            </motion.span>
          ) : (
            <span className="text-xs text-muted/70">{t('emptySlot')}</span>
          )}
        </AnimatePresence>
      </span>
      {item && piece && (
        <>
          <span
            className="slot-name line-clamp-2 w-full text-xs leading-tight"
            style={{ color: quality?.color }}
          >
            {itemName(item, quality?.name, labels[slot], language)}
          </span>
          <span className="slot-meta flex items-center gap-1">
            {item.modSlots.map((mod, i) =>
              mod.kind === 'socket' ? (
                <SocketIcon key={i} socket={mod} gem={piece.gems[i] ?? null} className="size-5" />
              ) : null,
            )}
            <span className="text-xs text-muted tabular-nums">
              {piece.price === null ? '—' : formatGold(piece.price, language)}
            </span>
          </span>
        </>
      )}
    </button>
  );
}
