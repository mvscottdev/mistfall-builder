import { useRef, useState, type FormEvent } from 'react';
import type { SetCodeProblem } from '../setcode/error';
import { useT } from '../i18n/use-t';
import { selectLoadedAsTarget } from '../store/selectors';
import { useBuild } from '../store/use-build';

/** Codes that are not Set codes at all, versus ones made for other game data. */
const NOT_A_CODE: SetCodeProblem[] = ['notBase62', 'badMarker', 'tooShort', 'badHeader'];

/** Paste a Set code to see its Set (ADR-0010); then Load as target makes it the inputs. */
export function SetCodeImport() {
  const t = useT();
  const importSetCode = useBuild((state) => state.importSetCode);
  const loadAsTarget = useBuild((state) => state.loadAsTarget);
  const decoded = useBuild((state) => state.result?.kind === 'decoded');
  // Until the inputs are edited, the button stays a confirmation.
  const loaded = useBuild(selectLoadedAsTarget);
  const confirmation = useRef<HTMLParagraphElement>(null);
  const [code, setCode] = useState('');
  const [problem, setProblem] = useState<SetCodeProblem | null>(null);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!code.trim()) return setProblem(null);
    const found = importSetCode(code);
    setProblem(found);
    if (!found) setCode('');
  };

  return (
    <div className="space-y-2">
      <form onSubmit={submit}>
        <label
          htmlFor="import-code"
          className="mb-2 block text-xs font-medium tracking-wider text-muted uppercase"
        >
          {t('importCode')}
        </label>
        <div className="flex gap-2">
          <input
            id="import-code"
            value={code}
            onChange={(event) => {
              setCode(event.target.value);
              setProblem(null);
            }}
            placeholder={t('importPlaceholder')}
            autoComplete="off"
            spellCheck={false}
            aria-invalid={problem !== null}
            aria-describedby={problem ? 'import-problem' : undefined}
            className="control h-10 min-w-0 flex-1 px-2.5 font-mono text-xs"
          />
          <button type="submit" className="control h-10 shrink-0 px-3 text-sm font-medium">
            {t('showCode')}
          </button>
        </div>
      </form>
      {problem && (
        <p id="import-problem" role="alert" className="text-xs text-danger">
          {t(NOT_A_CODE.includes(problem) ? 'codeInvalid' : 'codeUnknown')}
        </p>
      )}
      {decoded && (
        <div className="rounded-ui border border-accent/50 bg-accent/10 p-2.5 text-xs">
          <p className="mb-2">{t('decodedShown')}</p>
          {loaded ? (
            <p ref={confirmation} tabIndex={-1} className="font-semibold text-accent">
              {t('loadedAsTarget')}
            </p>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  loadAsTarget();
                  // The button is replaced: focus the confirmation, so it is read out and Tab continues here.
                  requestAnimationFrame(() => confirmation.current?.focus());
                }}
                className="btn-primary h-10 w-full text-sm"
              >
                {t('loadAsTarget')}
              </button>
              <p className="mt-1.5 text-muted">{t('loadAsTargetHint')}</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
