import { useT } from '../i18n/use-t';
import { useBuild } from '../store/use-build';

/** Why there is no Set: no result yet, over Budget, infeasible, or a solver error. */
export function ResultMessage() {
  const t = useT();
  const result = useBuild((state) => state.result);

  if (!result) return <p className="text-sm text-muted">{t('noResult')}</p>;
  let text: string | null = null;
  if (result.kind === 'overBudget') {
    text = t('overBudget', {
      requested: result.requested,
      budget: result.budget,
      topUp: result.topUpTotal,
    });
  } else if (result.kind === 'infeasible') text = t('infeasible');
  else if (result.kind === 'failed') text = t('failed', { message: result.message });
  if (!text) return null;
  return (
    <p
      role="alert"
      className="rounded-ui border border-danger/40 bg-danger/10 p-3 text-sm text-danger"
    >
      {text}
    </p>
  );
}
