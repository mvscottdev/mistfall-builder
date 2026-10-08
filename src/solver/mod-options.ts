import type { AttributeId, Catalogue, Contribution, Gem, ModSlot, Socket } from '../domain/types';

/** A Gem the solver may pick: it has a Price. */
export type PricedGem = Gem & { price: number };

/** One way to fill a Mod slot: what it adds per Target, and what it costs on top of the Item. */
export interface ModOption {
  /** Contribution projected on the Target order. */
  vector: number[];
  price: number;
  gem: PricedGem | null;
}

/** Priced Gems that fit a Socket (Shape matches or is round, gem tier ≤ socket tier), in catalogue order. */
export function fittingGems(catalogue: Catalogue, socket: Socket): PricedGem[] {
  const universal = catalogue.shapes.find((shape) => shape.id === socket.shape)?.universal ?? false;
  return catalogue.gems.filter(
    (gem): gem is PricedGem =>
      gem.price !== null && gem.tier <= socket.tier && (universal || gem.shape === socket.shape),
  );
}

function project(contribution: Contribution, order: AttributeId[]): number[] {
  return order.map((attribute) => contribution[attribute] ?? 0);
}

/**
 * The options for one Mod slot. A Built-in effect has one, at no extra cost.
 * A Socket has one per distinct projected vector: the cheapest Gem giving it,
 * the first one in catalogue order on a price tie. No fitting Gem → no options.
 */
export function modOptions(catalogue: Catalogue, mod: ModSlot, order: AttributeId[]): ModOption[] {
  if (mod.kind === 'builtIn') {
    return [{ vector: project(mod.contribution, order), price: 0, gem: null }];
  }
  const cheapest = new Map<string, ModOption>();
  for (const gem of fittingGems(catalogue, mod)) {
    const vector = project(gem.contribution, order);
    const key = vector.join(',');
    const current = cheapest.get(key);
    if (!current || gem.price < current.price) cheapest.set(key, { vector, price: gem.price, gem });
  }
  return [...cheapest.values()];
}
