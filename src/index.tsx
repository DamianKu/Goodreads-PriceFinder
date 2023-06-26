import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { Store } from 'webext-redux';
import App from './views/Popup/App';

const store = new Store();
Object.assign(store, {
  dispatch: store.dispatch.bind(store),
  getState: store.getState.bind(store),
  subscribe: store.subscribe.bind(store),
});

// wait for the store to connect to the background page
store.ready().then(() => {
  ReactDOM.render(
      <React.StrictMode>
        <Provider store={store}>
          <App />
        </Provider>
      </React.StrictMode>,
      document.getElementById('root'),
  );
});

