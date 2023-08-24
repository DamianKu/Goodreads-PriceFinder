import { cachePrice, getCachedPrice } from './cache';
import { addBook, retrieveBookPrice, retrievedBookPriceError, retrievedBookPriceSuccess } from './state/booksSlice';
import { listenerMiddleware, StoreState } from './state/store';
import { Book, Domain, Prices } from './types';
import { AnyAction, ListenerEffectAPI, ThunkDispatch } from "@reduxjs/toolkit";
import { parse, HTMLElement } from 'node-html-parser';

const GET_AMAZON_URL = (domain: Domain) => 'https://www.amazon.' + domain
const GET_PRODUCT_URL = (id: string, domain: Domain) => `${GET_AMAZON_URL(domain)}/dp/${id}`;
const GET_SEARCH_URL = ({author, title}: Book, domain: Domain,) => {
  return `${GET_AMAZON_URL(domain)}/s/?search-alias=stripbooks&field-author=${encodeURIComponent(author)}&field-title=${encodeURIComponent(title)}`;
};

listenerMiddleware.startListening({
  actionCreator: addBook,
  effect: async ({payload: {id, book}}, listenerApi) => onAddedBook(id, book, listenerApi),
});

listenerMiddleware.startListening({
  actionCreator: retrieveBookPrice,
  effect: async ({payload: {id, book}}, listenerApi) => onRetrieveBookPrice(id, book, listenerApi),
})

async function onAddedBook(id: string, book: Book, listenerApi: ListenerEffectAPI<unknown, ThunkDispatch<unknown, unknown, AnyAction>>): Promise<void> {
  listenerApi.dispatch(retrieveBookPrice({id, book}));
}

async function onRetrieveBookPrice(id: string, book: Book, listenerApi: ListenerEffectAPI<unknown, ThunkDispatch<unknown, unknown, AnyAction>>): Promise<void> {
  const {settings: {domain}}: StoreState = listenerApi.getState() as StoreState;

  const cached = await getCachedPrice(id);
  if (cached) {
    listenerApi.dispatch(retrievedBookPriceSuccess({id, prices: cached.prices}));
    return;
  }

  // TODO
  // check if request was already made
  // we want to wait for the first request to finish instead of making another one

  try {
    const prices = await findBookPrice(book, domain);
    if (prices) {
      await cachePrice(id, book, prices);
      listenerApi.dispatch(retrievedBookPriceSuccess({id, prices}));
      return;
    } else {
      listenerApi.dispatch(retrievedBookPriceSuccess({id, prices: []}))
      return;
    }
  } catch (e) {
    console.error(e);
    listenerApi.dispatch(retrievedBookPriceError({id, error: e.message}))
  }
}

async function findBookPrice(book: Book, domain: Domain): Promise<Prices | null> {
  if (book.asin) {
    const price = await retrievePrices(GET_PRODUCT_URL(book.asin, domain), domain);
    if (price?.length) {
      return price;
    }
  }

  // Sometimes isbn is the same as asin, in that case do not make this request
  if (book.isbn && book.isbn !== book.asin) {
    const price = await retrievePrices(GET_PRODUCT_URL(book.isbn, domain), domain);
    if (price?.length) {
      return price;
    }
  }

  // No valid price found by ASIN or ISBN
  // Perform search
  const searchHtml = await fetchHtml(GET_SEARCH_URL(book, domain));
  const firstBookUrl = getFirstSearchResultUrl(searchHtml, domain);

  if (firstBookUrl) {
    const price = await retrievePrices(firstBookUrl, domain);
    if (price?.length) {
      return price;
    }
  }

  return null;
}

async function retrievePrices(url: string, domain: Domain): Promise<Prices | undefined> {
  const atLeastOneNumberRegex = /\d/;
  const html = await fetchHtml(url);

  function clearValue(price: string): string {
    return price
        .replace(/from /, '') // Some prices contain word "from £xx.xx"
        .replace(/\s.*/g, ''); // Sometimes retrieved HTML with price will contain extra styling
  }

  function createUrl(href: string): string {
    // eslint-disable-next-line no-script-url
    if (href === 'javascript:void(0)') {
      return url;
    }

    return GET_AMAZON_URL(domain) + href;
  }

  return [...html.querySelectorAll('#formats .format a')]
      .map(formatEl => {
        const [format, price] = [...formatEl.querySelectorAll(':scope > span')].map(el => el.innerText.trim());
        return {
          url: createUrl(formatEl.getAttribute('href')!),
          format: clearValue(format),
          value: clearValue(price),
        };
      })
      .filter(({value}) => atLeastOneNumberRegex.test(value));
}

function getFirstSearchResultUrl(html: HTMLElement, domain: Domain): string | undefined {
  const url = [...html.querySelectorAll('.s-result-list .s-link-style')]
      .find(el => !el.querySelector('span .rush-component'))
      ?.getAttribute('href');

  return url ? GET_AMAZON_URL(domain) + url : undefined;
}

async function fetchHtml(url: string): Promise<HTMLElement> {
  const response = await fetch(url);
  const html = await response.text();
  const parsed = parse(html)

  if (parsed.querySelector('#captchacharacters')) {
    throw new Error('Throttling error');
  }

  return parsed;
}
