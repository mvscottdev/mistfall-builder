import type { KeyboardEvent } from 'react';

const FOCUSABLE = 'button, select, input, [href], [tabindex]:not([tabindex="-1"])';

/** For a dialog's onKeyDown: keeps Tab inside it and closes it on Escape. */
export function trapKeys(event: KeyboardEvent<HTMLElement>, onClose: () => void) {
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
