export const LEVELS = [
  { key: 'new', label: 'جديد', emoji: '⚪' },
  { key: 'weak', label: 'ضعيف', emoji: '🔴' },
  { key: 'needs_review', label: 'يحتاج مراجعة', emoji: '🟠' },
  { key: 'good', label: 'جيد', emoji: '🟡' },
  { key: 'mastered', label: 'متقن', emoji: '🟢' }
];

// ترتيب "الأضعف أولاً" — يُستخدم للون السورة في الخريطة
export const WEAKEST_FIRST = ['weak', 'needs_review', 'new', 'good', 'mastered'];

export function levelEmoji(key) {
  return LEVELS.find((l) => l.key === key)?.emoji || '⚪';
}

export function levelLabel(key) {
  return LEVELS.find((l) => l.key === key)?.label || '';
}
