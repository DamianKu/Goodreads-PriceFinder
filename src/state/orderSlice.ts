import { createSlice } from '@reduxjs/toolkit';
import { KnownBookFormats } from '../types';

export type Order = { id: KnownBookFormats, visible: boolean }[];

export interface State {
  order: Order;
}

export const orderSlice = createSlice({
  name: 'order',
  initialState: {
    order: [
      {id: 'Paperback', visible: true},
      {id: 'Hardcover', visible: true},
      {id: 'Kindle Edition', visible: true},
      {id: 'Audiobook', visible: true},
      {id: 'Audio CD', visible: true},
      {id: 'Spiral-bound', visible: true},
    ],
  } as State,
  reducers: {
    setNewOrder: (state, action: { type: string, payload: Order }) => {
      state.order = action.payload;
    },
  },
});

export const {setNewOrder} = orderSlice.actions;

export const selectOrder = (s: { order: State }) => s.order.order;

export default orderSlice.reducer;
