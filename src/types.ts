export interface Book {
  asin: string | null;
  isbn: string | null;
  isbn13: string | null;
  author: string;
  title: string;
}

type BookFormat = 'Kindle Edition' | 'Hardcover' | 'Audio CD' | 'Audiobook' | 'Paperback' | 'Spiral-bound';

export type Price = {
  [key in BookFormat]?: string;
}

export interface CacheEntry {
  book: Book,
  price: Price,
  cachedAt: number,
}
