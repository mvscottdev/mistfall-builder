export type Language = 'ru' | 'en';

const STORAGE_KEY = 'mistfall-builder.language';

function savedLanguage(): Language | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === 'ru' || saved === 'en' ? saved : null;
  } catch {
    return null; // storage blocked, e.g. private mode
  }
}

/** The browser's first preferred language that we have; English otherwise. */
function browserLanguage(): Language {
  for (const tag of navigator.languages ?? [navigator.language]) {
    const code = tag.toLowerCase().split('-')[0];
    if (code === 'ru' || code === 'en') return code;
  }
  return 'en';
}

/** The user's saved choice, else the browser's language. */
export function initialLanguage(): Language {
  return savedLanguage() ?? browserLanguage();
}

export function saveLanguage(language: Language): void {
  try {
    localStorage.setItem(STORAGE_KEY, language);
  } catch {
    // Not saved; the choice still holds until the page closes.
  }
}
