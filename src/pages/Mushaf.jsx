import MushafPage from '../components/MushafPage.jsx';
import MushafFlow from '../components/MushafFlow.jsx';
import ReaderControls from '../components/ReaderControls.jsx';
import SurahBanner from '../components/SurahBanner.jsx';
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Search as SearchIcon, List } from 'lucide-react';
import { getAyahsByPage, getTotalPages, getSurahByNumber, getBasmalaText, splitBasmala } from '../database/quran.js';
import AyahActionSheet from '../components/AyahActionSheet.jsx';
import PageSwiper from '../components/PageSwiper.jsx';
import SearchPage from './Search.jsx';
import MushafIndex from './MushafIndex.jsx';
import styles from './Mushaf.module.css';

export default function Mushaf() {
  const location = useLocation();
  const [page, setPage] = useState(location.state?.page || 1);
  const [hl] = useState(location.state?.hl || null);
  const [mode, setModeState] = useState(() => {
    try { return localStorage.getItem('rattil_mushaf_mode') === 'flow' ? 'flow' : 'pages'; } catch { return 'pages'; }
  });
  const [scale, setScaleState] = useState(() => {
    try {
      const v = Number(localStorage.getItem('rattil_mushaf_scale'));
      return v >= 0.6 && v <= 2.4 ? v : 1;
    } catch { return 1; }
  });
  function setMode(m) {
    setModeState(m);
    try { localStorage.setItem('rattil_mushaf_mode', m); } catch { /* ignore */ }
  }
  function setScale(v) {
    setScaleState(v);
    try { localStorage.setItem('rattil_mushaf_scale', String(v)); } catch { /* ignore */ }
  }
  const [totalPages, setTotalPages] = useState(604);
  const [ayahs, setAyahs] = useState([]);
  const [basmala, setBasmala] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeAyah, setActiveAyah] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [indexOpen, setIndexOpen] = useState(false);

  useEffect(() => {
    getTotalPages().then(setTotalPages).catch(() => {});
    getBasmalaText().then(setBasmala).catch(() => {});
  }, []);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    getAyahsByPage(page)
      .then((rows) => {
        if (alive) {
          setAyahs(rows);
          setError('');
        }
      })
      .catch((e) => alive && setError(e?.message || String(e)))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [page]);

  async function goTo(pageNum, surahNumber, juzNumber) {
    setIndexOpen(false);
    if (pageNum) {
      setPage(pageNum);
      return;
    }
    if (surahNumber) {
      const { getAyahsBySurah } = await import('../database/quran.js');
      const first = await getAyahsBySurah(surahNumber);
      if (first[0]) setPage(first[0].page);
      return;
    }
    if (juzNumber) {
      const { query } = await import('../database/db.js');
      const rows = await query('SELECT MIN(page) AS p FROM ayahs WHERE juz = ?', [juzNumber]);
      if (rows[0]?.p) setPage(rows[0].p);
    }
  }

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

  let lastSurah = null;

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <button className={styles.searchIconBtn} onClick={() => setIndexOpen(true)}>
          <List size={20} color="var(--color-primary)" />
        </button>
        <button className={styles.searchIconBtn} onClick={() => setSearchOpen(true)}>
          <SearchIcon size={20} color="var(--color-primary)" />
        </button>
      </div>

      {error && <p className={styles.warning}>خطأ: {error}</p>}
      {!error && !loading && ayahs.length === 0 && (
        <p className="text-muted" style={{ textAlign: 'center', marginTop: 24 }}>
          لا توجد بيانات قرآن بعد. استوردها من المزيد ← استيراد بيانات القرآن.
        </p>
      )}

      <PageSwiper
        pageNumber={page}
        totalPages={totalPages}
        onChange={setPage}
        footerExtra={<ReaderControls mode={mode} setMode={setMode} scale={scale} setScale={setScale} />}
      >
        {mode === 'flow' ? (
          <MushafFlow page={page} ayahs={ayahs} basmala={basmala} scale={scale} onAyahClick={setActiveAyah} highlight={hl} />
        ) : (
          <MushafPage page={page} ayahs={ayahs} basmala={basmala} onAyahClick={setActiveAyah} highlight={hl} />
        )}
      </PageSwiper>

      {activeAyah && (
        <AyahActionSheet ayah={activeAyah} onClose={() => setActiveAyah(null)} />
      )}
      {indexOpen && <MushafIndex onClose={() => setIndexOpen(false)} onGoToPage={goTo} />}
    </div>
  );
}
