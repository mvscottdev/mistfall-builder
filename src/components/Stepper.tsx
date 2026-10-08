/** − value + with a typed-in number; − and + stop at min and max. */
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
  const button =
    'grid size-8 place-items-center text-lg leading-none text-muted transition-colors hover:text-text disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:text-muted';
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
        type="number"
        inputMode="numeric"
        aria-label={label}
        min={min}
        max={max}
        value={value}
        onChange={(event) => {
          const next = Math.round(Number(event.target.value));
          if (Number.isFinite(next)) onChange(Math.min(max, Math.max(min, next)));
        }}
        className="w-9 [appearance:textfield] bg-transparent text-center text-sm font-semibold tabular-nums [&::-webkit-inner-spin-button]:appearance-none"
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
