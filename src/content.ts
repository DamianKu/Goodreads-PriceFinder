import { Book, Price } from './types';

const table = document.querySelector('#books')!; // TODO deal with non existing #books

const priceHeader = insertPriceCell(table.querySelector<HTMLTableRowElement>('#booksHeader')!); // TODO deal with non existing #booksHeader
priceHeader.outerHTML = '<th class="header field gpf-plugin-price">price</th>';

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
  price.classList.add('field', 'gpf-plugin-price');
  price.innerHTML = '...';

  const book: Book = {
    author: getBookValue(node, 'author')!.replace(/[\n*]/g, '').trim(),
    title: getBookValue(node, 'title')!,
    asin: getBookValue(node, 'asin'),
    isbn: getBookValue(node, 'isbn'),
    isbn13: getBookValue(node, 'isbn13'),
  };

  chrome.runtime.sendMessage(book, (bookPrice: Price) => {
    const prices = Object.entries(bookPrice).map(([type, price]) => `<li><a href='/'><span>${price}</span><span>${type}</span></a></li>`).reduce((acc, cur) => acc + cur, '');
    price.innerHTML = `
    <label>price</label>
    <div class="value">
      <div class="gpf-value">
        <a href="/">${bookPrice.Paperback || bookPrice.Hardcover}</a>
        <label class="gpf-label" for="${book.title}" title="More buy options">&#128722;</label>
      </div>
      <div class="gpf-prices">
        <input class="gpf-prices-input" type="checkbox" id="${book.title}">
        <div class="gpf-prices-boxes">
          <div class="gpf-prices-list">
            <ul>${prices}</ul>
          </div>
        </div>
      </div>
    </div>`
  });
}

function getBookValue(node: HTMLElement, key: keyof Book): string | null {
  return node.querySelector(`.${key} .value`)?.textContent?.trim() || null;
}
