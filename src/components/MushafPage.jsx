import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import SurahBanner from './SurahBanner.jsx';
import { getAyahsByPage, getSurahByNumber } from '../database/quran.js';
import styles from './MushafPage.module.css';

const FALLBACK_BASMALA = 'بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ';
const WAQF = /^[\u06D6-\u06DC]+$/;
const GAP_EM = 0.24;
const BANNER_H = 60;
const ROWS = 15;
const MAX_UP = 1;

let layoutPromise = null;
function loadLayout() {
  if (!layoutPromise) {
    layoutPromise = import('../data/mushaf-lines.json').then((m) => (m.default || m).pages);
  }
  return layoutPromise;
}

function tokens(text) {
  const out = [];
  for (const t of text.split(' ')) {
    if (!t) continue;
    if (WAQF.test(t) && out.length) out[out.length - 1] += ' ' + t;
    else out.push(t);
  }
  return out;
}

function lineItems(line) {
  const out = [];
  for (let i = 1; i < line.length; i++) {
    const r = line[i];
    const k = r[0] + ':' + r[1];
    tokens(r[2]).forEach((t) => out.push({ t, k }));
    if (r[3]) out.push({ m: r[1], k });
  }
  return out;
}

export default function MushafPage({ page, ayahs, basmala, onAyahClick, highlight }) {
  const rootRef = useRef(null);
  const fsRef = useRef(20);
  const doFitRef = useRef(null);
  const ayahsRef = useRef(ayahs);
  const namesRef = useRef({});
  const [pages, setPages] = useState(null);
  const [names, setNames] = useState({});
  const [fit, setFit] = useState({ fs: 20, W: 0, H: 0, ratios: {}, ready: false });
  ayahsRef.current = ayahs;
  namesRef.current = names;

  const data = pages ? pages[page] || null : null;

  useEffect(() => {
    let on = true;
    loadLayout().then((p) => {
      if (on) setPages(p);
    });
    return () => {
      on = false;
    };
  }, []);

  useEffect(() => {
    if (!data) return;
    const have = { ...namesRef.current };
    (ayahs || []).forEach((a) => {
      if (a.surah_name) have[a.surah_number] = a.surah_name;
    });
    const miss = [];
    data.forEach((l) => {
      if (l && l[0] === 'h' && !have[l[1]]) miss.push(l[1]);
    });
    if (!miss.length) return;
    let on = true;
    Promise.all(
      miss.map(async (s) => {
        const r = await getSurahByNumber(s);
        return [s, (r && (r.name_ar || r.surah_name || r.name)) || ''];
      })
    ).then((es) => {
      if (on) setNames((p) => ({ ...p, ...Object.fromEntries(es) }));
    });
    return () => {
      on = false;
    };
  }, [data, ayahs]);

  function doFit() {
    const root = rootRef.current;
    if (!root || !data) return;
    const W = root.clientWidth;
    const H = root.clientHeight;
    if (!W || !H) return;
    const cur = fsRef.current;
    const lim = {};
    let best = Infinity;
    root.querySelectorAll('[data-line]').forEach((el) => {
      let sum = 0;
      for (let i = 0; i < el.children.length; i++) sum += el.children[i].offsetWidth;
      const n = el.children.length;
      const lfs = parseFloat(getComputedStyle(el).fontSize) || cur;
      const f = W / (sum / lfs + Math.max(0, n - 1) * GAP_EM);
      lim[el.getAttribute('data-line')] = f;
      if (f < best) best = f;
    });
    if (!isFinite(best)) return;
    const fs = Math.max(8, Math.min(best, H / ROWS / 1.5, 40));
    const ratios = {};
    for (const k in lim) ratios[k] = Number((lim[k] / fs).toFixed(3));
    try { localStorage.setItem('rattil_page_fs', String(Math.round(fs * 10) / 10)); } catch { /* ignore */ }
    setFit((p) =>
      p.ready &&
      Math.abs(p.fs - fs) < 0.05 &&
      p.W === W &&
      p.H === H &&
      JSON.stringify(p.ratios) === JSON.stringify(ratios)
        ? p
        : { fs, W, H, ratios, ready: true }
    );
  }
  doFitRef.current = doFit;

  useLayoutEffect(() => {
    fsRef.current = fit.fs;
  }, [fit.fs]);

  useLayoutEffect(() => {
    doFit();
  }, [data]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const run = () => doFitRef.current && doFitRef.current();
    const ro = new ResizeObserver(run);
    ro.observe(root);
    if (document.fonts) {
      document.fonts.addEventListener('loadingdone', run);
      document.fonts.ready.then(run);
    }
    return () => {
      ro.disconnect();
      if (document.fonts) document.fonts.removeEventListener('loadingdone', run);
    };
  }, []);

  const press = useRef(null);

  function cancelPress() {
    if (press.current) {
      clearTimeout(press.current.timer);
      press.current = null;
    }
  }

  function onPointerDown(e) {
    const el = e.target.closest('[data-k]');
    cancelPress();
    if (!el) return;
    press.current = {
      x: e.clientX,
      y: e.clientY,
      timer: setTimeout(() => {
        press.current = null;
        if (navigator.vibrate) navigator.vibrate(20);
        openAyah(el);
      }, 450),
    };
  }

  function onPointerMove(e) {
    const p = press.current;
    if (!p) return;
    if (Math.abs(e.clientX - p.x) > 10 || Math.abs(e.clientY - p.y) > 10) cancelPress();
  }

  async function openAyah(el) {
    if (!el || !onAyahClick) return;
    const [s, a] = el.getAttribute('data-k').split(':').map(Number);
    const find = (rows) => (rows || []).find((x) => x.surah_number === s && x.ayah_number === a);
    let hit = find(ayahsRef.current);
    if (!hit) {
      for (const q of [page - 1, page + 1]) {
        if (q < 1 || q > 604) continue;
        hit = find(await getAyahsByPage(q));
        if (hit) break;
      }
    }
    if (hit) onAyahClick(hit);
  }

  const nameOf = (s) => {
    const a = (ayahs || []).find((x) => x.surah_number === s && x.surah_name);
    return (a && a.surah_name) || names[s] || '';
  };

  const inHl = (k) => {
    if (!highlight) return false;
    const [s, a] = k.split(':').map(Number);
    return s === highlight.surah && a >= highlight.from && a <= highlight.to;
  };
  const rowH = fit.H / ROWS;
  const bs = Math.min(1, (rowH * 0.94) / BANNER_H) || 1;
  const rows = [];
  if (data) {
    const n = data.length;
    const pad = Math.floor((ROWS - n) / 2);
    const endsSurah = (j) => {
      const line = data[j];
      if (!line || line[0] !== 't' || !line[line.length - 1][3]) return false;
      for (let k = j + 1; k < data.length; k++) {
        if (data[k]) return data[k][0] !== 't';
      }
      const nx = pages && pages[page + 1];
      if (!nx) return true;
      for (let k = 0; k < nx.length; k++) {
        if (nx[k]) return nx[k][0] !== 't';
      }
      return false;
    };
    for (let i = 0; i < pad; i++) rows.push(<div key={'p' + i} />);
    data.forEach((line, j) => {
      if (!line) {
        rows.push(<div key={'l' + j} />);
      } else if (line[0] === 'h') {
        rows.push(
          <div key={'l' + j} className={styles.slot}>
            <div
              className={styles.bannerWrap}
              style={{
                width: fit.W / bs,
                transform: 'translateY(-50%) scale(' + bs + ')',
              }}
            >
              <SurahBanner name={nameOf(line[1])} />
            </div>
          </div>
        );
      } else if (line[0] === 'b') {
        rows.push(
          <div key={'l' + j} className={styles.basmala}>
            {basmala || FALLBACK_BASMALA}
          </div>
        );
      } else {
        const rel = fit.ratios[j] || 1;
        const forced = page <= 2 || endsSurah(j);
        const maxUp = Math.max(1, Math.min(MAX_UP, rowH / 1.3 / fit.fs));
        const centered = forced;
        const up = centered ? 1 : Math.min(rel, maxUp);
        rows.push(
          <div
            key={'l' + j}
            data-line={j}
            className={styles.line + (centered ? ' ' + styles.centered : '')}
            style={up > 1.001 ? { fontSize: 'calc(var(--fs) * ' + up.toFixed(3) + ')' } : undefined}
          >
            {lineItems(line).map((it, i) =>
              it.m ? (
                <span key={i} className={styles.marker + (inHl(it.k) ? ' ' + styles.hlMarker : '')} data-k={it.k}>
                  {it.m}
                </span>
              ) : (
                <span key={i} className={styles.word + (inHl(it.k) ? ' ' + styles.hl : '')} data-k={it.k}>
                  {it.t}
                </span>
              )
            )}
          </div>
        );
      }
    });
    for (let i = pad + n; i < ROWS; i++) rows.push(<div key={'e' + i} />);
  }

  return (
    <div
      ref={rootRef}
      className={styles.page}
      style={{ '--fs': fit.fs + 'px', visibility: fit.ready ? 'visible' : 'hidden' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={cancelPress}
      onPointerCancel={cancelPress}
      onContextMenu={(e) => e.preventDefault()}
    >
      {rows}
    </div>
  );
}
