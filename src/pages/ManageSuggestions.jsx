import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { PLACEHOLDER_SURAHS } from '../data/placeholder-data.js';
import { listSuggestions, addSuggestion, deleteSuggestion } from '../database/prayerSuggestions.js';
import styles from './ManageSuggestions.module.css';

const TOPICS = ['الصبر', 'التقوى', 'التوبة', 'الإيمان', 'الجنة', 'النار', 'قصص الأنبياء', 'الدعاء', 'بر الوالدين', 'الآخرة'];
const LENGTHS = [
  { key: 'short', label: 'قصيرة' },
  { key: 'medium', label: 'متوسطة' },
  { key: 'long', label: 'طويلة' }
];

export default function ManageSuggestions() {
  const [list, setList] = useState([]);
  const [surahNumber, setSurahNumber] = useState(PLACEHOLDER_SURAHS[0].number);
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [topic, setTopic] = useState(TOPICS[0]);
  const [length, setLength] = useState('medium');
  const [error, setError] = useState('');

  async function refresh() {
    setList(await listSuggestions());
  }

  useEffect(() => {
    refresh();
  }, []);

  function surahName(n) {
    return PLACEHOLDER_SURAHS.find((s) => s.number === n)?.name_ar || 'سورة ' + n;
  }

  async function handleAdd() {
    setError('');
    const surah = PLACEHOLDER_SURAHS.find((s) => s.number === Number(surahNumber));
    try {
      await addSuggestion({
        surahId: surah.number,
        ayahCount: surah.ayah_count,
        start: parseInt(start, 10),
        end: parseInt(end, 10),
        topics: topic,
        lengthCategory: length
      });
      setStart('');
      setEnd('');
      refresh();
    } catch (e) {
      setError(e?.message || String(e));
    }
  }

  async function handleDelete(id) {
    await deleteSuggestion(id);
    refresh();
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>إدارة مقترحات «ماذا أقرأ؟»</h1>
      <p className="text-muted">
        أدخل أنت المقاطع المناسبة للقراءة في الصلاة (سورة، نطاق آيات، موضوع). التطبيق لا يقترح مقاطع من تلقاء نفسه.
      </p>

      <div className={`card ${styles.form}`}>
        <select className={styles.field} value={surahNumber} onChange={(e) => setSurahNumber(e.target.value)}>
          {PLACEHOLDER_SURAHS.map((s) => (
            <option key={s.number} value={s.number}>{s.name_ar}</option>
          ))}
        </select>
        <div className={styles.row}>
          <input className={styles.field} type="number" inputMode="numeric" placeholder="من آية" value={start} onChange={(e) => setStart(e.target.value)} />
          <input className={styles.field} type="number" inputMode="numeric" placeholder="إلى آية" value={end} onChange={(e) => setEnd(e.target.value)} />
        </div>
        <select className={styles.field} value={topic} onChange={(e) => setTopic(e.target.value)}>
          {TOPICS.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <div className={styles.row}>
          {LENGTHS.map((l) => (
            <button
              key={l.key}
              className={length === l.key ? styles.lengthActive : styles.lengthBtn}
              onClick={() => setLength(l.key)}
            >
              {l.label}
            </button>
          ))}
        </div>
        <button className="btn-primary" onClick={handleAdd}>إضافة المقترح</button>
        {error && <p className={styles.error}>{error}</p>}
      </div>

      <div className={styles.list}>
        {list.map((s) => (
          <div key={s.id} className={`card ${styles.item}`}>
            <div className={styles.itemText}>
              <p className={styles.itemTitle}>{surahName(s.surah_id)} {s.start_ayah}–{s.end_ayah}</p>
              <p className="text-muted">{s.topics} — {s.estimated_duration}</p>
            </div>
            <button onClick={() => handleDelete(s.id)}><Trash2 size={16} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}
