import { useState } from 'react';
import { useT } from '../i18n/use-t';
import { selectShownSet } from '../store/selectors';
import { useBuild } from '../store/use-build';

/** The shown Set as the game's import string, with a Copy button. */
export function SetCodeBox() {
  const t = useT();
  const shown = useBuild(selectShownSet);
  const [copied, setCopied] = useState(false);
  if (!shown) return null;
  if ('missing' in shown.code) return <p className="text-xs text-muted">{t('codeMissing')}</p>;
  const { code } = shown.code;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard blocked: the code stays selectable in the field.
    }
  };

  return (
    <div>
      <label
        htmlFor="set-code"
        className="mb-2 block text-xs font-medium tracking-wider text-muted uppercase"
      >
        {t('setCode')}
      </label>
      <div className="flex gap-2">
        <input
          id="set-code"
          readOnly
          value={code}
          onFocus={(event) => event.target.select()}
          className="control h-10 min-w-0 flex-1 px-2.5 font-mono text-xs"
        />
        <button
          type="button"
          onClick={() => void copy()}
          className="control h-10 shrink-0 px-3 text-sm font-medium"
          aria-live="polite"
        >
          {copied ? t('copied') : t('copy')}
        </button>
      </div>
    </div>
  );
}
