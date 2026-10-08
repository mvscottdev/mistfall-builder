import { afterEach, describe, expect, test, vi } from 'vitest';
import { dictionary } from '../../src/i18n/dictionary';
import { initialLanguage, saveLanguage } from '../../src/i18n/language';

const browserLanguages = (languages: string[]) =>
  vi.spyOn(navigator, 'languages', 'get').mockReturnValue(languages);

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('initialLanguage', () => {
  test('a Russian browser starts in Russian', () => {
    browserLanguages(['ru-RU', 'en']);
    expect(initialLanguage()).toBe('ru');
  });

  test('the first language we have wins', () => {
    browserLanguages(['de-DE', 'en-US', 'ru']);
    expect(initialLanguage()).toBe('en');
  });

  test('a browser with neither language starts in English', () => {
    browserLanguages(['de-DE', 'fr']);
    expect(initialLanguage()).toBe('en');
  });

  test('a saved choice wins over the browser language', () => {
    browserLanguages(['ru-RU']);
    saveLanguage('en');
    expect(initialLanguage()).toBe('en');
  });

  test('blocked storage falls back to the browser language', () => {
    browserLanguages(['ru']);
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(initialLanguage()).toBe('ru');
  });
});

test('every UI text is non-empty in both languages', () => {
  for (const texts of Object.values(dictionary)) {
    for (const text of Object.values(texts)) expect(text).not.toBe('');
  }
});
