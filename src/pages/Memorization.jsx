import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { PLACEHOLDER_SURAHS } from '../data/placeholder-data.js';
import { LEVELS, levelEmoji } from '../utils/levels.js';
import {
  listAllSegments,
  addSegment,
  setLevel,
  deleteSegment,
  summarize
} from '../database/memorization.js';
import styles from './Memorization.module.css';

export default function Memorization() {
  const [segments, setSegments] = useState([]);
  const [openSurah, setOpenSurah] = useState(null);
  const [startVal, setStartVal] = useState('');
  const [endVal, setEndVal] = useState('');
  const [error, setError] = useState('');

  async function refresh() {
    try {
      setSegments(await listAllSegments());
    } catch (e) {
      setError(e?.message || String(e));
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  function segmentsOf(surahNumber) {
    return segments.filter((s) => s.surah_id === surahNumber);
  }

  async function handleAdd() {
    setError('');
    try {
      await addSegment(
        openSurah.number,
        openSurah.ayah_count,
        parseInt(startVal, 10),
        parseInt(endVal, 10)
      );
      setStartVal('');
      setEndVal('');
      refresh();
    } catch (e) {
      setError(e?.message || String(e));
    }
  }

  async function handleLevel(id, level) {
    await setLevel(id, level);
    refresh();
  }

  async function handleDelete(id) {
    if (!window.confirm('حذف هذا المقطع؟')) return;
    await deleteSegment(id);
    refresh();
  }

  if (openSurah) {
    const segs = segmentsOf(openSurah.number);
    const { percent, masteredPercent } = summarize(segs, openSurah.ayah_count);
    return (
      <div className={styles.page}>
        <button className={styles.back} onClick={() => { setOpenSurah(null); setError(''); }}>
          ← خريطة الحفظ
        </button>
        <h1 className={styles.title}>{openSurah.name_ar}</h1>
        <p className="text-muted">محفوظ {percent}% — متقن {masteredPercent}% — {openSurah.ayah_count} آيات</p>

        <div className={`card ${styles.addBox}`}>
          <p className={styles.label}>إضافة مقطع للحفظ</p>
          <div className={styles.addRow}>
            <input
              className={styles.input}
              type="number"
              inputMode="numeric"
              placeholder="من آية"
              value={startVal}
              onChange={(e) => setStartVal(e.target.value)}
            />
            <input
              className={styles.input}
              type="number"
              inputMode="numeric"
              placeholder="إلى آية"
              value={endVal}
              onChange={(e) => setEndVal(e.target.value)}
            />
            <button className="btn-primary" onClick={handleAdd}>إضافة</button>
          </div>
          {error && <p className={styles.error}>{error}</p>}
        </div>

        {segs.length === 0 && <p className="text-muted">لا توجد مقاطع بعد.</p>}
        <div className={styles.list}>
          {segs.map((s) => (
            <div key={s.id} className={`card ${styles.segment}`}>
              <div className={styles.segHead}>
                <span className={styles.segRange}>
                  {levelEmoji(s.level)} آيات {s.start_ayah}–{s.end_ayah}
                </span>
                <button onClick={() => handleDelete(s.id)}><Trash2 size={16} /></button>
              </div>
              <div className={styles.levels}>
                {LEVELS.map((l) => (
                  <button
                    key={l.key}
                    className={`${styles.levelBtn} ${s.level === l.key ? styles.levelActive : ''}`}
                    onClick={() => handleLevel(s.id, l.key)}
                  >
                    {l.emoji} {l.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>الحفظ</h1>
      <p className="text-muted" style={{ marginBottom: 16 }}>
        قائمة السور الكاملة (114) تأتي من بيانات القرآن عند استيرادها. حاليًا سورتان تجريبيتان.
      </p>
      {error && <p className={styles.error}>{error}</p>}
      <div className={styles.grid}>
        {PLACEHOLDER_SURAHS.map((s) => {
          const segs = segmentsOf(s.number);
          const { percent, masteredPercent, weakest } = summarize(segs, s.ayah_count);
          return (
            <button key={s.number} className={`card ${styles.surahCard}`} onClick={() => setOpenSurah(s)}>
              <span className={styles.dot}>{weakest ? levelEmoji(weakest) : '⚪'}</span>
              <span className={styles.surahName}>{s.name_ar}</span>
              <span className="text-muted">محفوظ {percent}% · متقن {masteredPercent}%</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
