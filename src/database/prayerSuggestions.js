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
