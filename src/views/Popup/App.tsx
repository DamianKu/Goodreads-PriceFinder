import { faBars, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ItemInterface, ReactSortable, Store } from 'react-sortablejs';
import {
  Order, selectDomain,
  selectOrder,
  selectShowUnknownFormats,
  setNewOrder,
  setShowUnknownFormats,
  setDomain
} from '../../state/settingsSlice';
import './App.css';
import { domains } from "../../domains";
import { Domain } from "../../types";

function App() {
  const order: Order = useSelector(selectOrder);
  const dispatch = useDispatch();
  const [isDragging, setIsDragging] = useState(false);
  const showUnknownFormats = useSelector(selectShowUnknownFormats);
  const domain = useSelector(selectDomain);

  const onSetList = (newOrder: ItemInterface[], _: unknown, {dragging}: Store) => {
    if (!dragging) return;

    const isSame = newOrder.every((v, i) => v.id === order[i].id);
    if (isSame) return;

    dispatch(setNewOrder(newOrder as Order));
  };

  const toggleVisibility = (item: ItemInterface) => {
    const newOrder = [...order].map(f => f.id === item.id ? {...f, visible: !f.visible} : f);
    dispatch(setNewOrder(newOrder));
  };

  const toggleShowUnknown = () => {
    dispatch(setShowUnknownFormats(!showUnknownFormats));
  };

  return (
      <div className="root">
        <header>
          <h1 draggable="true">Goodreads PriceFinder</h1>
        </header>

        <div className="domain">
          <h2>Domain</h2>
          <span>amazon.</span>
          <select value={domain} onChange={e => dispatch(setDomain(e.target.value as Domain))}>
            {domains.map(option => (
                <option value={option}>{option}</option>
            ))}
          </select>
        </div>
        <div className="divider"/>

        <h2>Order</h2>
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
                <span className="handle">
                  <FontAwesomeIcon icon={faBars}/>
                </span>
                <span>{item.id}</span>
                <span className="visibility" onClick={() => toggleVisibility(item)}>{
                  item.visible
                      ? <FontAwesomeIcon icon={faEye}/>
                      : <FontAwesomeIcon icon={faEyeSlash}/>
                }</span>
              </div>
          ))}
        </ReactSortable>
        <div className="divider"/>
        <div className="unknown_formats">
          <label>
            <input type="checkbox" checked={showUnknownFormats} onChange={toggleShowUnknown}/>
            Show unknown book formats?
          </label>
        </div>
      </div>
  );
}

export default App;
