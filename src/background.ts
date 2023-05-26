import { cachePrice, getCachedPrice } from './cache/cache';
import { Book, BookFormat, Prices } from './types';

const BASE_AMAZON_URL = 'https://www.amazon.co.uk';

const GET_PRODUCT_URL = (id: string) => `${BASE_AMAZON_URL}/dp/${id}`;
const GET_SEARCH_URL = ({author, title}: Book) => {
  return `${BASE_AMAZON_URL}/s/?search-alias=stripbooks&field-author=${encodeURIComponent(author)}&field-title=${encodeURIComponent(title)}`;
};


chrome.runtime.onMessage.addListener((book: Book, _, sendResponse) => {
  (async () => {
    const cached = await getCachedPrice(book);
    if (cached) {
      sendResponse(cached.prices);
      return;
    }

    // TODO
    // check if request was already made
    // we want to wait for the first request to finish instead of making another one

    try {
      const price = await findBookPrice(book);
      if (price) {
        sendResponse(price);
        await cachePrice(book, price);
      } else {
        // TODO
        // sendResponse(null);
      }
    } catch (e) {
      console.error('Throttled?');
      console.error(e);
      // TODO
      // sendResponse(null);
    }
  })();

  return true; // allow async sendResponse
});

async function findBookPrice(book: Book): Promise<Prices | null> {
  if (book.asin) {
    const price = await retrievePrices(GET_PRODUCT_URL(book.asin));
    if (price?.length) {
      return price;
    }
  }

  // Sometimes isbn is the same as asin, in that case do not make this request
  if (book.isbn && book.isbn !== book.asin) {
    const price = await retrievePrices(GET_PRODUCT_URL(book.isbn));
    if (price?.length) {
      return price;
    }
  }

  // No valid price found by ASIN or ISBN
  // Perform search
  const searchHtml = await fetchHtml(GET_SEARCH_URL(book));
  const firstBookUrl = getFirstSearchResultUrl(searchHtml);

  if (firstBookUrl) {
    const price = await retrievePrices(firstBookUrl);
    if (price?.length) {
      return price;
    }
  }

  // TODO
  return null;
}

async function retrievePrices(url: string): Promise<Prices | undefined> {
  const atLeastOneNumberRegex = /\d/;
  const html = await fetchHtml(url);

  function clearPrice(price: string): string {
    return price
        .replace(/from /, '') // Some prices contain word "from £xx.xx"
        .replace(/\s.*/g, ''); // Sometimes retrieved HTML with price will contain extra styling
  }

  function createUrl(href: string): string {
    if (href === 'javascript:void(0)') {
      return url;
    }

    return BASE_AMAZON_URL + href;
  }

  return [...html.querySelectorAll('#formats .format a')]
      .map(formatEl => {
        const [format, price] = [...formatEl.querySelectorAll<HTMLElement>(':scope > span')].map(el => el.innerText.trim());
        return {
          url: createUrl(formatEl.getAttribute('href')!),
          format: format as BookFormat,
          value: clearPrice(price),
        };
      })
      .filter(({value}) => atLeastOneNumberRegex.test(value));
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
