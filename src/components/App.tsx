import { useEffect } from 'react';
import { useT } from '../i18n/use-t';
import { useBuild } from '../store/use-build';

/** Placeholder page shown until the build editor UI lands. */
export function App() {
  const t = useT();
  const language = useBuild((state) => state.language);
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-2 bg-neutral-950 p-4 text-neutral-100">
      <h1 className="text-2xl font-semibold">{t('appTitle')}</h1>
      <p className="text-neutral-400">{t('comingSoon')}</p>
    </main>
  );
}
