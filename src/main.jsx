import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { defineCustomElements as jeepSqlite } from 'jeep-sqlite/loader';
import App from './App.jsx';
import { initDatabase } from './database/db.js';
import './styles/tokens.css';
import './styles/global.css';

jeepSqlite(window);

async function bootstrap() {
  try {
    await initDatabase();
  } catch (err) {
    console.error('DB init failed (متوقع مؤقتًا على المتصفح):', err);
  }

  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(
    <React.StrictMode>
      <HashRouter>
        <App />
      </HashRouter>
    </React.StrictMode>
  );
}

bootstrap();
