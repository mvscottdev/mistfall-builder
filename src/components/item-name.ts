import type { Item, Localized } from '../domain/types';

/**
 * The catalogue has no Item names: weapons and jewellery show their base
 * ("Sword and Shield"), armour shows its quality and Slot ("Epic Helmet").
 */
export function itemName(
  item: Item,
  quality: Localized | undefined,
  slotLabel: Localized,
  language: keyof Localized,
): string {
  if (item.baseName) return item.baseName[language];
  return quality ? `${quality[language]} · ${slotLabel[language]}` : slotLabel[language];
}

/** Gold as the game writes it: 1 234. */
export function formatGold(gold: number, language: keyof Localized): string {
  return gold.toLocaleString(language === 'ru' ? 'ru-RU' : 'en-US');
}
