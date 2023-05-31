import { v5 } from 'uuid';
import browser from 'webextension-polyfill';
import { Book, CacheEntry, Prices } from '../types';

const CACHE_TTL = 3 * 24 * 60 * 60 * 1000; //3 days in ms

const CACHE_UUID_NAMESPACE = '1fca440f-5412-4151-8e95-db40ba1c45fe';

function createCacheKey(book: Book): string {
  return v5(book.asin || book.isbn || book.author + book.title, CACHE_UUID_NAMESPACE);
}

export async function cachePrice(book: Book, prices: Prices): Promise<void> {
  return browser.storage.local.set({
    [createCacheKey(book)]: {
      book,
      prices,
      cachedAt: Date.now(),
    } as CacheEntry,
  });
}

function isValidCache(cache: CacheEntry | undefined): cache is CacheEntry {
  return !!cache && cache.cachedAt > Date.now() - CACHE_TTL;
}

export async function getCachedPrice(book: Book): Promise<CacheEntry | null> {
  const key = createCacheKey(book);
  const record = await browser.storage.local.get(key);
  const entry = record[key];

  return isValidCache(entry) ? entry : null;
}
