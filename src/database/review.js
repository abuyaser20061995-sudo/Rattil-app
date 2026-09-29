import { run } from './db.js';
import { listAllSegments } from './memorization.js';

const DAY = 86400000;

// بعد كم يوم يعود المقطع للمراجعة، حسب مستواه (يمكن تعديلها لاحقًا)
export const INTERVAL_DAYS = { weak: 1, needs_review: 2, good: 4, mastered: 10 };

// وزن المستوى في الأولوية: الأضعف أولاً
const LEVEL_WEIGHT = { weak: 40, needs_review: 30, good: 15, mastered: 5 };

function daysSince(iso) {
  if (!iso) return null;
  const t = Date.parse(iso);
  return Number.isNaN(t) ? null : Math.max(0, (Date.now() - t) / DAY);
}

// هل حان وقت مراجعة المقطع؟
export function isDue(seg) {
  if (seg.level === 'new') return false;
  const since = daysSince(seg.last_review);
  if (since === null) return true;
  return since >= (INTERVAL_DAYS[seg.level] ?? 1);
}

// الأولوية = وزن المستوى + قِدَم آخر مراجعة + عدد الأخطاء + معدل الفشل
export function priorityOf(seg) {
  const since = daysSince(seg.last_review) ?? daysSince(seg.memorized_at) ?? 0;
  const age = Math.min(since, 30) * 2;
  const mistakes = Math.min(seg.mistake_count || 0, 10) * 1.5;
  const failRate = (seg.review_count || 0) > 0 ? (1 - (seg.success_rate || 0)) * 20 : 0;
  return (LEVEL_WEIGHT[seg.level] || 0) + age + mistakes + failRate;
}

export async function getTodayReview() {
  const all = await listAllSegments();
  return all
    .filter(isDue)
    .map((s) => ({ ...s, priority: priorityOf(s) }))
    .sort((a, b) => b.priority - a.priority);
}

export async function startSession() {
  const res = await run('INSERT INTO review_sessions (started_at, type) VALUES (?, ?)', [
    new Date().toISOString(),
    'review'
  ]);
  return res.changes.lastId;
}

export async function recordResult(sessionId, seg, result) {
  const success = result === 'good' || result === 'mastered';
  const mistake = result === 'weak' || result === 'needs_review';
  const count = seg.review_count || 0;
  const rate = ((seg.success_rate || 0) * count + (success ? 1 : 0)) / (count + 1);

  await run(
    `UPDATE memorization
     SET level = ?, last_review = ?, review_count = ?, mistake_count = ?, success_rate = ?
     WHERE id = ?`,
    [
      result,
      new Date().toISOString(),
      count + 1,
      (seg.mistake_count || 0) + (mistake ? 1 : 0),
      rate,
      seg.id
    ]
  );
  await run(
    'INSERT INTO review_items (session_id, memorization_id, result, mistakes) VALUES (?, ?, ?, ?)',
    [sessionId, seg.id, result, mistake ? 1 : 0]
  );
}

export async function endSession(sessionId) {
  await run('UPDATE review_sessions SET ended_at = ? WHERE id = ?', [
    new Date().toISOString(),
    sessionId
  ]);
}

// إضافة مقطع مباشرة للمراجعة دون المرور بمستوى "جديد"
// النتيجة: 'added' | 'promoted' | 'exists'
export async function addToReview(surahId, ayahCount, start, end) {
  if (!Number.isInteger(start) || !Number.isInteger(end)) {
    throw new Error('أدخل أرقام آيات صحيحة');
  }
  if (start < 1 || end > ayahCount || start > end) {
    throw new Error('النطاق غير صحيح (السورة فيها ' + ayahCount + ' آيات)');
  }

  const all = await listAllSegments();
  const overlaps = all.filter(
    (s) => s.surah_id === surahId && s.start_ayah <= end && s.end_ayah >= start
  );

  if (overlaps.length === 0) {
    await run(
      `INSERT INTO memorization (surah_id, start_ayah, end_ayah, level, memorized_at)
       VALUES (?, ?, ?, 'needs_review', ?)`,
      [surahId, start, end, new Date().toISOString()]
    );
    return 'added';
  }

  const same =
    overlaps.length === 1 && overlaps[0].start_ayah === start && overlaps[0].end_ayah === end;

  if (same && overlaps[0].level === 'new') {
    await run("UPDATE memorization SET level = 'needs_review' WHERE id = ?", [overlaps[0].id]);
    return 'promoted';
  }
  if (same) return 'exists';

  throw new Error('هذا النطاق يتداخل مع مقطع موجود في الحفظ. عدّله من تبويب الحفظ.');
}
