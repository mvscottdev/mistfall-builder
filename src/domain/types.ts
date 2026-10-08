// Domain types, named in the project's glossary terms. src/catalogue maps the
// snapshot JSON's own field names to these.

export type ClassId = number;
export type QualityId = number;
export type AttributeId = number;
export type ShapeId = number;

/** The 8 main Slots, in display order. */
export type Slot =
  'weapon' | 'helmet' | 'chest' | 'bracers' | 'pants' | 'boots' | 'amulet' | 'ring';

/** A main Slot or the Second weapon. */
export type SetSlot = Slot | 'weapon2';

export interface Localized {
  ru: string;
  en: string;
}

/** Levels given per Attribute (a double Gem gives 2 in total). */
export type Contribution = Record<AttributeId, number>;

export interface BuiltInEffect {
  kind: 'builtIn';
  contribution: Contribution;
}

export interface Socket {
  kind: 'socket';
  shape: ShapeId;
  tier: number;
}

export type ModSlot = BuiltInEffect | Socket;

/** Gold, or null when prices.json has no `low` or `avg` for it. */
export type Price = number | null;

export interface Item {
  id: number;
  slot: Slot;
  /** Classes that can wear it; empty = every Class (amulets, rings). */
  classes: ClassId[];
  quality: QualityId;
  modSlots: ModSlot[];
  /** Position in the Class's item list for the Set code (1-based). */
  codeIndex: number;
  iconId: number;
  /** Weapons only: the weapon type a Lock can pin. */
  weaponType?: number;
  /** Amulets and rings only: the base a Lock can pin. */
  base?: number;
  /** Weapon type or base name. */
  baseName?: Localized;
  baseStats?: Record<string, number>;
  price: Price;
}

export interface Gem {
  id: number;
  shape: ShapeId;
  tier: number;
  contribution: Contribution;
  codeIndex: number;
  price: Price;
}

export interface Tier {
  /** Top of the tier's level range. */
  level: number;
  /** The tier is reached at this level. */
  fromLevel: number;
  /** Russian only. */
  text: string;
}

export type AttributeCategory = 'offense' | 'defense' | 'utility';

export interface Attribute {
  id: AttributeId;
  name: Localized;
  category: AttributeCategory;
  description: Localized;
  /**
   * Tier levels as the game lists them, for the threshold label and tick marks:
   * usually each tier's top `level`, minus the level-1 tier in a few Attributes.
   */
  thresholds: number[];
  tiers: Tier[];
  iconId: number;
  bgIconId: number;
}

export interface Shape {
  id: ShapeId;
  /** Stable key: triangle, square, octagon, rounded, round. */
  key: string;
  name: Localized;
  /** Gem family that fits it, for display; null for the universal round Shape. */
  family: string | null;
  /** Round: takes a Gem of any family. */
  universal: boolean;
  iconIds: [number, number];
}

export interface Quality {
  id: QualityId;
  name: Localized;
  /** `#RRGGBB` */
  color: string;
  modSlotCount: number;
}

export interface Class {
  id: ClassId;
  name: Localized;
  iconId: number;
}

/** Constants of the game's Set code format. */
export interface SetCodeLayout {
  codeSlot: Record<SetSlot, number>;
  /** Code slot numbers in write order. */
  order: number[];
  headerBase: number;
  headerBits: number;
  fieldBits: number;
}

/** The Snapshot after loading: catalogue joined with prices. */
export interface Catalogue {
  attributes: Attribute[];
  shapes: Shape[];
  qualities: Quality[];
  classes: Class[];
  slotOrder: Slot[];
  slotLabels: Record<SetSlot, Localized>;
  setCode: SetCodeLayout;
  /** Every Item, priced or not, so every Set code decodes. */
  items: Item[];
  gems: Gem[];
  /** `YYYY-MM-DD` of prices.json. */
  pricesUpdatedAt: string;
}
