import { createSelector, createSlice } from '@reduxjs/toolkit';
import { KnownBookFormats } from '../types';

export type Order = { id: KnownBookFormats, visible: boolean }[];

export interface State {
  order: Order;
  showUnknownFormats: boolean;
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
    showUnknownFormats: true,
  } as State,
  reducers: {
    setNewOrder: (state, action: { type: string, payload: Order }) => {
      state.order = action.payload;
    },
    setShowUnknownFormats: (state, action: { type: string, payload: boolean }) => {
      state.showUnknownFormats = action.payload;
    }
  },
});

export const {setNewOrder, setShowUnknownFormats} = orderSlice.actions;

export const selectOrder = (s: { order: State }) => s.order?.order;

export const selectVisibleOrder = createSelector(
    selectOrder,
    order => (order || []).filter(el => el.visible)
);

export const selectShowUnknownFormats = (s: { order: State }) => s.order.showUnknownFormats;

export default orderSlice.reducer;
