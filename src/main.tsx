import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { initPwa, onSwUpdate } from './utils/pwa';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);

// PWA: capture the install prompt + register the service worker (prod only, inside initPwa).
initPwa();
onSwUpdate(() => {
  window.dispatchEvent(new Event('spendly:sw-update'));
});
