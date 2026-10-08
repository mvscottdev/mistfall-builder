import { useEffect, useState } from 'react';

/**
 * A UI option offered in several versions while the maintainer picks one:
 * `?<key>=` in the URL, else the saved choice, else the first option. Remembered.
 */
export function useChoice<T extends string>(
  key: string,
  options: readonly T[],
): [T, (value: T) => void] {
  const storageKey = `mistfall-builder.${key}`;
  const [value, setValue] = useState<T>(() => {
    const isOption = (v: unknown): v is T => options.includes(v as T);
    const fromUrl = new URLSearchParams(location.search).get(key);
    if (isOption(fromUrl)) return fromUrl;
    try {
      const saved = localStorage.getItem(storageKey);
      if (isOption(saved)) return saved;
    } catch {
      // storage blocked: fall through
    }
    return options[0] as T;
  });
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, value);
    } catch {
      // not saved; the choice holds until the page closes
    }
  }, [storageKey, value]);
  return [value, setValue];
}
