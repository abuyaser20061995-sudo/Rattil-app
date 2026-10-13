import { useEffect, useState } from 'react';
import { BookOpen, Brain, RotateCcw, Headphones } from 'lucide-react';
import { getWeeklyStats } from '../database/stats.js';
import styles from './Progress.module.css';

export default function ProgressPage() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getWeeklyStats().then(setStats).catch((e) => setError(e?.message || String(e)));
  }, []);

  if (error) {
    return (
      <div className={styles.page}>
        <p className={styles.error}>{error}</p>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>تقدمي</h1>

      <div className={`card ${styles.row}`}>
        <BookOpen size={20} color="var(--color-primary)" />
        <div className={styles.rowText}>
          <p className={styles.label}>القراءة (الصلاة)</p>
          <p className="text-muted">{stats.prayerReadingsThisWeek} قراءة هذا الأسبوع</p>
        </div>
      </div>

      <div className={`card ${styles.row}`}>
        <Brain size={20} color="var(--color-primary)" />
        <div className={styles.rowText}>
          <p className={styles.label}>الحفظ</p>
          <p className="text-muted">
            {stats.memorizedAyahs} آية عبر {stats.memorizedSegments} مقطع — {stats.masteredSegments} منها متقنة
          </p>
        </div>
      </div>

      <div className={`card ${styles.row}`}>
        <RotateCcw size={20} color="var(--color-primary)" />
        <div className={styles.rowText}>
          <p className={styles.label}>المراجعة</p>
          <p className="text-muted">{stats.reviewedAyahsThisWeek} آية رُوجعت هذا الأسبوع</p>
        </div>
      </div>

      <div className={`card ${styles.row}`}>
        <Headphones size={20} color="var(--color-text-muted)" />
        <div className={styles.rowText}>
          <p className={styles.label}>الاستماع</p>
          <p className="text-muted">لم يُفعَّل بعد — بانتظار مشغّل الصوت</p>
        </div>
      </div>

      <p className="text-muted" style={{ textAlign: 'center', marginTop: 8 }}>
        إحصائية القراءة في المصحف نفسه (عدد الصفحات) ستُضاف عند ربط سجل قراءة عام بالمصحف.
      </p>
    </div>
  );
}
