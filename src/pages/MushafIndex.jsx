import { useEffect, useState } from 'react';
import { listSurahs } from '../database/quran.js';
import styles from './MushafIndex.module.css';

const TABS = [
  { key: 'surah', label: 'السور' },
  { key: 'juz', label: 'الأجزاء' },
  { key: 'page', label: 'صفحة' }
];

export default function MushafIndex({ onClose, onGoToPage }) {
  const [tab, setTab] = useState('surah');
  const [surahs, setSurahs] = useState([]);
  const [pageInput, setPageInput] = useState('');

  useEffect(() => {
    listSurahs().then(setSurahs);
  }, []);

  function submitPage() {
    const n = parseInt(pageInput, 10);
    if (n >= 1 && n <= 604) onGoToPage(n);
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
        <div className={styles.tabs}>
          {TABS.map((t) => (
            <button
              key={t.key}
              className={tab === t.key ? styles.tabActive : styles.tab}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'surah' && (
          <div className={styles.list}>
            {surahs.map((s) => (
              <button
                key={s.number}
                className={styles.item}
                onClick={() => onGoToPage(null, s.number)}
              >
                <span className={styles.itemNum}>{s.number}</span>
                <span className={styles.itemName}>{s.name_ar}</span>
                <span className="text-muted">{s.ayah_count} آية</span>
              </button>
            ))}
          </div>
        )}

        {tab === 'juz' && (
          <div className={styles.grid}>
            {Array.from({ length: 30 }, (_, i) => i + 1).map((j) => (
              <button key={j} className={styles.juzBtn} onClick={() => onGoToPage(null, null, j)}>
                الجزء {j}
              </button>
            ))}
          </div>
        )}

        {tab === 'page' && (
          <div className={styles.pageForm}>
            <input
              className={styles.pageInput}
              type="number"
              inputMode="numeric"
              placeholder="رقم الصفحة (1–604)"
              value={pageInput}
              onChange={(e) => setPageInput(e.target.value)}
            />
            <button className="btn-primary" onClick={submitPage}>انتقل</button>
          </div>
        )}
      </div>
    </div>
  );
}
