import { domains } from "./domains";

export interface Book {
  asin: string | null;
  isbn: string | null;
  isbn13: string | null;
  author: string;
  title: string;
}

// TODO - does it make sense?
export type KnownBookFormats = 'Kindle' | 'Hardcover' | 'Audio CD' | 'Audiobook' | 'Paperback' | 'Spiral-bound';

export type Prices = {
  format: string,
  url: string,
  value: string
}[];

export interface CacheEntry {
  book: Book,
  prices: Prices,
  cachedAt: number,
}

export type Domain = typeof domains[number];
