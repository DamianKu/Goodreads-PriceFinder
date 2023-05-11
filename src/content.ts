import { BookData } from './types';

const table = document.querySelector('#books')!; // TODO deal with non existing #books

const priceHeader = insertPriceCell(table.querySelector<HTMLTableRowElement>('#booksHeader')!); // TODO deal with non existing #booksHeader
priceHeader.outerHTML = '<th class="header field">price</th>';

[...table.querySelectorAll<HTMLTableRowElement>('.bookalike')].forEach(row => handleBookRow(row));

new MutationObserver(mutations => {
  for (let {target, addedNodes: [node]} of mutations) {
    if ((target as HTMLElement).tagName !== 'TBODY' || node.nodeType !== document.ELEMENT_NODE) continue;

    handleBookRow(node as HTMLTableRowElement);
  }
}).observe(table, {childList: true, subtree: true});

function insertPriceCell(node: HTMLTableRowElement) {
  return node.insertCell(node.childElementCount - 1);
}

function handleBookRow(node: HTMLTableRowElement) {
  const price = insertPriceCell(node);
  price.classList.add('field');
  price.innerHTML = '...'; // TODO use spinner?

  const bookData: BookData = {
    author: getBookDataValue(node, 'author')!.replace(/[\n*]/g, '').trim(),
    title: getBookDataValue(node, 'title')!,
    asin: getBookDataValue(node, 'asin'),
    isbn: getBookDataValue(node, 'isbn'),
    isbn13: getBookDataValue(node, 'isbn13'),
  };

  chrome.runtime.sendMessage(bookData, bookPrice => price.innerHTML = bookPrice);
}

function getBookDataValue(node: HTMLElement, key: keyof BookData): string | null {
  return node.querySelector(`.${key} .value`)?.textContent?.trim() || null;
}


export {};
