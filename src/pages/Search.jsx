import { useState } from 'react';
import { Search as SearchIcon, X } from 'lucide-react';
import { PLACEHOLDER_SURAHS, PLACEHOLDER_AYAHS } from '../data/placeholder-data.js';
import styles from './Search.module.css';

export default function Search({ onOpenAyah }) {
  const [term, setTerm] = useState('');

  const results = term.trim().length === 0
    ? []
    : PLACEHOLDER_AYAHS.filter(a => a.text.includes(term));

  function surahName(number) {
    return PLACEHOLDER_SURAHS.find(s => s.number === number)?.name_ar || '';
  }

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
          onChange={e => setTerm(e.target.value)}
        />
        {term && (
          <button onClick={() => setTerm('')}>
            <X size={18} color="var(--color-text-muted)" />
          </button>
        )}
      </div>

      {term && results.length === 0 && (
        <p className="text-muted" style={{ textAlign: 'center', marginTop: 24 }}>
          لا توجد نتائج
        </p>
      )}

      <div className={styles.results}>
        {results.map(a => (
          <button
            key={`${a.surah_number}-${a.ayah_number}`}
            className={styles.resultItem}
            onClick={() => onOpenAyah && onOpenAyah(a)}
          >
            <p className={styles.resultSurah}>
              {surahName(a.surah_number)} — آية {a.ayah_number}
            </p>
            <p className={styles.resultText}>{highlight(a.text)}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
