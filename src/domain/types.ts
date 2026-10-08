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

/** The user's wanted final level for one Attribute (Items + Top-up ≥ level). */
export interface Target {
  attribute: AttributeId;
  level: number;
}

/** Extra levels on top of Items: a total pool and a cap per targeted Attribute. */
export interface TopUp {
  total: number;
  perAttribute: number;
}

/** User constraints on the Set. null = not locked. */
export interface Locks {
  /** Quality of the whole Set. */
  quality: QualityId | null;
  /** Per-Slot quality override; wins over `quality`. */
  slotQuality: Partial<Record<Slot, QualityId>>;
  weaponType: number | null;
  amuletBase: number | null;
  ringBase: number | null;
  /** Exact Item id for the Second weapon; wins over its type and quality Locks. */
  secondWeapon: number | null;
  /** Weapon type of the Second weapon (ADR-0003); the main weapon type Lock does not apply to it. */
  secondWeaponType: number | null;
  /** Quality of the Second weapon (ADR-0003); the Set quality Lock does not apply to it. */
  secondWeaponQuality: QualityId | null;
}

/** One Item of a Set with the Gem in each Mod slot (null at Built-in effects and empty Sockets). */
export interface SetPiece {
  slot: SetSlot;
  itemId: number;
  gemIds: (number | null)[];
}

/** The cheapest Set the solver found. */
export interface SolvedSet {
  /** Gold for every Item and Gem, Second weapon included. */
  cost: number;
  /** One per active Slot in Slot order, then the Second weapon. */
  pieces: SetPiece[];
  /** Top-up spent per Attribute; only Attributes that got some. */
  topUp: Record<AttributeId, number>;
  topUpUsed: number;
}
