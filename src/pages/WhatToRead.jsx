import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PLACEHOLDER_SURAHS } from '../data/placeholder-data.js';
import { generateAutoSegments } from '../utils/segmentation.js';
import { listSuggestions } from '../database/prayerSuggestions.js';
import { logPrayerReading, recentlyReadKeys } from '../database/prayerReadings.js';
import styles from './WhatToRead.module.css';

const PRAYERS = ['الفجر', 'الظهر', 'العصر', 'المغرب', 'العشاء', 'التراويح', 'قيام الليل', 'أخرى'];
const DURATIONS = [
  { key: 'short', label: 'قصيرة' },
  { key: 'medium', label: 'متوسطة' },
  { key: 'long', label: 'طويلة' },
  { key: 'any', label: 'غير محدد' }
];
const MODES = [
  { key: 'auto', label: '✨ اختر لي' },
  { key: 'surah', label: '📚 سورة واحدة' },
  { key: 'coherent', label: '🔗 مقطع مترابط' },
  { key: 'topic', label: '🎯 موضوع' }
];
const TOPICS = ['الصبر', 'التقوى', 'التوبة', 'الإيمان', 'الجنة', 'النار', 'قصص الأنبياء', 'الدعاء', 'بر الوالدين', 'الآخرة'];

function surahName(n) {
  return PLACEHOLDER_SURAHS.find((s) => s.number === n)?.name_ar || 'سورة ' + n;
}

function keyOf(s) {
  return s.surah_id + ':' + s.start_ayah + '-' + s.end_ayah;
}

async function buildPool() {
  const manual = await listSuggestions();
  const auto = generateAutoSegments(PLACEHOLDER_SURAHS);
  const manualKeys = new Set(manual.map(keyOf));
  // عند وجود مقترح يدوي مُصنَّف لنفس النطاق، يُفضَّل لأنه يحمل موضوعًا حقيقيًا
  return [...manual, ...auto.filter((a) => !manualKeys.has(keyOf(a)))];
}

export default function WhatToRead() {
  const navigate = useNavigate();
  const [step, setStep] = useState('prayer');
  const [prayer, setPrayer] = useState(null);
  const [duration, setDuration] = useState(null);
  const [mode, setMode] = useState(null);
  const [surahFilter, setSurahFilter] = useState(PLACEHOLDER_SURAHS[0].number);
  const [topicFilter, setTopicFilter] = useState(TOPICS[0]);
  const [avoidRepeat, setAvoidRepeat] = useState(true);
  const [repeatDays, setRepeatDays] = useState(14);
  const [suggestion, setSuggestion] = useState(null);
  const [error, setError] = useState('');
  const [marked, setMarked] = useState(false);

  async function findSuggestion(chosenMode) {
    setError('');
    setSuggestion(null);
    setMarked(false);

    let pool = await buildPool();

    if (chosenMode === 'topic') {
      pool = pool.filter((s) => s.topics === topicFilter);
      if (pool.length === 0) {
        setError('لا توجد مقاطع مُصنَّفة بموضوع «' + topicFilter + '» بعد. يمكنك إضافتها من «إدارة المقترحات» في المزيد.');
        return;
      }
    } else if (chosenMode === 'coherent') {
      // نُفضّل المقاطع المُصنَّفة يدويًا (أعلى درجة ترابط) قبل التقطيع الآلي
      pool = [...pool].sort((a, b) => (b.coherence_score || 0) - (a.coherence_score || 0));
    } else if (chosenMode === 'surah') {
      pool = pool.filter((s) => s.surah_id === Number(surahFilter));
    }

    if (duration && duration !== 'any') pool = pool.filter((s) => s.length_category === duration);

    if (pool.length === 0) {
      setError('لا توجد مقاطع مطابقة لهذا الاختيار. جرّب مدة أخرى.');
      return;
    }

    if (avoidRepeat) {
      const excluded = await recentlyReadKeys(repeatDays);
      const filtered = pool.filter((s) => !excluded.has(keyOf(s)));
      if (filtered.length > 0) pool = filtered;
    }

    const pick = pool[Math.floor(Math.random() * pool.length)];
    setSuggestion(pick);
    setStep('result');
  }

  async function markAsRead() {
    await logPrayerReading(prayer, suggestion.surah_id, suggestion.start_ayah, suggestion.end_ayah);
    setMarked(true);
  }

  function restart() {
    setStep('prayer');
    setPrayer(null);
    setDuration(null);
    setMode(null);
    setSuggestion(null);
    setError('');
    setMarked(false);
  }

  if (step === 'result' && suggestion) {
    return (
      <div className={styles.page}>
        <button className={styles.back} onClick={restart}>← البداية</button>
        <p className="text-muted">اقتراح لصلاة {prayer}</p>
        <div className={`card ${styles.resultCard}`}>
          <p className={styles.resultSurah}>{surahName(suggestion.surah_id)}</p>
          <p className={styles.resultRange}>الآيات {suggestion.start_ayah}–{suggestion.end_ayah}</p>
          <p className="text-muted">
            {suggestion.topics ? suggestion.topics + ' — ' : ''}{suggestion.estimated_duration}
          </p>
        </div>

        <button className="btn-primary" style={{ width: '100%' }} onClick={() => navigate('/mushaf')}>
          فتح في المصحف
        </button>

        {!marked ? (
          <button className="btn-secondary" onClick={markAsRead}>✓ تمت القراءة</button>
        ) : (
          <p className="text-muted" style={{ textAlign: 'center' }}>سُجّلت القراءة ✓</p>
        )}

        <button className={styles.retry} onClick={() => findSuggestion(mode)}>
          اقتراح آخر
        </button>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>ماذا أقرأ؟</h1>

      {step === 'prayer' && (
        <>
          <p className={styles.label}>اختر الصلاة</p>
          <div className={styles.grid}>
            {PRAYERS.map((p) => (
              <button key={p} className={styles.choice} onClick={() => { setPrayer(p); setStep('duration'); }}>
                {p}
              </button>
            ))}
          </div>
        </>
      )}

      {step === 'duration' && (
        <>
          <p className={styles.label}>مدة القراءة</p>
          <div className={styles.grid}>
            {DURATIONS.map((d) => (
              <button key={d.key} className={styles.choice} onClick={() => { setDuration(d.key); setStep('mode'); }}>
                {d.label}
              </button>
            ))}
          </div>
        </>
      )}

      {step === 'mode' && (
        <>
          <p className={styles.label}>نوع الاقتراح</p>
          <div className={styles.grid}>
            {MODES.map((m) => (
              <button key={m.key} className={styles.choice} onClick={() => { setMode(m.key); setStep('filter'); }}>
                {m.label}
              </button>
            ))}
          </div>
        </>
      )}

      {step === 'filter' && (
        <>
          {mode === 'surah' && (
            <>
              <p className={styles.label}>اختر السورة</p>
              <select className={styles.select} value={surahFilter} onChange={(e) => setSurahFilter(e.target.value)}>
                {PLACEHOLDER_SURAHS.map((s) => <option key={s.number} value={s.number}>{s.name_ar}</option>)}
              </select>
            </>
          )}
          {mode === 'topic' && (
            <>
              <p className={styles.label}>اختر الموضوع</p>
              <select className={styles.select} value={topicFilter} onChange={(e) => setTopicFilter(e.target.value)}>
                {TOPICS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <p className="text-muted">
                هذا الخيار يعرض فقط المقاطع التي صنّفتها أنت يدويًا بموضوع، من «إدارة المقترحات» في المزيد.
              </p>
            </>
          )}

          <div className={`card ${styles.repeatBox}`}>
            <label className={styles.checkboxRow}>
              <input type="checkbox" checked={avoidRepeat} onChange={(e) => setAvoidRepeat(e.target.checked)} />
              لا تقترح ما قرأته مؤخرًا
            </label>
            {avoidRepeat && (
              <div className={styles.grid}>
                {[7, 14, 30, 60].map((d) => (
                  <button
                    key={d}
                    className={repeatDays === d ? styles.choiceActive : styles.choice}
                    onClick={() => setRepeatDays(d)}
                  >
                    {d} يومًا
                  </button>
                ))}
              </div>
            )}
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <button className="btn-primary" style={{ width: '100%' }} onClick={() => findSuggestion(mode)}>
            اقترح لي
          </button>
        </>
      )}
    </div>
  );
}
