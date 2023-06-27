import { useSelector } from 'react-redux';
import browser from 'webextension-polyfill';
import { Order } from './state/orderSlice';
import { Book, Prices } from './types';

const FORMAT_PRIORITIES: Order = [
  {id: 'Paperback', visible: true},
  {id: 'Hardcover', visible: true},
  {id: 'Kindle Edition', visible: true},
  {id: 'Audiobook', visible: true},
  {id: 'Audio CD', visible: true},
  {id: 'Spiral-bound', visible: true},
];

(async () => {
  const table = document.querySelector('#books');
  if (!table) return;

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
})();

function insertPriceCell(node: HTMLTableRowElement) {
  return node.insertCell(node.childElementCount - 1);
}

function reorderPrices(prices: Prices): Prices {
  const getPriority = (key: string) => {
    const i = FORMAT_PRIORITIES.findIndex(e => e.id === key);
    return i === -1 ? Infinity : i;
  };

  // TODO will come from state
  const FILTER_OUT_NON_DEFINED_FORMATS = true;
  if (FILTER_OUT_NON_DEFINED_FORMATS) {
    prices = prices.filter(el => FORMAT_PRIORITIES.find(f => f.id === el.format));
  }

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

        if (prices.length === 0) {
          // TODO
          price.innerHTML = 'N/A';
          return;
        }

        let warning;
        if (prices[0].format !== FORMAT_PRIORITIES[0].id) {
          warning = `<span data-gpf-tooltip='"${FORMAT_PRIORITIES[0].id}" is not available. The price shown is for a "${prices[0].format}"'>⚠️</span>`;
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
