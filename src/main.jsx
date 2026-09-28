import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App.jsx';
import { initDatabase, query } from './database/db.js';
import './styles/tokens.css';
import './styles/global.css';

function showBanner(message, ok = false) {
  const el = document.createElement('div');
  el.style.cssText =
    'position:fixed;top:0;left:0;right:0;padding:10px;font-size:12px;z-index:9999;direction:rtl;white-space:pre-wrap;color:#fff;background:' +
    (ok ? '#1f5c3a' : '#7a1f1f');
  el.textContent = message;
  document.body.appendChild(el);
  if (ok) setTimeout(() => el.remove(), 4000);
}

window.addEventListener('error', (e) => showBanner('خطأ: ' + (e.message || e.error)));
window.addEventListener('unhandledrejection', (e) =>
  showBanner('خطأ غير معالج: ' + (e.reason?.message || e.reason))
);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>
);

const timeout = new Promise((_, reject) =>
  setTimeout(() => reject(new Error('انتهت مهلة تهيئة قاعدة البيانات (8 ثوانٍ)')), 8000)
);

Promise.race([initDatabase(), timeout])
  .then(async () => {
    const rows = await query("SELECT COUNT(*) AS c FROM sqlite_master WHERE type='table'");
    showBanner('قاعدة البيانات تعمل ✓ (' + rows[0].c + ' جدولًا)', true);
  })
  .catch((err) => showBanner('قاعدة البيانات: ' + (err?.message || String(err))));
