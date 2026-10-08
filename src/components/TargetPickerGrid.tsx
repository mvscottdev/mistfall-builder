import { useState } from 'react';
import type { Attribute, AttributeCategory } from '../domain/types';
import { useLocalized, useT } from '../i18n/use-t';
import { useBuild } from '../store/use-build';
import { AttributeDetail } from './AttributeDetail';
import { AttributeGlyph } from './AttributeGlyph';
import { categoryColor, useAttributeGroups } from './attribute-groups';
import { Segmented } from './Segmented';
import { useTargetToggle } from './use-target-toggle';

/** Variant A: category tabs over a grid of icons; a tap adds or removes a Target. */
export function TargetPickerGrid() {
  const t = useT();
  const local = useLocalized();
  const groups = useAttributeGroups();
  const targets = useBuild((state) => state.inputs.targets);
  const toggle = useTargetToggle();
  const [category, setCategory] = useState<AttributeCategory>('offense');
  const [inspected, setInspected] = useState<Attribute | null>(null);
  const levels = new Map(targets.map((target) => [target.attribute, target.level]));
  const group = groups.find((g) => g.category === category) ?? groups[0];

  return (
    <div className="space-y-2">
      <Segmented
        label={t('categoryFilter')}
        value={category}
        onChange={setCategory}
        className="w-full [&>button]:flex-1"
        options={groups.map((g) => {
          const picked = g.attributes.filter((a) => levels.has(a.id)).length;
          return {
            value: g.category,
            label: (
              <span className="flex items-center justify-center gap-1.5">
                <span
                  aria-hidden
                  className="size-2 rotate-45"
                  style={{ background: categoryColor(g.category) }}
                />
                {t(g.label)}
                {picked > 0 && <span className="text-accent tabular-nums"> {picked}</span>}
              </span>
            ),
          };
        })}
      />
      <div className="grid grid-cols-6 gap-1.5">
        {group?.attributes.map((attribute) => {
          const level = levels.get(attribute.id);
          return (
            <button
              key={attribute.id}
              type="button"
              aria-pressed={level !== undefined}
              aria-label={local(attribute.name)}
              title={local(attribute.name)}
              onClick={() => {
                toggle(attribute.id);
                setInspected(attribute);
              }}
              onMouseEnter={() => setInspected(attribute)}
              onFocus={() => setInspected(attribute)}
              className="grid aspect-square place-items-center rounded-ui transition-transform hover:scale-105 hover:[&>.glyph]:brightness-125"
            >
              <AttributeGlyph
                attribute={attribute}
                selected={level !== undefined}
                level={level}
                className="size-[88%]"
              />
            </button>
          );
        })}
      </div>
      <AttributeDetail attribute={inspected} />
    </div>
  );
}
