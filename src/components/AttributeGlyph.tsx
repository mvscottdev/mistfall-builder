import type { Attribute } from '../domain/types';
import { GameIcon } from './GameIcon';

/** An Attribute's glyph in a frame tinted by its category; glows when picked, with an optional level. */
export function AttributeGlyph({
  attribute,
  selected = false,
  level,
  className = 'size-10',
}: {
  attribute: Attribute;
  selected?: boolean;
  level?: number;
  className?: string;
}) {
  return (
    <span
      className={`glyph ${className}`}
      data-category={attribute.category}
      data-selected={selected}
    >
      <span className="glyph-frame" />
      <GameIcon id={attribute.iconId} className="relative size-[58%] drop-shadow" />
      {level !== undefined && <span className="glyph-badge tabular-nums">{level}</span>}
    </span>
  );
}
