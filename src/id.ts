import { v5 } from 'uuid';
import { Book } from './types';

const BOOK_UUID_NAMESPACE = '1fca440f-5412-4151-8e95-db40ba1c45fe';

export function createBookId(book: Book): string {
  return v5(book.asin || book.isbn || book.author + book.title, BOOK_UUID_NAMESPACE);
}
