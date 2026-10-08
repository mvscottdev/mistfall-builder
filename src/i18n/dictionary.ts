import { en } from './en';
import type { Language } from './language';
import { ru } from './ru';

// UI text only. Game names (Attributes, Classes, Items…) come from the catalogue.

export type TextKey = keyof typeof ru;

/** Every language must have every key; the compiler checks it. */
export const dictionary: Record<Language, Record<TextKey, string>> = { ru, en };

/** Replaces each `{name}` in a text with its value. */
export function fill(text: string, values: Record<string, string | number>): string {
  return text.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in values ? String(values[name]) : match,
  );
}
