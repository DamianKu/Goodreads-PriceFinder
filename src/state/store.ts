import { configureStore, createListenerMiddleware } from '@reduxjs/toolkit';
import orderReducer from './orderSlice';
import booksReducer from './booksSlice';

export const listenerMiddleware = createListenerMiddleware();

export default configureStore({
  reducer: {
    order: orderReducer,
    books: booksReducer,
  },
  middleware: getDefaultMiddleware => getDefaultMiddleware()
      .prepend(listenerMiddleware.middleware)
});
