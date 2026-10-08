import type { Attribute } from '../domain/types';
import { GameIcon } from './GameIcon';

/** An Attribute's glyph on its coloured backing, as the game draws it. */
export function AttributeIcon({
  attribute,
  className = 'size-6',
}: {
  attribute: Attribute;
  className?: string;
}) {
  return (
    <span className={`relative inline-grid shrink-0 place-items-center ${className}`}>
      <GameIcon
        id={attribute.bgIconId}
        className="absolute inset-0 size-full rounded-[calc(var(--radius)-1px)]"
      />
      <GameIcon id={attribute.iconId} className="relative size-[78%]" />
    </span>
  );
}
