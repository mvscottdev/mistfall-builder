import { describe, expect, test } from 'vitest';
import catalogueRaw from '../../public/data/catalogue.json?raw';
import { readCatalogue } from '../../src/catalogue/read-catalogue';

const fresh = () => JSON.parse(catalogueRaw);

describe('catalogue.json validation', () => {
  const data = readCatalogue(fresh());

  test('the committed catalogue reads in full', () => {
    expect(data.items).toHaveLength(1653);
    expect(data.gems).toHaveLength(312);
    expect(data.attributes).toHaveLength(32);
    expect(data.classes.map((c) => c.id)).toEqual([10, 11, 12, 13, 14, 15]);
    expect(data.slotOrder).toHaveLength(8);
  });

  test('a fixed mod becomes a Built-in effect and keeps its position', () => {
    const item = data.items.find((i) => i.id === 1130101);
    expect(item?.modSlots).toEqual([{ kind: 'builtIn', contribution: { 4: 1 } }]);
  });

  test('Mod slot count per Quality is 1 / 2 / 2 / 3 / 3', () => {
    expect(data.qualities.map((q) => q.modSlotCount)).toEqual([1, 2, 2, 3, 3]);
  });

  test('a Tier keeps fromLevel as its entry level', () => {
    expect(data.attributes[0]?.tiers[1]).toMatchObject({ level: 7, fromLevel: 5 });
  });

  test('Tier thresholds are kept as listed, even where tiers start lower', () => {
    const attribute = data.attributes.find((a) => a.id === 8);
    expect(attribute?.thresholds).toEqual([5]);
    expect(attribute?.tiers.map((t) => t.fromLevel)).toEqual([1, 5]);
  });

  test('amulets and rings fit every Class (empty class list) and carry a base', () => {
    const jewellery = data.items.filter((i) => i.slot === 'amulet' || i.slot === 'ring');
    expect(jewellery.every((i) => i.classes.length === 0 && i.base !== undefined)).toBe(true);
  });

  test('a broken item field names its path', () => {
    const json = fresh();
    json.items[12].quality = 'epic';
    expect(() => readCatalogue(json)).toThrow(
      'catalogue.json: items[12].quality: expected an integer, got "epic"',
    );
  });

  test('an unknown mod type is rejected', () => {
    const json = fresh();
    json.items[0].mods[0].type = 'magic';
    expect(() => readCatalogue(json)).toThrow(
      'items[0].mods[0].type: expected "fixed" or "socket"',
    );
  });

  test('a Socket with an unknown Shape is rejected', () => {
    const json = fresh();
    json.gems[3].shape = 9;
    expect(() => readCatalogue(json)).toThrow('catalogue.json: gems[3]: unknown Shape 9');
  });

  test('a duplicate id is rejected', () => {
    const json = fresh();
    json.gems[0].id = json.items[0].id;
    expect(() => readCatalogue(json)).toThrow('gems[0]: duplicate id');
  });

  test('an unknown format version is rejected', () => {
    expect(() => readCatalogue({ ...fresh(), version: 2 })).toThrow(
      'catalogue.json: version: expected 1, got 2',
    );
  });
});
