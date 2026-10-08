import type { Contribution, ModSlot } from '../domain/types';
import { SnapshotError } from './check';
import type { CatalogueData } from './read-catalogue';

/**
 * Checks that every id an Item or Gem refers to exists, and that Item and Gem
 * ids are unique (prices.json keys share one id space).
 */
export function checkReferences(data: CatalogueData): void {
  const ids = (list: { id: number }[]) => new Set(list.map((x) => x.id));
  const attributes = ids(data.attributes);
  const shapes = ids(data.shapes);
  const qualities = ids(data.qualities);
  const classes = ids(data.classes);

  const expect = (ok: boolean, at: string, what: string) => {
    if (!ok) throw new SnapshotError(`catalogue.json: ${at}: ${what}`);
  };
  const checkContribution = (contribution: Contribution, at: string) => {
    for (const id of Object.keys(contribution)) {
      expect(attributes.has(Number(id)), at, `unknown Attribute ${id}`);
    }
  };
  const checkModSlot = (mod: ModSlot, at: string) => {
    if (mod.kind === 'socket') expect(shapes.has(mod.shape), at, `unknown Shape ${mod.shape}`);
    else checkContribution(mod.contribution, at);
  };

  const seen = new Set<number>();
  data.items.forEach((item, i) => {
    const at = `items[${i}]`;
    expect(!seen.has(item.id), at, `duplicate id ${item.id}`);
    seen.add(item.id);
    expect(qualities.has(item.quality), at, `unknown Quality ${item.quality}`);
    for (const c of item.classes) expect(classes.has(c), at, `unknown Class ${c}`);
    item.modSlots.forEach((mod, m) => checkModSlot(mod, `${at}.mods[${m}]`));
  });
  data.gems.forEach((gem, i) => {
    const at = `gems[${i}]`;
    expect(!seen.has(gem.id), at, `duplicate id ${gem.id}`);
    seen.add(gem.id);
    expect(shapes.has(gem.shape), at, `unknown Shape ${gem.shape}`);
    checkContribution(gem.contribution, at);
  });
}
