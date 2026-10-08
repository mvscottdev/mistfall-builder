import type { ReactNode } from 'react';

interface Option<T> {
  value: T;
  label: ReactNode;
  /** Accessible name when the label is not plain text. */
  title?: string;
}

/** A small row of toggle buttons; the chosen one is pressed. */
export function Segmented<T extends string | number | null>({
  label,
  value,
  options,
  onChange,
  className = '',
}: {
  label: string;
  value: T;
  options: Option<T>[];
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className={`control inline-flex flex-wrap gap-0.5 p-0.5 ${className}`}
    >
      {options.map((option) => {
        const pressed = option.value === value;
        return (
          <button
            key={String(option.value)}
            type="button"
            aria-pressed={pressed}
            aria-label={option.title}
            title={option.title}
            onClick={() => onChange(option.value)}
            className={`min-h-10 rounded-[calc(var(--radius)-2px)] px-2.5 text-sm transition-colors md:min-h-8 ${
              pressed ? 'bg-line-strong text-text' : 'text-muted hover:text-text'
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
