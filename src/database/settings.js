import { getDb, query, run } from './db.js';

const DEFAULTS = {
  theme: 'auto',
  font_size: 24,
  mushaf_style: 'flow',
  daily_goal_pages: 5,
  prevent_repeat_days: 14,
  default_reading_duration: 'medium'
};

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

export async function getSettings() {
  await ready();
  const rows = await query('SELECT * FROM user_settings WHERE id = 1');
  return { ...DEFAULTS, ...(rows[0] || {}) };
}

export async function updateSettings(patch) {
  await ready();
  const cols = Object.keys(patch);
  if (cols.length === 0) return;
  const setClause = cols.map((c) => c + ' = ?').join(', ');
  await run('UPDATE user_settings SET ' + setClause + ' WHERE id = 1', cols.map((c) => patch[c]));
}

export function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === 'light' || theme === 'dark') {
    root.setAttribute('data-theme', theme);
  } else {
    root.removeAttribute('data-theme');
  }
}

export function applyFontSize(size) {
  document.documentElement.style.setProperty('--mushaf-font-size', size + 'px');
}

// تطبيق فوري بدون إعادة تحميل الصفحة، لاستخدامه من صفحة الإعدادات نفسها
export async function updateAndApply(patch) {
  await updateSettings(patch);
  if ('theme' in patch) applyTheme(patch.theme);
  if ('font_size' in patch) applyFontSize(patch.font_size);
}
