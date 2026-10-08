import type { Attribute } from '../domain/types';
import { useLocalized, useT } from '../i18n/use-t';
import { AttributeGlyph } from './AttributeGlyph';
import { categoryColor } from './attribute-groups';

const CATEGORY_KEY = {
  offense: 'categoryOffense',
  defense: 'categoryDefense',
  utility: 'categoryUtility',
} as const;

/** What an Attribute does, for the icon last hovered, focused or tapped; a hint when there is none. */
export function AttributeDetail({ attribute }: { attribute: Attribute | null }) {
  const t = useT();
  const local = useLocalized();

  return (
    <div
      aria-live="polite"
      className="flex min-h-[4.75rem] gap-2.5 rounded-ui border border-line bg-panel-2/60 p-2.5"
    >
      {attribute ? (
        <>
          <AttributeGlyph attribute={attribute} className="size-9" />
          <div className="min-w-0 text-xs leading-snug">
            <p className="text-sm font-semibold">
              {local(attribute.name)}{' '}
              <span
                className="text-[0.65rem] font-medium tracking-wider uppercase"
                style={{ color: categoryColor(attribute.category) }}
              >
                · {t(CATEGORY_KEY[attribute.category])}
              </span>
            </p>
            <p className="line-clamp-3 text-muted">{local(attribute.description)}</p>
            <p className="mt-0.5 text-muted">
              {t('tiersAt', { levels: attribute.tiers.map((tier) => tier.fromLevel).join(' · ') })}
            </p>
          </div>
        </>
      ) : (
        <p className="self-center text-xs text-muted">{t('pickHint')}</p>
      )}
    </div>
  );
}
