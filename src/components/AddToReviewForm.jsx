import { useState } from 'react';
import { Plus } from 'lucide-react';
import { PLACEHOLDER_SURAHS } from '../data/placeholder-data.js';
import { addToReview } from '../database/review.js';
import styles from './AddToReviewForm.module.css';

export default function AddToReviewForm({ onAdded }) {
  const [open, setOpen] = useState(false);
  const [surahNumber, setSurahNumber] = useState(PLACEHOLDER_SURAHS[0].number);
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  async function submit() {
    setMessage('');
    setIsError(false);
    const surah = PLACEHOLDER_SURAHS.find((s) => s.number === Number(surahNumber));
    const from = parseInt(start, 10);
    const to = end === '' ? from : parseInt(end, 10);
    try {
      const r = await addToReview(surah.number, surah.ayah_count, from, to);
      setMessage(
        r === 'exists'
          ? 'هذا المقطع موجود بالفعل في المراجعة'
          : r === 'promoted'
          ? 'نُقل المقطع من الحفظ إلى المراجعة ✓'
          : 'أُضيف للمراجعة ✓'
      );
      setStart('');
      setEnd('');
      if (onAdded) onAdded();
    } catch (e) {
      setIsError(true);
      setMessage(e?.message || String(e));
    }
  }

  if (!open) {
    return (
      <button className="btn-secondary" onClick={() => setOpen(true)}>
        <Plus size={16} /> إضافة مقطع للمراجعة
      </button>
    );
  }

  return (
    <div className="card">
      <p className={styles.label}>إضافة مقطع للمراجعة</p>
      <select
        className={styles.field}
        value={surahNumber}
        onChange={(e) => setSurahNumber(e.target.value)}
      >
        {PLACEHOLDER_SURAHS.map((s) => (
          <option key={s.number} value={s.number}>
            {s.name_ar}
          </option>
        ))}
      </select>
      <div className={styles.row}>
        <input
          className={styles.field}
          type="number"
          inputMode="numeric"
          placeholder="من آية"
          value={start}
          onChange={(e) => setStart(e.target.value)}
        />
        <input
          className={styles.field}
          type="number"
          inputMode="numeric"
          placeholder="إلى آية (اختياري)"
          value={end}
          onChange={(e) => setEnd(e.target.value)}
        />
      </div>
      <div className={styles.row}>
        <button className="btn-primary" style={{ flex: 1 }} onClick={submit}>
          إضافة
        </button>
        <button className="btn-secondary" onClick={() => { setOpen(false); setMessage(''); }}>
          إغلاق
        </button>
      </div>
      {message && <p className={isError ? styles.error : styles.ok}>{message}</p>}
    </div>
  );
}
