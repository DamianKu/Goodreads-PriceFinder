import browser from 'webextension-polyfill';
import { Book, CacheEntry, Prices } from '../types';

// TODO Increase to what? 3 - 7 days?
const CACHE_TTL = 24 * 60 * 60 * 1000; //24hours in ms

function createCacheKey(book: Book): string {
  return book.asin || book.isbn || book.author + book.title; // use uuid for author and title or for everything?
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
