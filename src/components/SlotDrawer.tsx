import { motion } from 'motion/react';
import { useEffect, useRef, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import type { SetSlot } from '../domain/types';
import { useLocalized, useT } from '../i18n/use-t';
import { selectSlotLabels } from '../store/selectors';
import type { ShownPiece } from '../store/shown-set';
import { useBuild } from '../store/use-build';
import { SlotDetails } from './SlotDetails';
import { SlotLocks } from './SlotLocks';

const FOCUSABLE = 'button, select, input, [href], [tabindex]:not([tabindex="-1"])';

/** Keeps Tab inside the drawer and closes it on Escape. */
function trapKeys(event: KeyboardEvent<HTMLElement>, onClose: () => void) {
  if (event.key === 'Escape') {
    event.stopPropagation();
    onClose();
    return;
  }
  if (event.key !== 'Tab') return;
  const focusable = [...event.currentTarget.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
    (el) => !el.hasAttribute('disabled'),
  );
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (!first || !last) return;
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

/**
 * A Slot's Item, mods and Locks: slides in from the side (from the bottom on phones).
 * Rendered into <body> so no panel's filter or transform can trap its fixed position.
 */
export function SlotDrawer({
  slot,
  piece,
  onClose,
}: {
  slot: SetSlot;
  piece: ShownPiece | undefined;
  onClose: () => void;
}) {
  const t = useT();
  const local = useLocalized();
  const label = local(useBuild(selectSlotLabels)[slot]);
  const closeButton = useRef<HTMLButtonElement>(null);
  useEffect(() => closeButton.current?.focus(), []);

  return createPortal(
    <div className="fixed inset-0 z-40" onKeyDown={(event) => trapKeys(event, onClose)}>
      <motion.div
        aria-hidden
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="slot-drawer-title"
        initial={{ y: '100%', x: 0 }}
        animate={{ y: 0, x: 0 }}
        exit={{ y: '100%' }}
        className="panel absolute inset-x-0 bottom-0 flex max-h-[85vh] flex-col overflow-hidden rounded-b-none md:inset-y-0 md:right-0 md:left-auto md:max-h-none md:w-[26rem] md:rounded-r-none md:rounded-bl-[var(--radius-lg)]"
      >
        <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
          <h2 id="slot-drawer-title" className="panel-title truncate">
            {label}
          </h2>
          <button
            ref={closeButton}
            type="button"
            onClick={onClose}
            aria-label={t('close')}
            className="grid size-9 place-items-center rounded-ui text-muted transition-colors hover:bg-panel-2 hover:text-text"
          >
            ✕
          </button>
        </div>
        <div className="space-y-5 overflow-y-auto overscroll-contain p-4">
          <SlotDetails slot={slot} piece={piece} />
          {slot === 'weapon2' ? (
            <p className="text-sm text-muted">{t('secondWeaponNote')}</p>
          ) : (
            <SlotLocks slot={slot} />
          )}
        </div>
      </motion.div>
    </div>,
    document.body,
  );
}
