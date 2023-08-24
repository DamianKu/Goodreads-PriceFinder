import { v5 } from 'uuid';
import { Book, Domain } from './types';

const BOOK_UUID_NAMESPACE = '1fca440f-5412-4151-8e95-db40ba1c45fe';

export function createBookId(book: Book, domain: Domain): string {
  const bookData = book.asin || book.isbn || book.author + book.title;
  return v5(bookData + '_' + domain, BOOK_UUID_NAMESPACE);
}
