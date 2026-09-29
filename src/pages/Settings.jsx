import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { getSettings, updateAndApply } from '../database/settings.js';
import { run } from '../database/db.js';
import styles from './Settings.module.css';

const THEMES = [
  { key: 'light', label: 'فاتح' },
  { key: 'dark', label: 'داكن' },
  { key: 'auto', label: 'تلقائي' }
];

const DURATIONS = [
  { key: 'short', label: 'قصيرة' },
  { key: 'medium', label: 'متوسطة' },
  { key: 'long', label: 'طويلة' }
];

const REPEAT_DAYS = [7, 14, 30, 60];

export default function SettingsPage() {
  const [settings, setSettings] = useState(null);
  const [confirmingWipe, setConfirmingWipe] = useState(false);
  const [wiped, setWiped] = useState(false);

  useEffect(() => {
    getSettings().then(setSettings);
  }, []);

  async function set(patch) {
    setSettings((s) => ({ ...s, ...patch }));
    await updateAndApply(patch);
  }

  async function wipeAllData() {
    const tables = [
      'bookmarks', 'collections', 'collection_items', 'notes', 'memorization',
      'review_sessions', 'review_items', 'reading_sessions', 'goals', 'daily_wird',
      'prayer_readings', 'prayer_suggestions', 'achievements'
    ];
    for (const t of tables) {
      await run('DELETE FROM ' + t);
    }
    setConfirmingWipe(false);
    setWiped(true);
  }

  if (!settings) return null;

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>الإعدادات</h1>

      <section className={`card ${styles.section}`}>
        <p className={styles.sectionTitle}>المصحف</p>
        <div className={styles.fontRow}>
          <span className="text-muted">حجم الخط</span>
          <div className={styles.fontControls}>
            <button
              className={styles.fontBtn}
              onClick={() => set({ font_size: Math.max(16, settings.font_size - 2) })}
            >
              أصغر
            </button>
            <span className={styles.fontValue}>{settings.font_size}</span>
            <button
              className={styles.fontBtn}
              onClick={() => set({ font_size: Math.min(40, settings.font_size + 2) })}
            >
              أكبر
            </button>
          </div>
        </div>
      </section>

      <section className={`card ${styles.section}`}>
        <p className={styles.sectionTitle}>المظهر</p>
        <div className={styles.grid3}>
          {THEMES.map((t) => (
            <button
              key={t.key}
              className={settings.theme === t.key ? styles.choiceActive : styles.choice}
              onClick={() => set({ theme: t.key })}
            >
              {t.label}
            </button>
          ))}
        </div>
      </section>

      <section className={`card ${styles.section}`}>
        <p className={styles.sectionTitle}>ماذا أقرأ؟</p>
        <p className="text-muted" style={{ marginBottom: 8 }}>مدة القراءة الافتراضية</p>
        <div className={styles.grid3}>
          {DURATIONS.map((d) => (
            <button
              key={d.key}
              className={settings.default_reading_duration === d.key ? styles.choiceActive : styles.choice}
              onClick={() => set({ default_reading_duration: d.key })}
            >
              {d.label}
            </button>
          ))}
        </div>
        <p className="text-muted" style={{ margin: '12px 0 8px' }}>فترة منع التكرار</p>
        <div className={styles.grid4}>
          {REPEAT_DAYS.map((d) => (
            <button
              key={d}
              className={settings.prevent_repeat_days === d ? styles.choiceActive : styles.choice}
              onClick={() => set({ prevent_repeat_days: d })}
            >
              {d} يومًا
            </button>
          ))}
        </div>
      </section>

      <section className={`card ${styles.section}`}>
        <p className={styles.sectionTitle}>البيانات</p>
        <Link to="/backup" className="btn-secondary" style={{ textAlign: 'center' }}>
          النسخ الاحتياطي (تصدير / استيراد)
        </Link>

        {!confirmingWipe ? (
          <button className={styles.dangerBtn} onClick={() => setConfirmingWipe(true)}>
            <Trash2 size={16} /> حذف كل البيانات
          </button>
        ) : (
          <div className={styles.confirmBox}>
            <p className={styles.warning}>
              ⚠️ سيُحذف كل شيء (الحفظ، المراجعة، آياتي، المقترحات) نهائيًا. صدّر نسخة احتياطية أولًا إن أردت الاحتفاظ بها.
            </p>
            <div className={styles.row}>
              <button className={styles.dangerBtn} style={{ flex: 1 }} onClick={wipeAllData}>
                نعم، احذف كل شيء
              </button>
              <button className="btn-secondary" onClick={() => setConfirmingWipe(false)}>
                إلغاء
              </button>
            </div>
          </div>
        )}
        {wiped && <p className="text-muted">تم حذف البيانات. أعد تحميل الصفحة.</p>}
      </section>
    </div>
  );
}
