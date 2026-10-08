import { useState } from 'react';

/**
 * − value + with a typed-in number; − and + stop at min and max. Typing edits a
 * draft that is clamped and sent on blur or Enter, so the field can be cleared.
 */
export function Stepper({
  value,
  min,
  max,
  onChange,
  label,
  lowerLabel,
  raiseLabel,
  raiseTitle,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  label: string;
  lowerLabel: string;
  raiseLabel: string;
  /** Why + is disabled, when it is. */
  raiseTitle?: string;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const commit = () => {
    const typed = Math.round(Number(draft));
    if (draft !== null && draft.trim() !== '' && Number.isFinite(typed)) {
      onChange(Math.min(max, Math.max(min, typed)));
    }
    setDraft(null);
  };
  const button =
    'grid size-10 place-items-center text-lg leading-none text-muted transition-colors hover:text-text disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:text-muted md:size-8';
  return (
    <div className="control inline-flex items-center">
      <button
        type="button"
        className={button}
        aria-label={lowerLabel}
        disabled={value <= min}
        onClick={() => onChange(value - 1)}
      >
        −
      </button>
      <input
        type="text"
        inputMode="numeric"
        aria-label={label}
        value={draft ?? String(value)}
        onChange={(event) => setDraft(event.target.value.replace(/\D/g, ''))}
        onBlur={commit}
        onKeyDown={(event) => event.key === 'Enter' && commit()}
        className="h-10 w-9 bg-transparent text-center text-sm font-semibold tabular-nums md:h-8"
      />
      <button
        type="button"
        className={button}
        aria-label={raiseLabel}
        title={value >= max ? raiseTitle : undefined}
        disabled={value >= max}
        onClick={() => onChange(value + 1)}
      >
        +
      </button>
    </div>
  );
}
