import { getDb, query, run } from './db.js';
import { WEAKEST_FIRST } from '../utils/levels.js';

// ملاحظة: surah_id هنا = رقم السورة (1..114). عند استيراد القرآن الحقيقي
// بالترتيب يتطابق id مع الرقم، فلا حاجة لتغيير شيء.

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

export async function listAllSegments() {
  await ready();
  return query('SELECT * FROM memorization ORDER BY surah_id, start_ayah');
}

export async function addSegment(surahId, ayahCount, start, end) {
  await ready();
  if (!Number.isInteger(start) || !Number.isInteger(end)) {
    throw new Error('أدخل أرقام آيات صحيحة');
  }
  if (start < 1 || end > ayahCount || start > end) {
    throw new Error('النطاق غير صحيح (السورة فيها ' + ayahCount + ' آيات)');
  }
  const overlap = await query(
    'SELECT id FROM memorization WHERE surah_id = ? AND start_ayah <= ? AND end_ayah >= ?',
    [surahId, end, start]
  );
  if (overlap.length > 0) {
    throw new Error('هذا النطاق يتداخل مع مقطع موجود');
  }
  await run(
    `INSERT INTO memorization (surah_id, start_ayah, end_ayah, level, memorized_at)
     VALUES (?, ?, ?, 'new', ?)`,
    [surahId, start, end, new Date().toISOString()]
  );
}

export function addAyahToMemorization(surahNumber, ayahCount, ayahNumber) {
  return addSegment(surahNumber, ayahCount, ayahNumber, ayahNumber);
}

export async function setLevel(id, level) {
  await ready();
  await run('UPDATE memorization SET level = ? WHERE id = ?', [level, id]);
}

export async function deleteSegment(id) {
  await ready();
  await run('DELETE FROM memorization WHERE id = ?', [id]);
}

// نسبة الحفظ = آيات المقاطع التي تجاوزت "جديد" ÷ عدد آيات السورة
export function summarize(segments, ayahCount) {
  const memorized = segments
    .filter((s) => s.level !== 'new')
    .reduce((sum, s) => sum + (s.end_ayah - s.start_ayah + 1), 0);
  const percent = ayahCount > 0 ? Math.round((memorized / ayahCount) * 100) : 0;
  const weakest = WEAKEST_FIRST.find((k) => segments.some((s) => s.level === k)) || null;
  const mastered = segments.filter((s) => s.level === "mastered").reduce((sum, s) => sum + (s.end_ayah - s.start_ayah + 1), 0);
  const masteredPercent = ayahCount > 0 ? Math.round((mastered / ayahCount) * 100) : 0;
  return { percent, masteredPercent, weakest };
}
