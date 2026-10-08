import type { Language } from './language';

// UI text only. Game names (Attributes, Classes, Items…) come from the catalogue.
const ru = {
  appTitle: 'Mistfall Builder',
  comingSoon: 'Скоро будет.',
};

export type TextKey = keyof typeof ru;

/** Every language must have every key; the compiler checks it. */
export const dictionary: Record<Language, Record<TextKey, string>> = {
  ru,
  en: {
    appTitle: 'Mistfall Builder',
    comingSoon: 'Coming soon.',
  },
};
