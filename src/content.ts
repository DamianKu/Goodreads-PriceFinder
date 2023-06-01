import browser from 'webextension-polyfill';
import { Book, KnownBookFormats, Prices } from './types';

const FORMAT_PRIORITIES: { [key in KnownBookFormats]: number } = {
  'Paperback': 1,
  'Hardcover': 2,
  'Kindle Edition': 3,
  'Audiobook': 4,
  'Audio CD': 5,
  'Spiral-bound': 6,
};
const HIGHEST_PRIORITY = Object.entries(FORMAT_PRIORITIES).find(format => format[1] === 1)![0];

const table = document.querySelector('#books');
if (table) {
  // Add "price" header to the `#books` table
  const priceHeader = insertPriceCell(table.querySelector<HTMLTableRowElement>('#booksHeader')!); // TODO deal with non existing #booksHeader
  priceHeader.outerHTML = '<th class="header field gpf-plugin-price">price</th>';

  // Get price for all currently rendered books
  [...table.querySelectorAll<HTMLTableRowElement>('.bookalike')].forEach(row => handleBookRow(row));

  // Add MutationObserver and get price for all books added to the table by `infinite scroll`
  new MutationObserver(mutations => {
    for (let {target, addedNodes: [node]} of mutations) {
      if ((target as HTMLElement).tagName !== 'TBODY' || node.nodeType !== document.ELEMENT_NODE) continue;

      handleBookRow(node as HTMLTableRowElement);
    }
  }).observe(table, {childList: true, subtree: true});
}

function insertPriceCell(node: HTMLTableRowElement) {
  return node.insertCell(node.childElementCount - 1);
}

function reorderPrices(prices: Prices): Prices {
  const getPriority = (key: string) => FORMAT_PRIORITIES[key as KnownBookFormats] || Infinity;
  return prices.sort((a, b) => getPriority(a.format) - getPriority(b.format));
}

function handleBookRow(node: HTMLTableRowElement) {
  const price = insertPriceCell(node);
  price.classList.add('field', 'gpf-plugin-price');
  price.innerHTML = '...';

  const book: Book = {
    author: getBookValue(node, 'author')!.replace(/[\n*]/g, '').trim(),
    title: getBookValue(node, 'title')!,
    asin: getBookValue(node, 'asin'),
    isbn: getBookValue(node, 'isbn'),
    isbn13: getBookValue(node, 'isbn13'),
  };

  browser.runtime.sendMessage(book)
      .then((prices: Prices) => {
        prices = reorderPrices(prices);

        let warning;
        if (prices[0].format !== HIGHEST_PRIORITY) {
          warning = `<span data-gpf-tooltip='"${HIGHEST_PRIORITY}" is not available. The price shown is for a "${prices[0].format}"'>⚠️</span>`;
        }

        const pricesList = prices.reduce((acc, p) => acc + `<li><a href='${p.url}'><span>${p.value}</span><span>${p.format}</span></a></li>`, '');
        price.innerHTML = `
    <label>price</label>
    <div class="value">
      <div class="gpf-value">
        <div class="gpf-value-price-wrapper">
          <a href="${prices[0].url}">${prices[0].value}</a>
          ${warning ?? ''}
        </div>
        <label class="gpf-label" for="${book.title}" title="More buy options">&#128722;</label>
      </div>
      <div class="gpf-prices">
        <input class="gpf-prices-input" type="checkbox" id="${book.title}">
        <div class="gpf-prices-boxes">
          <div class="gpf-prices-list">
            <ul>${pricesList}</ul>
          </div>
        </div>
      </div>
    </div>`;
      });
}

function getBookValue(node: HTMLElement, key: keyof Book): string | null {
  return node.querySelector(`.${key} .value`)?.textContent?.trim() || null;
}
