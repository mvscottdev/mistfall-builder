import { useCallback, useRef, useState } from 'react';
import { useT } from '../i18n/use-t';
import { CodexPanel } from './CodexPanel';

/** Variant B: one button; the Codex floats over the page, so it takes no room while closed. */
export function TargetPickerCodex() {
  const t = useT();
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  // Focus comes back to the button when the Codex closes.
  const close = useCallback(() => {
    setOpen(false);
    button.current?.focus();
  }, []);

  return (
    <div className="relative">
      <button
        ref={button}
        type="button"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((o) => !o)}
        className="control flex h-11 w-full items-center justify-center gap-2 border-dashed text-sm font-medium hover:text-accent"
      >
        <span aria-hidden className="text-lg leading-none text-accent">
          +
        </span>
        {t('addTargetButton')}
      </button>
      {open && <CodexPanel onClose={close} />}
    </div>
  );
}
