import type { Catalogue } from '../domain/types';
import { SnapshotError } from './check';
import { joinPrices } from './price';
import { readCatalogue } from './read-catalogue';
import { readPrices } from './read-prices';

async function fetchJson(baseUrl: string, file: string): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(`${baseUrl}data/${file}`);
  } catch {
    throw new SnapshotError(`${file}: could not be downloaded (network error)`);
  }
  if (!response.ok) throw new SnapshotError(`${file}: download failed (HTTP ${response.status})`);
  try {
    return await response.json();
  } catch (error) {
    throw new SnapshotError(`${file}: not valid JSON (${(error as Error).message})`);
  }
}

/**
 * Fetches the Snapshot (catalogue.json + prices.json), validates both files and joins prices.
 * Rejects with a SnapshotError whose message says which file and field is wrong.
 */
export async function loadCatalogue(baseUrl = import.meta.env.BASE_URL): Promise<Catalogue> {
  const [catalogueJson, pricesJson] = await Promise.all([
    fetchJson(baseUrl, 'catalogue.json'),
    fetchJson(baseUrl, 'prices.json'),
  ]);
  const data = readCatalogue(catalogueJson);
  const knownIds = new Set([...data.items, ...data.gems].map((x) => x.id));
  return joinPrices(data, readPrices(pricesJson, knownIds));
}
