import { useEffect, useMemo, useRef, useState } from 'react';
import { Eye, EyeOff, Mic, Square } from 'lucide-react';
import { PLACEHOLDER_AYAHS, PLACEHOLDER_SURAHS } from '../data/placeholder-data.js';
import { levelEmoji, levelLabel } from '../utils/levels.js';
import { normalizeArabic, buildExpected } from '../utils/arabic.js';
import { trackWords } from '../services/tracker.js';
import { isSpeechSupported, createRecognizer, speechErrorMessage } from '../services/speech.js';
import { getTodayReview, startSession, recordResult, endSession } from '../database/review.js';
import AddToReviewForm from '../components/AddToReviewForm.jsx';
import styles from './Review.module.css';

const RATINGS = ['mastered', 'good', 'needs_review', 'weak'];

function surahName(id) {
  return PLACEHOLDER_SURAHS.find((s) => s.number === id)?.name_ar || 'سورة ' + id;
}

function segmentAyahs(seg) {
  return PLACEHOLDER_AYAHS.filter(
    (a) =>
      a.surah_number === seg.surah_id &&
      a.ayah_number >= seg.start_ayah &&
      a.ayah_number <= seg.end_ayah
  );
}

function rangeLabel(seg) {
  return seg.start_ayah === seg.end_ayah
    ? 'آية ' + seg.start_ayah
    : 'الآيات ' + seg.start_ayah + '–' + seg.end_ayah;
}

function lastLabel(iso) {
  if (!iso) return 'لم تُراجَع بعد';
  const d = Math.floor((Date.now() - Date.parse(iso)) / 86400000);
  return d <= 0 ? 'روجعت اليوم' : 'آخر مراجعة قبل ' + d + ' يوم';
}

export default function Review() {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState('list');
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [results, setResults] = useState([]);
  const [error, setError] = useState('');

  const [tracking, setTracking] = useState(false);
  const [spoken, setSpoken] = useState('');
  const [speechError, setSpeechError] = useState('');
  const recognizerRef = useRef(null);

  const seg = queue[index];
  const ayahs = useMemo(() => (seg ? segmentAyahs(seg) : []), [seg]);
  const expected = useMemo(() => buildExpected(ayahs), [ayahs]);
  const spokenWords = useMemo(
    () => normalizeArabic(spoken).split(' ').filter(Boolean),
    [spoken]
  );
  const tracked = useMemo(() => trackWords(expected, spokenWords), [expected, spokenWords]);

  async function load() {
    try {
      setQueue(await getTodayReview());
      setError('');
    } catch (e) {
      setError(e?.message || String(e));
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    return () => recognizerRef.current?.stop();
  }, []);

  function stopTracking() {
    recognizerRef.current?.stop();
    recognizerRef.current = null;
    setTracking(false);
  }

  function resetSpeech() {
    stopTracking();
    setSpoken('');
    setSpeechError('');
  }

  function startTracking() {
    setSpeechError('');
    setSpoken('');
    if (!isSpeechSupported()) {
      setSpeechError('التتبع الصوتي غير متاح في هذا المتصفح. جرّب Chrome على أندرويد.');
      return;
    }
    const rec = createRecognizer({
      onTranscript: setSpoken,
      onError: (code) => {
        setSpeechError(speechErrorMessage(code));
        recognizerRef.current = null;
        setTracking(false);
      },
      onEnd: () => setTracking(false)
    });
    recognizerRef.current = rec;
    try {
      rec.start();
      setTracking(true);
    } catch (e) {
      setSpeechError(speechErrorMessage(e?.name || 'unknown'));
    }
  }

  async function begin() {
    try {
      const id = await startSession();
      setSessionId(id);
      setIndex(0);
      setResults([]);
      setRevealed(false);
      resetSpeech();
      setPhase('intro');
    } catch (e) {
      setError(e?.message || String(e));
    }
  }

  async function rate(level) {
    try {
      await recordResult(sessionId, seg, level);
    } catch (e) {
      setError(e?.message || String(e));
      return;
    }
    resetSpeech();
    setResults([...results, level]);
    if (index + 1 < queue.length) {
      setIndex(index + 1);
      setRevealed(false);
      setPhase('intro');
    } else {
      await endSession(sessionId);
      setPhase('done');
    }
  }

  function backToList() {
    resetSpeech();
    setPhase('list');
    setLoading(true);
    load();
  }

  function renderWords() {
    return expected.map((w, i) => {
      const st = tracked.status[i];
      const lastOfAyah = i === expected.length - 1 || expected[i + 1].ayah !== w.ayah;
      let cls = styles.word;
      let content = w.shown;
      if (st === 'correct') cls += ' ' + styles.wordCorrect;
      else if (st === 'missed') cls += ' ' + styles.wordMissed;
      else if (!revealed) {
        cls += ' ' + styles.wordHidden;
        content = '•••';
      }
      if (tracking && i === tracked.position) cls += ' ' + styles.wordNext;
      return (
        <span key={i}>
          <span className={cls}>{content}</span>
          {lastOfAyah && <span className={styles.num}>{w.ayah}</span>}{' '}
        </span>
      );
    });
  }

  if (phase === 'intro' || phase === 'recite') {
    const trackView = tracking || spoken.length > 0;
    const correctCount = tracked.status.filter((s) => s === 'correct').length;
    const missedCount = tracked.status.filter((s) => s === 'missed').length;

    return (
      <div className={styles.page}>
        <p className="text-muted">المقطع {index + 1} من {queue.length}</p>
        <div className={`card ${styles.big}`}>
          <p className={styles.surah}>{surahName(seg.surah_id)}</p>
          <p className={styles.range}>{rangeLabel(seg)}</p>
        </div>

        {phase === 'intro' && (
          <button className="btn-primary" style={{ width: '100%' }} onClick={() => setPhase('recite')}>
            ابدأ
          </button>
        )}

        {phase === 'recite' && (
          <>
            <div className={`card ${styles.textBox}`}>
              {trackView ? (
                expected.length > 0 ? (
                  <div>{renderWords()}</div>
                ) : (
                  <p className="text-muted">لا يتوفر نص لهذا المقطع بعد</p>
                )
              ) : revealed ? (
                ayahs.length > 0 ? (
                  ayahs.map((a) => (
                    <span key={a.id} className={styles.ayah}>
                      {a.text}
                      <span className={styles.num}>{a.ayah_number}</span>
                    </span>
                  ))
                ) : (
                  <p className="text-muted">لا يتوفر نص لهذا المقطع بعد</p>
                )
              ) : (
                <p className="text-muted" style={{ textAlign: 'center' }}>
                  النص مخفي — سمّع من حفظك
                </p>
              )}
            </div>

            <div className={styles.btnRow}>
              <button
                className={tracking ? styles.micActive : styles.micBtn}
                onClick={tracking ? stopTracking : startTracking}
              >
                {tracking ? <Square size={16} /> : <Mic size={16} />}{' '}
                {tracking ? 'إيقاف التتبع' : 'تتبع صوتي'}
              </button>
              <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setRevealed(!revealed)}>
                {revealed ? <EyeOff size={16} /> : <Eye size={16} />}{' '}
                {revealed ? 'أخفِ النص' : 'أظهر النص'}
              </button>
            </div>

            {speechError && <p className={styles.error}>{speechError}</p>}

            {trackView && !tracking && expected.length > 0 && (
              <p className="text-muted">
                التقطنا {correctCount} من {expected.length} كلمة
                {missedCount > 0 ? ' — ' + missedCount + ' لم تُلتقط' : ''}. التتبع مساعد فقط، والتقييم لك.
              </p>
            )}

            <p className={styles.label}>كيف كان تسميعك؟</p>
            <div className={styles.ratings}>
              {RATINGS.map((k) => (
                <button key={k} className={styles.rateBtn} onClick={() => rate(k)}>
                  {levelEmoji(k)} {levelLabel(k)}
                </button>
              ))}
            </div>
            {error && <p className={styles.error}>{error}</p>}
          </>
        )}
      </div>
    );
  }

  if (phase === 'done') {
    const count = (k) => results.filter((r) => r === k).length;
    return (
      <div className={styles.page}>
        <h1 className={styles.title}>اكتملت المراجعة ✓</h1>
        <div className={`card ${styles.summary}`}>
          {RATINGS.map((k) => (
            <div key={k} className={styles.summaryRow}>
              <span>{levelEmoji(k)} {levelLabel(k)}</span>
              <span>{count(k)}</span>
            </div>
          ))}
        </div>
        <button className="btn-primary" style={{ width: '100%' }} onClick={backToList}>
          رجوع
        </button>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>المراجعة</h1>
      <AddToReviewForm onAdded={load} />
      {error && <p className={styles.error}>{error}</p>}
      {!loading && queue.length === 0 && (
        <p className="text-muted">
          لا توجد مقاطع للمراجعة اليوم. أضف مقاطع من تبويب الحفظ وغيّر مستواها عن «جديد».
        </p>
      )}
      {queue.length > 0 && (
        <>
          <p className="text-muted">{queue.length} مقطع يحتاج مراجعة اليوم</p>
          <div className={styles.list}>
            {queue.map((s, i) => (
              <div key={s.id} className={`card ${styles.item}`}>
                <span className={styles.order}>{i + 1}</span>
                <div className={styles.itemText}>
                  <p className={styles.itemTitle}>
                    {levelEmoji(s.level)} {surahName(s.surah_id)} — {rangeLabel(s)}
                  </p>
                  <p className="text-muted">{lastLabel(s.last_review)}</p>
                </div>
              </div>
            ))}
          </div>
          <button className="btn-primary" style={{ width: '100%', marginTop: 16 }} onClick={begin}>
            ابدأ المراجعة
          </button>
        </>
      )}
    </div>
  );
}
