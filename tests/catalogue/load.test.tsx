import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import catalogueRaw from '../../public/data/catalogue.json?raw';
import { loadCatalogue } from '../../src/catalogue/load';
import { LoadError } from '../../src/components/LoadError';

const validPrices = JSON.stringify({ updatedAt: '2026-10-07', low: {}, avg: { '221101': 5 } });

function serve(prices: { status?: number; body: string }, catalogueStatus = 200) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) =>
      url.endsWith('catalogue.json')
        ? new Response(catalogueRaw, { status: catalogueStatus })
        : new Response(prices.body, { status: prices.status ?? 200 }),
    ),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('loading the Snapshot', () => {
  test('fetches both files under the base URL and joins prices', async () => {
    serve({ body: validPrices });
    const catalogue = await loadCatalogue('/mistfall-builder/');
    expect(fetch).toHaveBeenCalledWith('/mistfall-builder/data/catalogue.json');
    expect(fetch).toHaveBeenCalledWith('/mistfall-builder/data/prices.json');
    expect(catalogue.gems.find((g) => g.id === 221101)?.price).toBe(5);
    expect(catalogue.pricesUpdatedAt).toBe('2026-10-07');
  });

  test('prices.json that is not JSON names the file', async () => {
    serve({ body: '{ "updatedAt": "2026-10-07", ' });
    await expect(loadCatalogue('/')).rejects.toThrow('prices.json: not valid JSON');
  });

  test('a missing prices.json names the file and HTTP status', async () => {
    serve({ status: 404, body: '' });
    await expect(loadCatalogue('/')).rejects.toThrow('prices.json: download failed (HTTP 404)');
  });

  test('a failed catalogue.json download names that file', async () => {
    serve({ body: validPrices }, 500);
    await expect(loadCatalogue('/')).rejects.toThrow('catalogue.json: download failed (HTTP 500)');
  });

  test('a broken prices.json shows a readable error in the UI', async () => {
    serve({ body: JSON.stringify({ updatedAt: '2026-10-07', low: { '221101': -1 }, avg: {} }) });
    const error = await loadCatalogue('/').catch((e: Error) => e);
    render(<LoadError message={(error as Error).message} />);
    expect(screen.getByRole('alert')).toHaveTextContent(
      'prices.json: low["221101"]: expected a positive number, got -1',
    );
  });
});
