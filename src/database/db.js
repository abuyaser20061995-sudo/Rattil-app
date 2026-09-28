import { CapacitorSQLite, SQLiteConnection } from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';
import { CREATE_TABLES_SQL, DEFAULT_SETTINGS_SQL, SCHEMA_VERSION } from './schema.js';

const DB_NAME = 'rattil_db';
const WEB_KEY = 'rattil_web_db_v1';
let db = null;

function bytesToBase64(bytes) {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function base64ToBytes(b64) {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

// نسخة المتصفح (للمعاينة فقط): sql.js + حفظ في localStorage
async function createWebDatabase() {
  const mod = await import('sql.js');
  const initSqlJs = mod.default || mod;
  const SQL = await initSqlJs({ locateFile: (file) => `/assets/${file}` });

  let saved = null;
  try {
    const stored = localStorage.getItem(WEB_KEY);
    if (stored) saved = base64ToBytes(stored);
  } catch (e) {
    console.warn('تعذر قراءة القاعدة المحفوظة', e);
  }

  const raw = new SQL.Database(saved || undefined);
  let timer = null;

  function scheduleSave() {
    clearTimeout(timer);
    timer = setTimeout(() => {
      try {
        localStorage.setItem(WEB_KEY, bytesToBase64(raw.export()));
      } catch (e) {
        console.warn('تعذر حفظ القاعدة', e);
      }
    }, 400);
  }

  return {
    async open() {},
    async execute(sql) {
      raw.exec(sql);
      scheduleSave();
      return {};
    },
    async run(sql, params = []) {
      raw.run(sql, params);
      const id = raw.exec('SELECT last_insert_rowid()')[0].values[0][0];
      scheduleSave();
      return { changes: { changes: raw.getRowsModified(), lastId: id } };
    },
    async query(sql, params = []) {
      const stmt = raw.prepare(sql);
      stmt.bind(params);
      const rows = [];
      while (stmt.step()) rows.push(stmt.getAsObject());
      stmt.free();
      return { values: rows };
    }
  };
}

// نسخة أندرويد: SQLite الأصلي
async function createNativeDatabase() {
  const sqlite = new SQLiteConnection(CapacitorSQLite);
  const isConn = (await sqlite.isConnection(DB_NAME, false)).result;
  return isConn
    ? await sqlite.retrieveConnection(DB_NAME, false)
    : await sqlite.createConnection(DB_NAME, false, 'no-encryption', SCHEMA_VERSION, false);
}

export async function initDatabase() {
  db = Capacitor.getPlatform() === 'web'
    ? await createWebDatabase()
    : await createNativeDatabase();

  await db.open();
  await db.execute(CREATE_TABLES_SQL);
  await db.execute(DEFAULT_SETTINGS_SQL);
  return db;
}

export function getDb() {
  if (!db) throw new Error('Database not initialized — call initDatabase() first');
  return db;
}

export async function query(sql, params = []) {
  const result = await getDb().query(sql, params);
  return result.values || [];
}

export async function run(sql, params = []) {
  return getDb().run(sql, params);
}

export async function isQuranDataLoaded() {
  const rows = await query('SELECT COUNT(*) as c FROM ayahs');
  return (rows[0]?.c || 0) > 0;
}
