import { combineReducers, configureStore, createListenerMiddleware } from '@reduxjs/toolkit';
import settingsReducer from './settingsSlice';
import booksReducer from './booksSlice';
import { localStorage } from "redux-persist-webextension-storage";
import { persistStore, persistReducer } from 'redux-persist'
import { wrapStore } from "webext-redux";

export const listenerMiddleware = createListenerMiddleware();

const settingsStorageConfig = {
  key: 'gpf-order',
  storage: localStorage,
}

const rootReducer = combineReducers({
  settings: persistReducer(settingsStorageConfig, settingsReducer),
  books: booksReducer
})

export const store = configureStore({
  reducer: rootReducer,
  middleware: getDefaultMiddleware => getDefaultMiddleware()
      .prepend(listenerMiddleware.middleware)
});
wrapStore(store);
persistStore(store)
