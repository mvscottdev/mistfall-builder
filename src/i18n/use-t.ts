import { useBuild } from '../store/use-build';
import { dictionary, type TextKey } from './dictionary';

/** Returns `t(key)`: the UI text in the current language. */
export function useT(): (key: TextKey) => string {
  const language = useBuild((state) => state.language);
  const texts = dictionary[language];
  return (key) => texts[key];
}
