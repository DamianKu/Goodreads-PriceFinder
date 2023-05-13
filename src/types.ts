export interface Book {
  asin: string | null;
  isbn: string | null;
  isbn13: string | null;
  author: string;
  title: string;
}

export interface CacheEntry {
  book: Book,
  price: string,
  cachedAt: number,
}
