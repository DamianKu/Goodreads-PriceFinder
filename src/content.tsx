import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { Store } from 'webext-redux';
import { Book } from './types';
import App from './views/Content/App';
import React from 'react';
import { createBookId } from "./id";

const store = new Store();
Object.assign(store, {
  dispatch: store.dispatch.bind(store),
  getState: store.getState.bind(store),
  subscribe: store.subscribe.bind(store),
});

(async () => {
  const table = document.querySelector('#books');
  if (!table) return;

  await store.ready();

  // Add "price" header to the `#books` table
  const priceHeader = insertPriceCell(table.querySelector<HTMLTableRowElement>('#booksHeader')!); // TODO deal with non existing #booksHeader
  priceHeader.outerHTML = '<th class="header field gpf-plugin-price">price</th>';

  // Get price for all currently rendered books
  [...table.querySelectorAll<HTMLTableRowElement>('.bookalike')].forEach(handleBookRow);

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

function handleBookRow(node: HTMLTableRowElement) {
  const price = insertPriceCell(node);
  price.classList.add('field', 'gpf-plugin-price');

  const book: Book = {
    author: getBookValue(node, 'author')!.replace(/[\n*]/g, '').trim(),
    title: getBookValue(node, 'title')!,
    asin: getBookValue(node, 'asin'),
    isbn: getBookValue(node, 'isbn'),
    isbn13: getBookValue(node, 'isbn13'),
  };

  ReactDOM.render(
      <React.StrictMode>
        <Provider store={store}>
          <App id={createBookId(book)} book={book}/>
        </Provider>
      </React.StrictMode>,
      price,
  );
}

function getBookValue(node: HTMLElement, key: keyof Book): string | null {
  return node.querySelector(`.${key} .value`)?.textContent?.trim() || null;
}
