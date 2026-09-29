import { getDb, query, run } from './db.js';

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

export async function logPrayerReading(prayer, surahId, start, end) {
  await ready();
  await run(
    'INSERT INTO prayer_readings (date, prayer, surah_id, start_ayah, end_ayah) VALUES (?, ?, ?, ?, ?)',
    [new Date().toISOString(), prayer, surahId, start, end]
  );
}

export async function listPrayerReadings(limit = 50) {
  await ready();
  return query('SELECT * FROM prayer_readings ORDER BY id DESC LIMIT ?', [limit]);
}

export async function recentlyReadKeys(days) {
  await ready();
  const since = new Date(Date.now() - days * 86400000).toISOString();
  const rows = await query('SELECT surah_id, start_ayah, end_ayah FROM prayer_readings WHERE date >= ?', [since]);
  return new Set(rows.map((r) => r.surah_id + ':' + r.start_ayah + '-' + r.end_ayah));
}
