import React, { useState } from 'react';
import { ItemInterface, ReactSortable, Store } from 'react-sortablejs';
import { KnownBookFormats } from '../../types';
import './App.css';

const DEFAULT_ORDER: { id: KnownBookFormats, visible: boolean }[] = [
  {id: 'Paperback', visible: true},
  {id: 'Hardcover', visible: true},
  {id: 'Kindle Edition', visible: true},
  {id: 'Audiobook', visible: true},
  {id: 'Audio CD', visible: true},
  {id: 'Spiral-bound', visible: true},
];

function App() {
  const [order, setOrder] = useState(DEFAULT_ORDER as ItemInterface[]);
  const [isDragging, setIsDragging] = useState(false);

  const onSetList = (newOrder: ItemInterface[], _: unknown, {dragging}: Store) => {
    if (!dragging) return;

    const isSame = newOrder.every((v, i) => v.id === order[i].id);
    if (isSame) return;

    setOrder(newOrder);
  };

  return (
      <div className="root">
        <header>
          <h1 draggable="true">Goodreads PriceFinder</h1>
        </header>
        <ReactSortable handle=".handle"
                       chosenClass="chosen-class"
                       dragClass="drag-class"
                       className={`formats ${isDragging ? 'dragging' : ''}`}
                       animation={300}
                       list={order}
                       setList={onSetList}
                       onChoose={() => setIsDragging(true)}
                       onUnchoose={() => setIsDragging(false)}
        >
          {order.map((item) => (
              <div className={`format ${item.visible ? '' : 'hidden'}`} key={item.id}>
                <span className="handle">☰</span>
                <span>{item.id}</span>
                <span className="visibility">HIDE/SHOW</span>
              </div>
          ))}
        </ReactSortable>
      </div>
  );
}

export default App;
