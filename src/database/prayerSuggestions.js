import { getDb, query, run, withoutAutoSave } from './db.js';
import { listSurahs } from './quran.js';
import { TOPIC_PASSAGES } from '../data/topic-passages.js';

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

export async function listSuggestions() {
  await ready();
  return query('SELECT * FROM prayer_suggestions ORDER BY id');
}

export async function addSuggestion({ surahId, ayahCount, start, end, topics, lengthCategory, coherenceScore }) {
  await ready();
  if (!Number.isInteger(start) || !Number.isInteger(end) || start < 1 || end > ayahCount || start > end) {
    throw new Error('نطاق الآيات غير صحيح (السورة فيها ' + ayahCount + ' آيات)');
  }
  const ayahCountInSeg = end - start + 1;
  const estimated =
    ayahCountInSeg <= 5 ? '≈ 1-2 دقيقة' : ayahCountInSeg <= 15 ? '≈ 3-5 دقائق' : '≈ 6-10 دقائق';

  await run(
    `INSERT INTO prayer_suggestions
      (surah_id, start_ayah, end_ayah, ayah_count, word_count, estimated_duration, length_category, topics, coherence_score)
     VALUES (?, ?, ?, ?, NULL, ?, ?, ?, ?)`,
    [surahId, start, end, ayahCountInSeg, estimated, lengthCategory, topics, coherenceScore ?? 0.5]
  );
}

export async function deleteSuggestion(id) {
  await ready();
  await run('DELETE FROM prayer_suggestions WHERE id = ?', [id]);
}

const TOPICS_FLAG = 'rattil_topic_passages_v1';

function categoryOf(n) {
  return n <= 5 ? 'short' : n <= 15 ? 'medium' : 'long';
}

function durationOf(n) {
  return n <= 5 ? '≈ 1-2 دقيقة' : n <= 15 ? '≈ 3-5 دقائق' : '≈ 6-10 دقائق';
}

export async function ensureTopicPassages() {
  try {
    if (localStorage.getItem(TOPICS_FLAG) === '1') return 0;
  } catch { /* ignore */ }
  await ready();
  const surahs = await listSurahs();
  if (!surahs.length) return 0;
  const counts = new Map(surahs.map((s) => [s.number, s.ayah_count]));
  const rows = await query('SELECT surah_id, start_ayah, end_ayah FROM prayer_suggestions');
  const have = new Set(rows.map((r) => r.surah_id + ':' + r.start_ayah + '-' + r.end_ayah));
  let added = 0;
  await withoutAutoSave(async () => {
    for (const [s, from, to, topics] of TOPIC_PASSAGES) {
      const max = counts.get(s);
      if (!max || from < 1 || to > max || from > to) {
        console.warn('نطاق غير صالح', s, from, to);
        continue;
      }
      const key = s + ':' + from + '-' + to;
      if (have.has(key)) continue;
      have.add(key);
      const n = to - from + 1;
      await run(
        'INSERT INTO prayer_suggestions (surah_id, start_ayah, end_ayah, ayah_count, word_count, estimated_duration, length_category, topics, coherence_score) VALUES (?, ?, ?, ?, NULL, ?, ?, ?, 0.9)',
        [s, from, to, n, durationOf(n), categoryOf(n), topics]
      );
      added++;
    }
  });
  try { localStorage.setItem(TOPICS_FLAG, '1'); } catch { /* ignore */ }
  return added;
}

export async function pageOfAyah(surahNumber, ayahNumber) {
  await ready();
  const rows = await query(
    'SELECT a.page AS page FROM ayahs a JOIN surahs s ON s.id = a.surah_id WHERE s.number = ? AND a.ayah_number = ?',
    [surahNumber, ayahNumber]
  );
  return rows[0]?.page || null;
}
