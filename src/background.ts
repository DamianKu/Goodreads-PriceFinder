import { Book, CacheEntry } from './types';

const BASE_AMAZON_URL = 'https://www.amazon.co.uk';

const GET_PRODUCT_URL = ({asin, isbn}: Book) => `${BASE_AMAZON_URL}/dp/${asin || isbn}`;
const GET_SEARCH_URL = ({author, title}: Book) => {
  return `${BASE_AMAZON_URL}/s/?search-alias=stripbooks&field-author=${encodeURIComponent(author)}&field-title=${encodeURIComponent(title)}`;
};

const CACHE_TTL = 24 * 60 * 60 * 1000; //24hours in ms

chrome.runtime.onMessage.addListener((book: Book, _, sendResponse) => {
  (async () => {
    const cached = await getCachedPrice(book);
    if (isValidCache(cached)) {
      sendResponse(cached.price);
      return;
    }

    // TODO
    // check if request was already made
    // we want to wait for the first request to finish instead of making another one

    const price = await findBookPrice(book);
    sendResponse(price);
    await cachePrice(book, price);
  })();

  return true; // allow async sendResponse
});

async function findBookPrice(book: Book): Promise<string> {

  if (book.asin || book.isbn) {
    const html = await fetchHtml(GET_PRODUCT_URL(book));
    const price = retrievePriceFromHtml(html);

    if (isValidPrice(price)) {
      return 'ASIN/ISBN: ' + price;
    }
  }

  // No valid price found by ASIN or ISBN
  // Perform search
  const searchHtml = await fetchHtml(GET_SEARCH_URL(book));
  const firstBookUrl = getFirstSearchResultUrl(searchHtml);

  if (!firstBookUrl) {
    // TODO
    return 'Not found';
  }

  const bookHtml = await fetchHtml(firstBookUrl);
  const price = retrievePriceFromHtml(bookHtml);

  if (isValidPrice(price)) {
    return 'Q: ' + price;
  }

  // TODO
  return 'Not found';
}

function isValidCache(cache: CacheEntry | undefined): cache is CacheEntry {
  return !!cache && cache.cachedAt > Date.now() - CACHE_TTL;
}

function isValidPrice(price: string | undefined): price is string {
  // TODO
  return !!price;
}

function retrievePriceFromHtml(html: string): string | undefined {
  return [...parseHtml(html).querySelectorAll<HTMLElement>('#formats .format')]
      .map(v => v.textContent!.replace(/\s\s+/g, ' ').trim())
      .filter(v => v.match(/^\w.+\d$/))
      .find(v => v.startsWith('Paperback'))
      ?.split(' ')[1];
}

function getFirstSearchResultUrl(html: string): string | undefined {
  const url = parseHtml(html).querySelector<HTMLAnchorElement>('.s-result-list .s-link-style')?.getAttribute('href');

  if (!url) return;

  return BASE_AMAZON_URL + url;
}

async function fetchHtml(url: string): Promise<string> {
  const response = await fetch(url);
  return await response.text();
}

function parseHtml(html: string): Document {
  return new DOMParser().parseFromString(html, 'text/html');
}

function bookKey(book: Book): string {
  return book.asin || book.isbn || book.author + book.title; // use uuid for author and title or for everything?
}

async function getCachedPrice(book: Book): Promise<CacheEntry | undefined> {
  const key = bookKey(book);
  return new Promise(resolve => {
    chrome.storage.local.get(key, result => {
      resolve(result[key]);
    });
  });
}

async function cachePrice(book: Book, price: string): Promise<void> {
  return new Promise(resolve => {
    chrome.storage.local.set({
      [bookKey(book)]: {
        book,
        price,
        cachedAt: Date.now(),
      },
    }, resolve);
  });
}
