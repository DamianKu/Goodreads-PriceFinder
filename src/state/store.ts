import { combineReducers, configureStore, createListenerMiddleware } from '@reduxjs/toolkit';
import orderReducer from './orderSlice';
import booksReducer from './booksSlice';
import { localStorage } from "redux-persist-webextension-storage";
import { persistStore, persistReducer } from 'redux-persist'
import { wrapStore } from "webext-redux";

export const listenerMiddleware = createListenerMiddleware();

const orderStorageConfig = {
  key: 'gpf-order',
  storage: localStorage,
}

const rootReducer = combineReducers({
  order: persistReducer(orderStorageConfig, orderReducer),
  books: booksReducer
})

export const store = configureStore({
  reducer: rootReducer,
  middleware: getDefaultMiddleware => getDefaultMiddleware()
      .prepend(listenerMiddleware.middleware)
});
wrapStore(store);
persistStore(store)
