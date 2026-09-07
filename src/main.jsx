import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

// El service worker solo se registra en la build de producción — en desarrollo (npm run dev)
// causaba que se sirvieran archivos cacheados viejos en vez de tus cambios más recientes.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      /* si falla el registro, la app sigue funcionando normal, solo sin modo offline */
    });
  });
}
