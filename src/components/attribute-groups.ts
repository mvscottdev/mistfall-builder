import { useMemo } from 'react';
import type { Attribute, AttributeCategory } from '../domain/types';
import type { TextKey } from '../i18n/dictionary';
import { useBuild } from '../store/use-build';
import { selectAttributes } from '../store/selectors';

export interface AttributeGroup {
  category: AttributeCategory;
  label: TextKey;
  attributes: Attribute[];
}

const CATEGORIES: [AttributeCategory, TextKey][] = [
  ['offense', 'categoryOffense'],
  ['defense', 'categoryDefense'],
  ['utility', 'categoryUtility'],
];

/** Attributes by category, each sorted by name in the current language. */
export function useAttributeGroups(): AttributeGroup[] {
  const attributes = useBuild(selectAttributes);
  const language = useBuild((state) => state.language);
  return useMemo(
    () =>
      CATEGORIES.map(([category, label]) => ({
        category,
        label,
        attributes: attributes
          .filter((a) => a.category === category)
          .sort((a, b) => a.name[language].localeCompare(b.name[language], language)),
      })),
    [attributes, language],
  );
}

/** The CSS colour of a category, for small marks next to text. */
export const categoryColor = (category: AttributeCategory) => `var(--cat-${category})`;
