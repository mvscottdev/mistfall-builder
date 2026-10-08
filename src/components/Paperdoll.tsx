import { AnimatePresence } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import type { Locks, SetSlot } from '../domain/types';
import { useLocalized } from '../i18n/use-t';
import { BASE_LOCK, selectClasses, selectShownSet, selectOutdated } from '../store/selectors';
import { useBuild } from '../store/use-build';
import { GameIcon } from './GameIcon';
import { SlotDrawer } from './SlotDrawer';
import { SlotTile } from './SlotTile';

/** Phone order (3×3 grid); from md up each tile takes its named area around the figure. */
const SLOTS: SetSlot[] = [
  'helmet',
  'chest',
  'bracers',
  'pants',
  'boots',
  'amulet',
  'ring',
  'weapon',
  'weapon2',
];

function slotLocked(slot: SetSlot, locks: Locks): boolean {
  if (slot === 'weapon2') {
    return (
      locks.secondWeapon !== null ||
      locks.secondWeaponType !== null ||
      locks.secondWeaponQuality !== null
    );
  }
  const base = BASE_LOCK[slot];
  return locks.slotQuality[slot] !== undefined || (base !== undefined && locks[base] !== null);
}

/** The 8 Slots and the Second weapon around the Class figure; a tile opens its drawer. */
export function Paperdoll() {
  const local = useLocalized();
  const shown = useBuild(selectShownSet);
  const outdated = useBuild(selectOutdated);
  const locks = useBuild((state) => state.inputs.locks);
  const classId = useBuild((state) => state.inputs.classId);
  const cls = useBuild(selectClasses).find((c) => c.id === classId);
  const [open, setOpen] = useState<SetSlot | null>(null);
  const opener = useRef<HTMLElement | null>(null);

  // While the drawer is open the page behind it is inert; focus goes back once it has left.
  useEffect(() => {
    const page = opener.current?.closest<HTMLElement>('body > *');
    if (!page || open === null) return;
    page.inert = true;
    return () => {
      page.inert = false;
    };
  }, [open]);
  const close = () => setOpen(null);

  return (
    <section aria-label={cls ? local(cls.name) : undefined} className="relative">
      <div
        className={`grid grid-cols-3 gap-2 transition-opacity duration-200 sm:gap-3 md:grid-cols-[1fr_1.25fr_1fr] md:[grid-template-areas:'helmet_figure_amulet'_'chest_figure_ring'_'bracers_figure_weapon'_'pants_boots_weapon2'] ${
          outdated ? 'opacity-85 saturate-50' : ''
        }`}
      >
        {cls && (
          <div
            aria-hidden
            className="relative hidden flex-col items-center justify-center md:flex md:[grid-area:figure]"
          >
            <div className="absolute inset-x-2 inset-y-4 rounded-[50%] bg-[radial-gradient(closest-side,var(--bg-glow),transparent)] blur-md" />
            <div className="absolute inset-y-6 left-1/2 w-px bg-gradient-to-b from-transparent via-line-strong to-transparent" />
            <GameIcon
              id={cls.iconId}
              className="relative size-28 opacity-90 drop-shadow-[0_0_24px_var(--accent)] lg:size-36"
            />
            <span className="relative mt-3 font-display text-lg tracking-widest text-muted uppercase">
              {local(cls.name)}
            </span>
          </div>
        )}
        {SLOTS.map((slot) => (
          <SlotTile
            key={slot}
            slot={slot}
            piece={shown?.pieces.find((piece) => piece.slot === slot)}
            locked={slotLocked(slot, locks)}
            onOpen={(which, element) => {
              opener.current = element;
              setOpen(which);
            }}
          />
        ))}
      </div>
      <AnimatePresence onExitComplete={() => opener.current?.focus()}>
        {open && (
          <SlotDrawer
            key={open}
            slot={open}
            piece={shown?.pieces.find((piece) => piece.slot === open)}
            onClose={close}
          />
        )}
      </AnimatePresence>
    </section>
  );
}
