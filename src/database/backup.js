import { getDb, query, run } from './db.js';

// جداول بيانات المستخدم فقط (لا نُصدّر نص القرآن نفسه، فهو ثابت ولا يحتاج نسخًا)
const TABLES = [
  'user_settings',
  'bookmarks',
  'collections',
  'collection_items',
  'notes',
  'memorization',
  'review_sessions',
  'review_items',
  'reading_sessions',
  'goals',
  'daily_wird',
  'prayer_readings',
  'prayer_suggestions',
  'achievements',
  'last_position'
];

const BACKUP_VERSION = 1;

async function ready() {
  for (let i = 0; i < 50; i++) {
    try {
      getDb();
      return;
    } catch {
      await new Promise((r) => setTimeout(r, 200));
    }
  }
  throw new Error('قاعدة البيانات غير جاهزة');
}

export async function exportBackup() {
  await ready();
  const tables = {};
  for (const name of TABLES) {
    tables[name] = await query('SELECT * FROM ' + name);
  }
  return {
    app: 'rattil',
    backupVersion: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    tables
  };
}

function validate(data) {
  if (!data || typeof data !== 'object') throw new Error('الملف ليس بصيغة صحيحة');
  if (data.app !== 'rattil') throw new Error('هذا الملف ليس نسخة احتياطية من رتِّل');
  if (!data.tables || typeof data.tables !== 'object') throw new Error('الملف لا يحتوي على بيانات صالحة');
}

export async function importBackup(data) {
  await ready();
  validate(data);
  const db = getDb();

  await db.execute('BEGIN TRANSACTION');
  try {
    for (const name of TABLES) {
      const rows = data.tables[name];
      if (!Array.isArray(rows)) continue;

      await run('DELETE FROM ' + name);

      for (const row of rows) {
        const cols = Object.keys(row);
        if (cols.length === 0) continue;
        const placeholders = cols.map(() => '?').join(', ');
        const sql = 'INSERT INTO ' + name + ' (' + cols.join(', ') + ') VALUES (' + placeholders + ')';
        await run(sql, cols.map((c) => row[c]));
      }
    }
    await db.execute('COMMIT');
  } catch (err) {
    await db.execute('ROLLBACK');
    throw err;
  }

  return {
    tablesRestored: Object.keys(data.tables).filter((t) => Array.isArray(data.tables[t])).length
  };
}
