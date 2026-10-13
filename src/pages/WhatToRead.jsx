import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateAutoSegments } from '../utils/segmentation.js';
import { listSurahs } from '../database/quran.js';
import { listSuggestions, ensureTopicPassages, pageOfAyah } from '../database/prayerSuggestions.js';
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
const TOPICS = [
  'الصبر', 'التقوى', 'التوبة', 'الإيمان', 'الجنة', 'النار', 'قصص الأنبياء', 'الدعاء',
  'بر الوالدين', 'الآخرة', 'التوكل', 'الشكر', 'الرحمة', 'التوحيد', 'الأخلاق', 'العلم',
  'الصلاة', 'الإنفاق', 'رمضان', 'الجمعة', 'العيد'
];

function keyOf(s) {
  return s.surah_id + ':' + s.start_ayah + '-' + s.end_ayah;
}

function topicList(s) {
  return s.topics ? String(s.topics).split(/[،,]/).map((t) => t.trim()).filter(Boolean) : [];
}

async function buildPool(surahs) {
  const manual = await listSuggestions();
  const auto = generateAutoSegments(surahs);
  const manualKeys = new Set(manual.map(keyOf));
  return [...manual, ...auto.filter((a) => !manualKeys.has(keyOf(a)))];
}

export default function WhatToRead() {
  const navigate = useNavigate();
  const [surahs, setSurahs] = useState([]);
  const [step, setStep] = useState('prayer');
  const [prayer, setPrayer] = useState(null);
  const [duration, setDuration] = useState(null);
  const [mode, setMode] = useState(null);
  const [surahFilter, setSurahFilter] = useState(1);
  const [topicFilter, setTopicFilter] = useState(TOPICS[0]);
  const [avoidRepeat, setAvoidRepeat] = useState(true);
  const [repeatDays, setRepeatDays] = useState(14);
  const [suggestion, setSuggestion] = useState(null);
  const [error, setError] = useState('');
  const [marked, setMarked] = useState(false);

  useEffect(() => {
    let on = true;
    (async () => {
      try {
        await ensureTopicPassages();
        const list = await listSurahs();
        if (on) setSurahs(list);
      } catch (e) {
        if (on) setError(e?.message || String(e));
      }
    })();
    return () => {
      on = false;
    };
  }, []);

  const surahName = (n) => surahs.find((s) => s.number === n)?.name_ar || 'سورة ' + n;

  async function findSuggestion(chosenMode) {
    const prev = suggestion;
    setError('');
    setSuggestion(null);
    setMarked(false);

    if (surahs.length === 0) {
      setError('بيانات القرآن لم تُحمَّل بعد، حاول بعد لحظات.');
      return;
    }

    let pool = await buildPool(surahs);

    if (chosenMode === 'topic') {
      pool = pool.filter((s) => topicList(s).includes(topicFilter));
      if (pool.length === 0) {
        setError('لا توجد مقاطع مُصنَّفة بموضوع «' + topicFilter + '» بعد. يمكنك إضافتها من «إدارة المقترحات» في المزيد.');
        return;
      }
    } else if (chosenMode === 'surah') {
      pool = pool.filter((s) => s.surah_id === Number(surahFilter));
    }

    if (duration && duration !== 'any') pool = pool.filter((s) => s.length_category === duration);

    if (pool.length === 0) {
      setError('لا توجد مقاطع مطابقة لهذا الاختيار. جرّب مدة أخرى.');
      return;
    }

    if (chosenMode === 'auto' || chosenMode === 'coherent') {
      const best = pool.filter((s) => s.topics || (s.coherence_score || 0) >= 0.8);
      if (best.length > 0) pool = best;
    }

    if (avoidRepeat) {
      const excluded = await recentlyReadKeys(repeatDays);
      const filtered = pool.filter((s) => !excluded.has(keyOf(s)));
      if (filtered.length > 0) pool = filtered;
    }

    if (prev) {
      const others = pool.filter((s) => keyOf(s) !== keyOf(prev));
      if (others.length > 0) pool = others;
    }

    const pick = pool[Math.floor(Math.random() * pool.length)];
    setSuggestion(pick);
    setStep('result');
  }

  async function markAsRead() {
    await logPrayerReading(prayer, suggestion.surah_id, suggestion.start_ayah, suggestion.end_ayah);
    setMarked(true);
  }

  async function openInMushaf() {
    const page = await pageOfAyah(suggestion.surah_id, suggestion.start_ayah);
    navigate('/mushaf', {
      state: { page: page || undefined, hl: { surah: suggestion.surah_id, from: suggestion.start_ayah, to: suggestion.end_ayah } }
    });
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
    const topics = topicList(suggestion).join(' · ');
    return (
      <div className={styles.page}>
        <button className={styles.back} onClick={restart}>← البداية</button>
        <p className="text-muted">اقتراح لصلاة {prayer}</p>
        <div className={`card ${styles.resultCard}`}>
          <p className={styles.resultSurah}>{surahName(suggestion.surah_id)}</p>
          <p className={styles.resultRange}>الآيات {suggestion.start_ayah}–{suggestion.end_ayah}</p>
          <p className="text-muted">
            {topics ? topics + ' — ' : ''}{suggestion.estimated_duration}
          </p>
        </div>

        <button className="btn-primary" style={{ width: '100%' }} onClick={openInMushaf}>
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
                {surahs.map((s) => <option key={s.number} value={s.number}>{s.name_ar}</option>)}
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
                تُعرض المقاطع المصنّفة بهذا الموضوع، الجاهزة وما أضفته من «إدارة المقترحات» في المزيد.
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
