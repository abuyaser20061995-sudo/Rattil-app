import { getDb, query } from './db.js';

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

function weekAgoIso() {
  return new Date(Date.now() - 7 * 86400000).toISOString();
}

export async function getWeeklyStats() {
  await ready();
  const since = weekAgoIso();

  // آيات الحفظ: مجموع آيات كل المقاطع التي مستواها غير "جديد"
  const memoRows = await query(
    "SELECT start_ayah, end_ayah FROM memorization WHERE level != 'new'"
  );
  const memorizedAyahs = memoRows.reduce((sum, r) => sum + (r.end_ayah - r.start_ayah + 1), 0);

  // آيات رُوجعت هذا الأسبوع: من جلسات المراجعة المسجّلة
  const reviewRows = await query(
    `SELECT m.start_ayah, m.end_ayah FROM review_items ri
     JOIN memorization m ON m.id = ri.memorization_id
     JOIN review_sessions s ON s.id = ri.session_id
     WHERE s.started_at >= ?`,
    [since]
  );
  const reviewedAyahs = reviewRows.reduce((sum, r) => sum + (r.end_ayah - r.start_ayah + 1), 0);

  // صفحات مقروءة: من سجل قراءات الصلاة هذا الأسبوع (تقريب أولي بانتظار سجل قراءة عام للمصحف)
  const prayerRows = await query(
    'SELECT COUNT(*) AS c FROM prayer_readings WHERE date >= ?',
    [since]
  );

  const totalMemorizedSegments = await query("SELECT COUNT(*) AS c FROM memorization WHERE level != 'new'");
  const masteredSegments = await query("SELECT COUNT(*) AS c FROM memorization WHERE level = 'mastered'");

  return {
    memorizedAyahs,
    reviewedAyahsThisWeek: reviewedAyahs,
    prayerReadingsThisWeek: prayerRows[0]?.c || 0,
    memorizedSegments: totalMemorizedSegments[0]?.c || 0,
    masteredSegments: masteredSegments[0]?.c || 0
  };
}
