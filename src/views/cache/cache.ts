import { Book, CacheEntry, Price } from '../../types';

// TODO Increase to what? 3 - 7 days?
const CACHE_TTL = 24 * 60 * 60 * 1000; //24hours in ms

function createCacheKey(book: Book): string {
  return book.asin || book.isbn || book.author + book.title; // use uuid for author and title or for everything?
}

export async function cachePrice(book: Book, price: Price): Promise<void> {
  return new Promise(resolve => {
    chrome.storage.local.set({
      [createCacheKey(book)]: {
        book,
        price,
        cachedAt: Date.now(),
      } as CacheEntry,
    }, resolve);
  });
}

function isValidCache(cache: CacheEntry | undefined): cache is CacheEntry {
  return !!cache && cache.cachedAt > Date.now() - CACHE_TTL;
}

export async function getCachedPrice(book: Book): Promise<CacheEntry | null> {
  const key = createCacheKey(book);
  return new Promise(resolve => {
    chrome.storage.local.get(key, result => {
      const cache = result[key];
      resolve(isValidCache(cache) ? cache : null);
    });
  });
}
