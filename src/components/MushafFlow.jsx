import { Fragment, useEffect, useRef } from 'react';
import SurahBanner from './SurahBanner.jsx';
import { splitBasmala } from '../database/quran.js';
import styles from './MushafFlow.module.css';

function getBaseFs() {
  try {
    const v = Number(localStorage.getItem('rattil_page_fs'));
    if (v > 8) return v;
  } catch { /* ignore */ }
  return Math.max(16, Math.min(40, window.innerWidth * 0.05));
}

export default function MushafFlow({ page, ayahs, basmala, scale = 1, onAyahClick, highlight }) {
  const boxRef = useRef(null);
  const press = useRef(null);

  useEffect(() => {
    if (boxRef.current) boxRef.current.scrollTop = 0;
  }, [page]);

  useEffect(() => () => {
    if (press.current) clearTimeout(press.current.timer);
  }, []);

  function cancelPress() {
    if (press.current) {
      clearTimeout(press.current.timer);
      press.current = null;
    }
  }

  function startPress(e, a) {
    cancelPress();
    press.current = {
      x: e.clientX,
      y: e.clientY,
      timer: setTimeout(() => {
        press.current = null;
        if (navigator.vibrate) navigator.vibrate(20);
        if (onAyahClick) onAyahClick(a);
      }, 450),
    };
  }

  function movePress(e) {
    const p = press.current;
    if (!p) return;
    if (Math.abs(e.clientX - p.x) > 10 || Math.abs(e.clientY - p.y) > 10) cancelPress();
  }

  const fs = Math.round(getBaseFs() * scale * 10) / 10;
  let lastSurah = null;
  const items = (ayahs || []).map((a) => {
    const isNewSurah = a.surah_number !== lastSurah;
    lastSurah = a.surah_number;
    const isStart = isNewSurah && a.ayah_number === 1;
    let text = a.text;
    let showBasmala = false;
    if (isStart && a.surah_number !== 9) {
      const sp = splitBasmala(a.text, basmala);
      if (sp.basmala) {
        showBasmala = true;
        text = sp.rest;
      }
    }
    const inHl = !!highlight && a.surah_number === highlight.surah &&
      a.ayah_number >= highlight.from && a.ayah_number <= highlight.to;
    return (
      <Fragment key={a.id}>
        {isStart && (
          <div className={styles.banner}>
            <SurahBanner name={a.surah_name} />
          </div>
        )}
        {showBasmala && <div className={styles.basmala}>{basmala}</div>}
        <span
          className={styles.ayah + (inHl ? ' ' + styles.hl : '')}
          onPointerDown={(e) => startPress(e, a)}
        >
          {text}
          <span className={styles.num + (inHl ? ' ' + styles.hlNum : '')}>{a.ayah_number}</span>
        </span>{' '}
      </Fragment>
    );
  });

  return (
    <div
      ref={boxRef}
      className={styles.flow}
      style={{ '--flow-fs': fs + 'px' }}
      onPointerMove={movePress}
      onPointerUp={cancelPress}
      onPointerCancel={cancelPress}
      onContextMenu={(e) => e.preventDefault()}
    >
      {items}
    </div>
  );
}
