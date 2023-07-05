import { createSlice } from '@reduxjs/toolkit';
import { Book, Prices } from '../types';

export interface BookState {
  book: Book,
  prices: Prices | null,
  loading: boolean,
  error: string | null,
}

export interface State {
  books: Record<string, BookState>;
}

export const booksSlice = createSlice({
  name: 'books',
  initialState: {
    books: {},
  } as State,
  reducers: {
    addBook: (state, action: { type: string, payload: { id: string, book: Book } }) => {
      state.books[action.payload.id] = {
        book: action.payload.book,
        loading: true,
        error: null,
        prices: null,
      };
    },
    retrievedBookPriceSuccess: (state, action: { type: string, payload: { id: string, prices: Prices } }) => {
      state.books[action.payload.id] = {
        ...state.books[action.payload.id],
        prices: action.payload.prices,
        loading: false,
        error: null,
      };
    },
    retrievedBookPriceError: (state, action: { type: string, payload: { id: string, error: string } }) => {
      state.books[action.payload.id] = {
        ...state.books[action.payload.id],
        loading: false,
        error: action.payload.error,
      };
    },
  },
});

export const {addBook, retrievedBookPriceSuccess, retrievedBookPriceError} = booksSlice.actions;

export const selectBook = (id: string) => (store: { books: State }) => {
  return store.books.books[id];
};

export default booksSlice.reducer;
