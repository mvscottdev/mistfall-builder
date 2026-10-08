import { useEffect, useRef, useState } from 'react';
import type { Attribute, AttributeCategory } from '../domain/types';
import { useLocalized, useT } from '../i18n/use-t';
import { useBuild } from '../store/use-build';
import { AttributeDetail } from './AttributeDetail';
import { AttributeGlyph } from './AttributeGlyph';
import { useAttributeGroups } from './attribute-groups';
import { Segmented } from './Segmented';
import { trapKeys } from './trap-keys';
import { useTargetToggle } from './use-target-toggle';

/**
 * A floating catalogue of Attributes: search, category filter, icons with names
 * and what the hovered one does. Stays open for several picks; Esc or Done closes it.
 */
export function CodexPanel({ onClose }: { onClose: () => void }) {
  const t = useT();
  const local = useLocalized();
  const groups = useAttributeGroups();
  const targets = useBuild((state) => state.inputs.targets);
  const toggle = useTargetToggle();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<AttributeCategory | 'all'>('all');
  const [inspected, setInspected] = useState<Attribute | null>(null);
  const panel = useRef<HTMLDivElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const picked = new Set(targets.map((target) => target.attribute));

  useEffect(() => {
    // Desktop popover: bring Done into view if the panel opens near the bottom of the page.
    panel.current?.scrollIntoView?.({ block: 'nearest' });
    // A touch keyboard would cover half the sheet; focus search only with a mouse.
    if (window.matchMedia?.('(pointer: fine)').matches) search.current?.focus();
  }, []);

  useEffect(() => {
    const outside = (event: PointerEvent) => {
      if (!panel.current?.parentElement?.contains(event.target as Node)) onClose();
    };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, [onClose]);

  const needle = query.trim().toLocaleLowerCase();
  const shown = groups
    .filter((g) => category === 'all' || g.category === category)
    .flatMap((g) => g.attributes)
    // Players may not know the names, so search the descriptions too ("урон", "health").
    .filter(
      (a) =>
        !needle || `${local(a.name)} ${local(a.description)}`.toLocaleLowerCase().includes(needle),
    );

  return (
    <>
      {/* Phones: the Codex is a bottom sheet over a dimmed page (above the Calculate bar). */}
      <div aria-hidden className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={onClose} />
      <div
        ref={panel}
        role="dialog"
        aria-label={t('addTargetButton')}
        aria-modal="true"
        onKeyDown={(event) => trapKeys(event, onClose)}
        className="panel bg-panel! fixed inset-x-0 bottom-0 z-40 flex max-h-[88dvh] flex-col gap-2 rounded-b-none p-3 shadow-[0_18px_40px_-12px_rgb(0_0_0/0.85)] md:absolute md:inset-x-0 md:top-full md:bottom-auto md:mt-1.5 md:max-h-none md:rounded-b-[var(--radius-lg)] md:p-2.5"
      >
        <input
          ref={search}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t('search')}
          aria-label={t('search')}
          className="control h-10 w-full shrink-0 px-2.5 text-sm"
        />
        <Segmented
          label={t('categoryFilter')}
          value={category}
          onChange={setCategory}
          className="w-full shrink-0 [&>button]:flex-1"
          options={[
            { value: 'all', label: t('allCategories') },
            ...groups.map((g) => ({ value: g.category, label: t(g.label) })),
          ]}
        />
        <div className="grid min-h-0 flex-1 grid-cols-3 content-start gap-1 overflow-y-auto overscroll-contain pr-0.5 md:max-h-60 md:flex-none">
          {shown.map((attribute) => (
            <button
              key={attribute.id}
              type="button"
              aria-pressed={picked.has(attribute.id)}
              onClick={() => {
                toggle(attribute.id);
                setInspected(attribute);
              }}
              onMouseEnter={() => setInspected(attribute)}
              onFocus={() => setInspected(attribute)}
              className={`flex flex-col items-center gap-1 rounded-ui px-1 py-1.5 text-center text-[0.7rem] leading-tight transition-colors hover:bg-panel-2 ${
                picked.has(attribute.id) ? 'bg-panel-2 text-text' : 'text-muted'
              }`}
            >
              <AttributeGlyph
                attribute={attribute}
                selected={picked.has(attribute.id)}
                className="size-9"
              />
              <span className="line-clamp-2 break-words">{local(attribute.name)}</span>
            </button>
          ))}
          {shown.length === 0 && (
            <p className="col-span-3 py-4 text-center text-xs text-muted">{t('nothingFound')}</p>
          )}
        </div>
        <div className="shrink-0">
          <AttributeDetail attribute={inspected} />
        </div>
        <button
          type="button"
          onClick={onClose}
          className="btn-primary h-10 w-full shrink-0 text-sm"
        >
          {t('done')}
        </button>
      </div>
    </>
  );
}
