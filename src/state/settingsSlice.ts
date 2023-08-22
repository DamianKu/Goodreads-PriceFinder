import { createSelector, createSlice } from '@reduxjs/toolkit';
import { KnownBookFormats } from '../types';

export type Order = { id: KnownBookFormats, visible: boolean }[];

export interface State {
  order: Order;
  showUnknownFormats: boolean;
}

const initialState: State = {
  order: [
    {id: 'Paperback', visible: true},
    {id: 'Hardcover', visible: true},
    {id: 'Kindle', visible: true},
    {id: 'Audiobook', visible: true},
    {id: 'Audio CD', visible: true},
    {id: 'Spiral-bound', visible: true},
  ],
  showUnknownFormats: true,
}

export const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setNewOrder: (state, action: { type: string, payload: Order }) => {
      state.order = action.payload;
    },
    setShowUnknownFormats: (state, action: { type: string, payload: boolean }) => {
      state.showUnknownFormats = action.payload;
    }
  },
});

export const {setNewOrder, setShowUnknownFormats} = settingsSlice.actions;

export const selectOrder = ({settings}: { settings: State }) => settings.order;

export const selectVisibleOrder = createSelector(
    selectOrder,
    order => order.filter(el => el.visible)
);

export const selectShowUnknownFormats = ({settings}: { settings: State }) => settings.showUnknownFormats;

export default settingsSlice.reducer;
