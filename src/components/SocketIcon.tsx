import type { Gem, Socket } from '../domain/types';
import type { UnknownGem } from '../setcode/types';
import { useLocalized, useT } from '../i18n/use-t';
import { selectAttributeById, selectShapeById } from '../store/selectors';
import { useBuild } from '../store/use-build';
import { AttributeIcon } from './AttributeIcon';
import { GameIcon } from './GameIcon';

/** A Socket's Shape frame with its Gem's Attribute glyph inside (Gems have no icon of their own). */
export function SocketIcon({
  socket,
  gem,
  className = 'size-6',
}: {
  socket: Socket;
  gem: Gem | UnknownGem | null;
  className?: string;
}) {
  const t = useT();
  const local = useLocalized();
  const shape = useBuild(selectShapeById).get(socket.shape);
  const attributes = useBuild(selectAttributeById);
  const known = gem && !('unknown' in gem) ? gem : null;
  const attribute = known && attributes.get(Number(Object.keys(known.contribution)[0]));
  const frame = shape?.iconIds[Math.min(socket.tier, 2) - 1];
  const label = attribute ? local(attribute.name) : gem ? t('unknownGem') : t('emptySocket');

  return (
    <span className={`relative inline-grid shrink-0 place-items-center ${className}`} title={label}>
      {frame !== undefined && <GameIcon id={frame} className="absolute inset-0 size-full" />}
      {attribute && (
        <AttributeIcon attribute={attribute} className="relative size-[55%] rounded-full" />
      )}
    </span>
  );
}
