import { useEffect, useState } from 'react';
import { BookOpen, Brain, RotateCcw, Compass } from 'lucide-react';
import styles from './Home.module.css';

export default function Home() {
  const [greeting, setGreeting] = useState('السلام عليكم 👋');

  useEffect(() => {
    document.title = 'رتِّل — الرئيسية';
  }, []);

  return (
    <div className={styles.page}>
      <h1 className={styles.greeting}>{greeting}</h1>

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
          <p className="text-muted">لا توجد مقاطع للمراجعة بعد</p>
        </div>
      </section>

      <button className={styles.whatToRead}>
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
