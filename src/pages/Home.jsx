import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Brain, RotateCcw, Compass } from 'lucide-react';
import { getTodayReview } from '../database/review.js';
import styles from './Home.module.css';

export default function Home() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading');
  const [dueCount, setDueCount] = useState(0);

  useEffect(() => {
    document.title = 'رتِّل — الرئيسية';
    let alive = true;
    getTodayReview()
      .then((queue) => {
        if (!alive) return;
        setDueCount(queue.length);
        setStatus('ok');
      })
      .catch(() => alive && setStatus('error'));
    return () => {
      alive = false;
    };
  }, []);

  const reviewText =
    status === 'loading'
      ? 'جارٍ التحميل…'
      : status === 'error'
      ? 'تعذّر تحميل المراجعة'
      : dueCount === 0
      ? 'لا توجد مقاطع للمراجعة اليوم'
      : dueCount + ' مقطع يحتاج إلى مراجعة';

  return (
    <div className={styles.page}>
      <h1 className={styles.greeting}>السلام عليكم 👋</h1>

      <section className={`card ${styles.wirdCard}`}>
        <p className={styles.cardLabel}>وردك اليوم</p>
        <p className={styles.cardTitle}>لم يُحدَّد بعد</p>
        <button className="btn-primary" style={{ marginTop: 12, width: '100%' }}>
          حدّد ورد اليوم
        </button>
      </section>

      <section className={`card ${styles.row}`}>
        <BookOpen size={20} color="var(--color-primary)" />
        <div className={styles.rowText}>
          <p className={styles.cardLabel}>متابعة القراءة</p>
          <p className="text-muted">لا يوجد موضع محفوظ بعد</p>
        </div>
      </section>

      <section className={`card ${styles.row}`}>
        <RotateCcw size={20} color="var(--color-primary)" />
        <div className={styles.rowText}>
          <p className={styles.cardLabel}>مراجعة اليوم</p>
          <p className="text-muted">{reviewText}</p>
        </div>
        {status === 'ok' && dueCount > 0 && (
          <button className="btn-primary" onClick={() => navigate('/review')}>
            ابدأ
          </button>
        )}
      </section>

      <button className={styles.whatToRead} onClick={() => navigate('/what-to-read')}>
        <Compass size={22} />
        <span>ماذا أقرأ؟</span>
      </button>

      <section className={`card ${styles.row}`}>
        <Brain size={20} color="var(--color-primary)" />
        <div className={styles.rowText}>
          <p className={styles.cardLabel}>هدفك الأسبوعي</p>
          <p className="text-muted">لم يُحدَّد بعد</p>
        </div>
      </section>
    </div>
  );
}
