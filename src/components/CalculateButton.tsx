import { motion } from 'motion/react';
import { useT } from '../i18n/use-t';
import { selectStale } from '../store/selectors';
import { useBuild } from '../store/use-build';

/** Solves the inputs; glows when they changed since the shown result, spins while solving. */
export function CalculateButton() {
  const t = useT();
  const busy = useBuild((state) => state.busy);
  const stale = useBuild(selectStale);
  const calculate = useBuild((state) => state.calculate);

  return (
    <motion.button
      type="button"
      onClick={() => void calculate()}
      aria-busy={busy}
      data-stale={stale}
      whileTap={{ scale: 0.97 }}
      className={`btn-primary relative flex h-12 w-full items-center justify-center gap-2 text-base transition-[filter,opacity] ${
        busy ? 'cursor-progress opacity-80' : 'hover:brightness-110'
      } ${stale && !busy ? 'ring-2 ring-accent ring-offset-2 ring-offset-panel' : 'opacity-90'}`}
    >
      {busy && (
        <span
          aria-hidden
          className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      )}
      {busy ? t('calculating') : t('calculate')}
    </motion.button>
  );
}
