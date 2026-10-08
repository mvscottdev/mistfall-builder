import type { Localized } from '../domain/types';
import { useBuild } from '../store/use-build';
import { dictionary, fill, type TextKey } from './dictionary';

export type Translate = (key: TextKey, values?: Record<string, string | number>) => string;

/** Returns `t(key, values?)`: the UI text in the current language, with `{name}`s filled in. */
export function useT(): Translate {
  const language = useBuild((state) => state.language);
  const texts = dictionary[language];
  return (key, values) => (values ? fill(texts[key], values) : texts[key]);
}

/** Returns a function picking the current language's side of a game name. */
export function useLocalized(): (text: Localized) => string {
  const language = useBuild((state) => state.language);
  return (text) => text[language];
}
