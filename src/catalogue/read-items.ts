import type { Contribution, Gem, Item, Localized, ModSlot, Slot } from '../domain/types';
import {
  fail,
  readIdMap,
  readInteger,
  readList,
  readNumber,
  readObject,
  readString,
} from './check';

/** An Item or Gem as catalogue.json has it, before the price join. */
export type Unpriced<T> = Omit<T, 'price'>;

export const SLOTS: readonly Slot[] = [
  'weapon',
  'helmet',
  'chest',
  'bracers',
  'pants',
  'boots',
  'amulet',
  'ring',
];

export function readSlot(value: unknown, at: string): Slot {
  if (!SLOTS.includes(value as Slot)) fail(at, `one of ${SLOTS.join(', ')}`, value);
  return value as Slot;
}

function readContribution(value: unknown, at: string): Contribution {
  return Object.fromEntries(readIdMap(value, at, readInteger));
}

function readModSlot(value: unknown, at: string): ModSlot {
  const mod = readObject(value, at);
  if (mod.type === 'fixed') {
    return { kind: 'builtIn', contribution: readContribution(mod.grants, `${at}.grants`) };
  }
  if (mod.type === 'socket') {
    return {
      kind: 'socket',
      shape: readInteger(mod.shape, `${at}.shape`),
      tier: readInteger(mod.tier, `${at}.tier`),
    };
  }
  return fail(`${at}.type`, '"fixed" or "socket"', mod.type);
}

function readOptionalBaseName(item: Record<string, unknown>, at: string): Localized | undefined {
  if (item.baseName === undefined) return undefined;
  return {
    ru: readString(item.baseName, `${at}.baseName`),
    en: readString(item.baseNameEn, `${at}.baseNameEn`),
  };
}

export function readItem(value: unknown, at: string): Unpriced<Item> {
  const raw = readObject(value, at);
  const item: Unpriced<Item> = {
    id: readInteger(raw.id, `${at}.id`),
    slot: readSlot(raw.slot, `${at}.slot`),
    classes: readList(raw.classes, `${at}.classes`, readInteger),
    quality: readInteger(raw.quality, `${at}.quality`),
    modSlots: readList(raw.mods, `${at}.mods`, readModSlot),
    codeIndex: readInteger(raw.codeIndex, `${at}.codeIndex`),
    iconId: readInteger(raw.icon, `${at}.icon`),
  };
  if (raw.weaponType !== undefined) {
    item.weaponType = readInteger(raw.weaponType, `${at}.weaponType`);
  }
  if (raw.base !== undefined) item.base = readInteger(raw.base, `${at}.base`);
  const baseName = readOptionalBaseName(raw, at);
  if (baseName) item.baseName = baseName;
  if (raw.baseStats !== undefined) {
    const stats = readObject(raw.baseStats, `${at}.baseStats`);
    item.baseStats = Object.fromEntries(
      Object.entries(stats).map(([k, v]) => [k, readNumber(v, `${at}.baseStats.${k}`)]),
    );
  }
  return item;
}

export function readGem(value: unknown, at: string): Unpriced<Gem> {
  const raw = readObject(value, at);
  return {
    id: readInteger(raw.id, `${at}.id`),
    shape: readInteger(raw.shape, `${at}.shape`),
    tier: readInteger(raw.tier, `${at}.tier`),
    contribution: readContribution(raw.grants, `${at}.grants`),
    codeIndex: readInteger(raw.codeIndex, `${at}.codeIndex`),
  };
}
