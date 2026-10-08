/** A game icon from public/icons; decorative unless given a label. */
export function GameIcon({
  id,
  label,
  className,
}: {
  id: number;
  label?: string;
  className?: string;
}) {
  return (
    <img
      src={`${import.meta.env.BASE_URL}icons/${id}.webp`}
      alt={label ?? ''}
      aria-hidden={label ? undefined : true}
      loading="lazy"
      decoding="async"
      draggable={false}
      className={className}
    />
  );
}
