import browser from 'webextension-polyfill';
import { Book, CacheEntry, Prices } from './types';

const CACHE_TTL = 3 * 24 * 60 * 60 * 1000; //3 days in ms

export async function cachePrice(id: string, book: Book, prices: Prices): Promise<void> {
  return browser.storage.local.set({
    [id]: {
      book,
      prices,
      cachedAt: Date.now(),
    } as CacheEntry,
  });
}

function isValidCache(cache: CacheEntry | undefined): cache is CacheEntry {
  return !!cache && cache.cachedAt > Date.now() - CACHE_TTL;
}

export async function getCachedPrice(id: string): Promise<CacheEntry | null> {
  const record = await browser.storage.local.get(id);
  const entry = record[id];

  return isValidCache(entry) ? entry : null;
}
