import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addBook, retrieveBookPrice, selectBook } from '../../state/booksSlice';
import {
  Order,
  selectDomain,
  selectOrder,
  selectShowUnknownFormats,
  selectVisibleOrder
} from '../../state/settingsSlice';
import { Book } from '../../types';
import './App.css';
import { createBookId } from "../../id";

function getPriority(order: Order, key: string): number {
  const i = order.findIndex(e => e.id === key);
  return i === -1 ? Infinity : i;
}

function App({book}: { book: Book }) {
  const domain = useSelector(selectDomain);
  const [id, setId] = useState(createBookId(book, domain));
  const order: Order = useSelector(selectOrder);
  const visibleOrder: Order = useSelector(selectVisibleOrder);
  const dispatch = useDispatch();
  const bookData = useSelector(selectBook(id));
  const [sortedPrices, setSortedPrices] = useState(bookData?.prices);
  const [expanded, setExpanded] = useState(false);
  const showUnknownFormats = useSelector(selectShowUnknownFormats);

  useEffect(() => {
    setId(createBookId(book, domain));
  }, [domain, book]);

  useEffect(() => {
    dispatch(addBook({id, book}));
  }, [dispatch, id, book]);

  useEffect(() => {
    if (bookData?.prices) {
      const prices = bookData.prices
          .filter(el => {
            const format = order.find(f => f.id === el.format);
            return format === undefined && showUnknownFormats ? true : format?.visible;
          })
          .sort((a, b) => getPriority(visibleOrder, a.format) - getPriority(visibleOrder, b.format))

      setSortedPrices(prices);
    }
  }, [bookData, order, visibleOrder, showUnknownFormats]);

  if (!bookData || bookData.loading) {
    return (<span className="loader"></span>);
  }

  if (bookData.error) {
    return (
        <span data-gpf-tooltip={`"${bookData.error}". Click to retry`}
              onClick={() => dispatch(retrieveBookPrice({id, book}))}>🚩</span>
    )
  }

  if (!sortedPrices || sortedPrices.length === 0) {
    return (<span>Not found</span>);
  }

  const firstPrice = sortedPrices[0];
  let warning;
  if (firstPrice.format !== visibleOrder[0]?.id) {
    warning = <span
        data-gpf-tooltip={`"${visibleOrder[0]?.id}" is not available. The price shown is for a "${firstPrice.format}"`}>⚠️</span>;
  }

  return (
      <>
        <label>price</label>
        <div className="value">
          <div className="gpf-value">
            <div className="gpf-value-price-wrapper">
              <a href={firstPrice.url} target="_blank" rel="noopener noreferrer">{firstPrice.value}</a>
              {warning ?? ''}
            </div>
            <span className="gpf-label" title="More buy options" onClick={() => setExpanded(!expanded)}>&#128722;</span>
          </div>
          <div className="gpf-prices">
            <div className={`gpf-prices-boxes ${expanded ? 'expanded' : ''}`}>
              <div className="gpf-prices-list">
                <ul>{sortedPrices.map(p => {
                  return <li><a href={p.url} target="_blank"
                                rel="noopener noreferrer"><span>{p.value}</span><span>{p.format}</span></a></li>;
                })}</ul>
              </div>
            </div>
          </div>
        </div>
      </>
  );
}

export default App;

