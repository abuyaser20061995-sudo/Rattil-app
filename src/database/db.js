import { CapacitorSQLite, SQLiteConnection } from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';
import { CREATE_TABLES_SQL, DEFAULT_SETTINGS_SQL, SCHEMA_VERSION } from './schema.js';

const DB_NAME = 'rattil_db';
let sqliteConnection = null;
let db = null;

export async function initDatabase() {
  sqliteConnection = new SQLiteConnection(CapacitorSQLite);

  if (Capacitor.getPlatform() === 'web') {
    const jeepEl = document.querySelector('jeep-sqlite');
    await customElements.whenDefined('jeep-sqlite');
    await jeepEl.initWebStore();
  }

  const isConn = (await sqliteConnection.isConnection(DB_NAME, false)).result;
  db = isConn
    ? await sqliteConnection.retrieveConnection(DB_NAME, false)
    : await sqliteConnection.createConnection(DB_NAME, false, 'no-encryption', SCHEMA_VERSION, false);

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
