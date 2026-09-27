import { useState } from 'react';
import { Search as SearchIcon } from 'lucide-react';
import { PLACEHOLDER_AYAHS, PLACEHOLDER_TOTAL_PAGES } from '../data/placeholder-data.js';
import AyahActionSheet from '../components/AyahActionSheet.jsx';
import PageSwiper from '../components/PageSwiper.jsx';
import SearchPage from './Search.jsx';
import styles from './Mushaf.module.css';

export default function Mushaf() {
  const [page, setPage] = useState(1);
  const [activeAyah, setActiveAyah] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);

  const ayahs = PLACEHOLDER_AYAHS.filter(a => a.page === page);

  if (searchOpen) {
    return (
      <div className={styles.page}>
        <button className={styles.backBtn} onClick={() => setSearchOpen(false)}>
          ← رجوع للمصحف
        </button>
        <SearchPage onOpenAyah={(a) => { setPage(a.page); setActiveAyah(a); setSearchOpen(false); }} />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <div className={styles.warning}>
          ⚠️ نص تجريبي مؤقت — لم يتم إدخال نص القرآن الفعلي بعد
        </div>
        <button className={styles.searchIconBtn} onClick={() => setSearchOpen(true)}>
          <SearchIcon size={20} color="var(--color-primary)" />
        </button>
      </div>

      <PageSwiper pageNumber={page} totalPages={PLACEHOLDER_TOTAL_PAGES} onChange={setPage}>
        <div className={styles.ayahList}>
          {ayahs.map(a => (
            <span
              key={`${a.surah_number}-${a.ayah_number}`}
              className={styles.ayahText}
              onClick={() => setActiveAyah(a)}
            >
              {a.text}
              <span className={styles.ayahNumber}>{a.ayah_number}</span>
            </span>
          ))}
        </div>
      </PageSwiper>

      {activeAyah && (
        <AyahActionSheet ayah={activeAyah} onClose={() => setActiveAyah(null)} />
      )}
    </div>
  );
}
