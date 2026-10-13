import { useEffect, useState } from 'react';
import { Search as SearchIcon, X } from 'lucide-react';
import { searchAyahs } from '../database/quran.js';
import styles from './Search.module.css';

export default function Search({ onOpenAyah }) {
  const [term, setTerm] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!term.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    const timer = setTimeout(() => {
      searchAyahs(term)
        .then(setResults)
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(timer);
  }, [term]);

  function highlight(text) {
    if (!term) return text;
    const parts = text.split(term);
    return parts.map((part, i) => (
      <span key={i}>
        {part}
        {i < parts.length - 1 && <mark className={styles.mark}>{term}</mark>}
      </span>
    ));
  }

  return (
    <div className={styles.page}>
      <div className={styles.inputWrap}>
        <SearchIcon size={18} color="var(--color-text-muted)" />
        <input
          className={styles.input}
          placeholder="ابحث في القرآن..."
          value={term}
          onChange={(e) => setTerm(e.target.value)}
        />
        {term && (
          <button onClick={() => setTerm('')}>
            <X size={18} color="var(--color-text-muted)" />
          </button>
        )}
      </div>

      {loading && <p className="text-muted" style={{ textAlign: 'center', marginTop: 24 }}>جارٍ البحث…</p>}
      {!loading && term && results.length === 0 && (
        <p className="text-muted" style={{ textAlign: 'center', marginTop: 24 }}>لا توجد نتائج</p>
      )}
      {results.length === 100 && (
        <p className="text-muted" style={{ textAlign: 'center' }}>تُعرض أول 100 نتيجة فقط</p>
      )}

      <div className={styles.results}>
        {results.map((a) => (
          <button key={a.id} className={styles.resultItem} onClick={() => onOpenAyah && onOpenAyah(a)}>
            <p className={styles.resultSurah}>{a.surah_name} — آية {a.ayah_number}</p>
            <p className={styles.resultText}>{highlight(a.text)}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
