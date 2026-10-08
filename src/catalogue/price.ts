import type { Catalogue, Price } from '../domain/types';
import type { CatalogueData } from './read-catalogue';
import type { Prices } from './read-prices';

/** Price = low ?? avg; null when prices.json has neither. */
export function priceOf(id: number, prices: Prices): Price {
  return prices.low.get(id) ?? prices.avg.get(id) ?? null;
}

/** Gives every Item and Gem its Price. Unpriced ones stay, with a null Price. */
export function joinPrices(data: CatalogueData, prices: Prices): Catalogue {
  return {
    ...data,
    items: data.items.map((item) => ({ ...item, price: priceOf(item.id, prices) })),
    gems: data.gems.map((gem) => ({ ...gem, price: priceOf(gem.id, prices) })),
    pricesUpdatedAt: prices.updatedAt,
  };
}
