import { Book, Price } from './types';
import { cachePrice, getCachedPrice } from './cache/cache';

const BASE_AMAZON_URL = 'https://www.amazon.co.uk';

const GET_PRODUCT_URL = (id: string) => `${BASE_AMAZON_URL}/dp/${id}`;
const GET_SEARCH_URL = ({author, title}: Book) => {
  return `${BASE_AMAZON_URL}/s/?search-alias=stripbooks&field-author=${encodeURIComponent(author)}&field-title=${encodeURIComponent(title)}`;
};


chrome.runtime.onMessage.addListener((book: Book, _, sendResponse) => {
  (async () => {
    const cached = await getCachedPrice(book);
    if (cached) {
      // TODO send whole price
      sendResponse(cached.price.Paperback || cached.price.Hardcover || 'Other');
      return;
    }

    // TODO
    // check if request was already made
    // we want to wait for the first request to finish instead of making another one

    try {
      const price = await findBookPrice(book);
      if (price) {
        // TODO send whole price
        sendResponse(price.Paperback || price.Hardcover || 'Other');
        await cachePrice(book, price);
      } else {
        sendResponse('Not Found');
      }
    } catch (e) {
      console.error('Throttled?');
      console.error(e);
    }
  })();

  return true; // allow async sendResponse
});

async function findBookPrice(book: Book): Promise<Price | null> {
  if (book.asin) {
    const price = await retrievePrice(GET_PRODUCT_URL(book.asin));
    if (isValidPrice(price)) {
      return price;
    }
  }

  // Sometimes isbn is the same as asin, in that case do not make this request
  if (book.isbn && book.isbn !== book.asin) {
    const price = await retrievePrice(GET_PRODUCT_URL(book.isbn));
    if (isValidPrice(price)) {
      return price;
    }
  }

  // No valid price found by ASIN or ISBN
  // Perform search
  const searchHtml = await fetchHtml(GET_SEARCH_URL(book));
  const firstBookUrl = getFirstSearchResultUrl(searchHtml);

  if (firstBookUrl) {
    const price = await retrievePrice(firstBookUrl);
    if (isValidPrice(price)) {
      return price;
    }
  }

  // TODO
  return null;
}

function isValidPrice(price: Price | undefined): price is Price {
  // TODO
  // What else I can do?
  return Object.entries(price || {}).length > 0;
}

async function retrievePrice(url: string): Promise<Price | undefined> {
  const atLeastOneNumberRegex = /\d/;
  const html = await fetchHtml(url);

  function clearPrice(price: string): string {
    return price
        .replace(/from /, '') // Some prices contain word "from £xx.xx"
        .replace(/\s.*/g, ''); // Sometimes retrieved HTML with price will contain extra styling
  }

  return [...html.querySelectorAll('#formats .format')]
      .map(formatBox => [...formatBox.querySelectorAll<HTMLElement>('a > span')])
      .map(els => els.map(el => el.innerText.trim()))
      .filter(([, price]) => atLeastOneNumberRegex.test(price))
      .reduce((acc, [key, value]) => ({
        ...acc,
        [key as keyof Price]: clearPrice(value),
      }), {});
}

function getFirstSearchResultUrl(html: Document): string | undefined {
  const url = [...html.querySelectorAll<HTMLAnchorElement>('.s-result-list .s-link-style')]
      .find(el => !el.querySelector('span .rush-component'))
      ?.getAttribute('href');

  return url ? BASE_AMAZON_URL + url : undefined;
}

async function fetchHtml(url: string): Promise<Document> {
  const response = await fetch(url);
  const html = await response.text();
  const parsed = new DOMParser().parseFromString(html, 'text/html');

  if (parsed.querySelector('#captchacharacters')) {
    throw new Error('Throttling error');
  }

  return parsed;
}
