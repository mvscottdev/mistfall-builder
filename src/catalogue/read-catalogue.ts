import type {
  Attribute,
  AttributeCategory,
  Catalogue,
  Class,
  Gem,
  Item,
  Localized,
  Quality,
  SetCodeLayout,
  SetSlot,
  Shape,
} from '../domain/types';
import {
  fail,
  readBoolean,
  readIdMap,
  readInteger,
  readList,
  readObject,
  readString,
} from './check';
import { checkReferences } from './check-references';
import { readGem, readItem, readSlot, SLOTS, type Unpriced } from './read-items';

/** catalogue.json after validation, before the price join. */
export type CatalogueData = Omit<Catalogue, 'items' | 'gems' | 'pricesUpdatedAt'> & {
  items: Unpriced<Item>[];
  gems: Unpriced<Gem>[];
};

const SET_SLOTS: readonly SetSlot[] = [...SLOTS, 'weapon2'];

const CATEGORIES: readonly AttributeCategory[] = ['offense', 'defense', 'utility'];

function readLocalized(raw: Record<string, unknown>, ru: string, en: string, at: string) {
  return { ru: readString(raw[ru], `${at}.${ru}`), en: readString(raw[en], `${at}.${en}`) };
}

function readAttribute(value: unknown, at: string): Attribute {
  const raw = readObject(value, at);
  const category = raw.category as AttributeCategory;
  if (!CATEGORIES.includes(category)) {
    fail(`${at}.category`, `one of ${CATEGORIES.join(', ')}`, category);
  }
  return {
    id: readInteger(raw.id, `${at}.id`),
    name: readLocalized(raw, 'label', 'labelEn', at),
    category,
    description: readLocalized(raw, 'desc', 'descEn', at),
    thresholds: readList(raw.thresholds, `${at}.thresholds`, readInteger),
    tiers: readList(raw.tiers, `${at}.tiers`, (v, tierAt) => {
      const tier = readObject(v, tierAt);
      return {
        level: readInteger(tier.level, `${tierAt}.level`),
        fromLevel: readInteger(tier.fromLevel, `${tierAt}.fromLevel`),
        text: readString(tier.text, `${tierAt}.text`),
      };
    }),
    iconId: readInteger(raw.iconId, `${at}.iconId`),
    bgIconId: readInteger(raw.bgIconId, `${at}.bgIconId`),
  };
}

function readShape(value: unknown, at: string): Shape {
  const raw = readObject(value, at);
  return {
    id: readInteger(raw.id, `${at}.id`),
    key: readString(raw.name, `${at}.name`),
    name: readLocalized(raw, 'ru', 'nameEn', at),
    family: raw.family === null ? null : readString(raw.family, `${at}.family`),
    universal: readBoolean(raw.universal, `${at}.universal`),
    iconIds: [readInteger(raw.iconId1, `${at}.iconId1`), readInteger(raw.iconId2, `${at}.iconId2`)],
  };
}

function readQualities(raw: Record<string, unknown>): Quality[] {
  const modSlotCounts = readIdMap(raw.qualityMods, 'catalogue.json: qualityMods', readInteger);
  return readList(raw.qualities, 'catalogue.json: qualities', (v, at) => {
    const quality = readObject(v, at);
    const id = readInteger(quality.id, `${at}.id`);
    const color = readString(quality.color, `${at}.color`);
    if (!/^#[0-9A-Fa-f]{6}$/.test(color)) fail(`${at}.color`, 'a colour like #E5B043', color);
    const modSlotCount = modSlotCounts.get(id);
    if (modSlotCount === undefined)
      fail(`catalogue.json: qualityMods["${id}"]`, 'a count', undefined);
    return { id, name: readLocalized(quality, 'ru', 'nameEn', at), color, modSlotCount };
  });
}

function readClass(value: unknown, at: string): Class {
  const raw = readObject(value, at);
  return {
    id: readInteger(raw.id, `${at}.id`),
    name: readLocalized(raw, 'ru', 'nameEn', at),
    iconId: readInteger(raw.iconId, `${at}.iconId`),
  };
}

function readSlotLabels(value: unknown, at: string): Record<SetSlot, Localized> {
  const raw = readObject(value, at);
  const ru = readObject(raw.ru, `${at}.ru`);
  const en = readObject(raw.en, `${at}.en`);
  const entries = SET_SLOTS.map((slot) => [
    slot,
    readLocalized({ ru: ru[slot], en: en[slot] }, 'ru', 'en', `${at}.${slot}`),
  ]);
  return Object.fromEntries(entries) as Record<SetSlot, Localized>;
}

function readSetCode(value: unknown, at: string): SetCodeLayout {
  const raw = readObject(value, at);
  const slotNum = readObject(raw.slotNum, `${at}.slotNum`);
  const entries = SET_SLOTS.map((slot) => [
    slot,
    readInteger(slotNum[slot], `${at}.slotNum.${slot}`),
  ]);
  return {
    codeSlot: Object.fromEntries(entries) as Record<SetSlot, number>,
    order: readList(raw.order, `${at}.order`, readInteger),
    headerBase: readInteger(raw.headerBase, `${at}.headerBase`),
    headerBits: readInteger(raw.headerBits, `${at}.headerBits`),
    fieldBits: readInteger(raw.field, `${at}.field`),
  };
}

/** Validates catalogue.json and maps it to domain names. */
export function readCatalogue(json: unknown): CatalogueData {
  const at = 'catalogue.json';
  const raw = readObject(json, at);
  if (raw.version !== 1) fail(`${at}: version`, '1', raw.version);
  const data: CatalogueData = {
    attributes: readList(raw.attributes, `${at}: attributes`, readAttribute),
    shapes: readList(raw.shapes, `${at}: shapes`, readShape),
    qualities: readQualities(raw),
    classes: readList(raw.classes, `${at}: classes`, readClass),
    slotOrder: readList(raw.slotOrder, `${at}: slotOrder`, readSlot),
    slotLabels: readSlotLabels(raw.slotLabels, `${at}: slotLabels`),
    setCode: readSetCode(raw.setCode, `${at}: setCode`),
    items: readList(raw.items, `${at}: items`, readItem),
    gems: readList(raw.gems, `${at}: gems`, readGem),
  };
  checkReferences(data);
  return data;
}
