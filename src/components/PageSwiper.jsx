import { useLayoutEffect, useRef } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import styles from './PageSwiper.module.css';

const PERSPECTIVE = 4000;
const CAST_WIDTH = 90;

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const easeOut = (t) => 1 - Math.pow(1 - t, 3);
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export default function PageSwiper({ pageNumber, totalPages, onChange, children, footerExtra }) {
  const wrapRef = useRef(null);
  const pageRef = useRef(null);
  const drag = useRef(null);
  const busy = useRef(false);
  const layers = useRef(null);
  const rafId = useRef(0);
  const pending = useRef(null);
  const timers = useRef([]);

  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    if (wrap && getComputedStyle(wrap).position === 'static') {
      wrap.style.position = 'relative';
    }
    return () => {
      cancelAnimationFrame(rafId.current);
      timers.current.forEach(clearTimeout);
      pending.current = null;
    };
  }, []);

  // بعد ما يتغيّر رقم الصفحة ننتظر إطارين حتى يُرسم المحتوى الجديد
  function layout() {
    const wrap = wrapRef.current;
    const area = pageRef.current;
    if (!wrap || !area) return;
    const nav = document.querySelector('nav');
    const navH = nav ? nav.offsetHeight : 76;
    const top = wrap.getBoundingClientRect().top + window.scrollY;
    wrap.style.height = Math.max(300, window.innerHeight - top - navH - 4) + 'px';

    const list = area.firstElementChild;
    if (!list) return;
    list.style.fontSize = '';
    const cs = getComputedStyle(area);
    const avail = area.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    if (list.offsetHeight <= avail) return;
    let lo = 11;
    let hi = parseFloat(getComputedStyle(list).fontSize);
    for (let i = 0; i < 9; i++) {
      const mid = (lo + hi) / 2;
      list.style.fontSize = mid + 'px';
      if (list.offsetHeight <= avail) lo = mid;
      else hi = mid;
    }
    list.style.fontSize = lo + 'px';
  }

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
    const html = document.documentElement;
    const prev = [html.style.overflow, document.body.style.overflow];
    html.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    const onChangeLayout = () => layout();
    window.addEventListener('resize', onChangeLayout);
    if (document.fonts) {
      document.fonts.addEventListener('loadingdone', onChangeLayout);
      document.fonts.ready.then(onChangeLayout);
    }
    return () => {
      window.removeEventListener('resize', onChangeLayout);
      if (document.fonts) document.fonts.removeEventListener('loadingdone', onChangeLayout);
      html.style.overflow = prev[0];
      document.body.style.overflow = prev[1];
    };
  }, []);

  useLayoutEffect(() => {
    layout();
  });

  useLayoutEffect(() => {
    const fn = pending.current;
    if (!fn) return;
    pending.current = null;
    requestAnimationFrame(() => requestAnimationFrame(fn));
  }, [pageNumber]);

  function runAfterChange(fn) {
    let called = false;
    const once = () => {
      if (called) return;
      called = true;
      fn();
    };
    pending.current = once;
    timers.current.push(
      setTimeout(() => {
        if (pending.current === once) pending.current = null;
        once();
      }, 700)
    );
  }

  function getBox() {
    const p = pageRef.current;
    return { top: p.offsetTop, left: p.offsetLeft, width: p.offsetWidth, height: p.offsetHeight };
  }

  function placeAbs(el, box) {
    Object.assign(el.style, {
      position: 'absolute',
      top: box.top + 'px',
      left: box.left + 'px',
      width: box.width + 'px',
      height: box.height + 'px',
      margin: '0',
      boxSizing: 'border-box',
      pointerEvents: 'none',
    });
  }

  // نسخة ثابتة من الصفحة الحالية (صورة للمحتوى)
  function snapshot(box) {
    const el = pageRef.current.cloneNode(true);
    placeAbs(el, box);
    el.style.background = 'var(--color-bg)';
    el.style.overflow = 'hidden';
    el.style.visibility = 'visible';
    el.style.transform = 'none';
    el.setAttribute('aria-hidden', 'true');
    return el;
  }

  // الورقة التي تنقلب: نسخة + تظليل داخلها + ظل ساقط على ما تحتها
  function buildLeaf(box) {
    const wrap = wrapRef.current;
    const leaf = snapshot(box);
    leaf.style.transformOrigin = 'right center';
    leaf.style.willChange = 'transform';

    const shade = document.createElement('div');
    Object.assign(shade.style, {
      position: 'absolute',
      inset: '0',
      pointerEvents: 'none',
      opacity: '0',
      background:
        'linear-gradient(to right, rgba(0,0,0,.38), rgba(0,0,0,0) 60%, rgba(0,0,0,.10))',
    });
    leaf.appendChild(shade);

    const castWrap = document.createElement('div');
    placeAbs(castWrap, box);
    castWrap.style.overflow = 'hidden';
    const cast = document.createElement('div');
    Object.assign(cast.style, {
      position: 'absolute',
      top: '0',
      left: '0',
      height: '100%',
      width: CAST_WIDTH + 'px',
      opacity: '0',
      background: 'linear-gradient(to left, rgba(0,0,0,.34), rgba(0,0,0,0))',
    });
    castWrap.appendChild(cast);

    wrap.appendChild(castWrap);
    wrap.appendChild(leaf);
    return { leaf, shade, cast, castWrap, box, under: null };
  }

  // deg = زاوية انقلاب الورقة حول الكعب (0 = مسطّحة، 90 = على حافتها)
  function pose(L, deg) {
    const rad = (deg * Math.PI) / 180;
    const s = Math.sin(rad);
    const c = Math.cos(rad);
    const w = L.box.width;
    L.leaf.style.transform = `perspective(${PERSPECTIVE}px) rotateY(${deg}deg)`;
    L.shade.style.opacity = String(0.9 * s);
    const edge = w - (w * c * PERSPECTIVE) / (PERSPECTIVE - w * s);
    L.cast.style.left = edge - CAST_WIDTH + 'px';
    L.cast.style.opacity = String(0.9 * Math.sin(2 * rad));
  }

  function cleanup() {
    const L = layers.current;
    if (L) {
      L.leaf.remove();
      L.castWrap.remove();
      if (L.under) L.under.remove();
    }
    layers.current = null;
    if (pageRef.current) pageRef.current.style.visibility = '';
    busy.current = false;
  }

  function animate(from, to, duration, ease, step, done) {
    cancelAnimationFrame(rafId.current);
    const t0 = performance.now();
    const frame = (now) => {
      const t = clamp((now - t0) / duration, 0, 1);
      step(from + (to - from) * ease(t));
      if (t < 1) rafId.current = requestAnimationFrame(frame);
      else done();
    };
    rafId.current = requestAnimationFrame(frame);
  }

  // الصفحة التالية: الورقة الحالية تنقلب وتكشف الجديدة تحتها
  function runNext(fromDeg) {
    if (busy.current || pageNumber >= totalPages) return;
    busy.current = true;
    if (!layers.current) {
      layers.current = buildLeaf(getBox());
      pose(layers.current, fromDeg);
      pageRef.current.style.visibility = 'hidden';
    }
    runAfterChange(() => {
      if (pageRef.current) pageRef.current.style.visibility = '';
    });
    onChange(pageNumber + 1);
    const dur = 240 + 260 * (1 - fromDeg / 90);
    animate(
      fromDeg,
      90,
      dur,
      fromDeg > 0 ? easeOut : easeInOut,
      (d) => layers.current && pose(layers.current, d),
      cleanup
    );
  }

  // إلغاء التقليب: الورقة ترجع لمكانها
  function cancelNext(fromDeg) {
    busy.current = true;
    animate(
      fromDeg,
      0,
      120 + 220 * (fromDeg / 90),
      easeOut,
      (d) => layers.current && pose(layers.current, d),
      cleanup
    );
  }

  // الصفحة السابقة: الورقة الجديدة ترجع من جهة الكعب وتنطبق فوق الحالية
  function runPrev() {
    if (busy.current || pageNumber <= 1) return;
    busy.current = true;
    const wrap = wrapRef.current;
    const under = snapshot(getBox());
    wrap.insertBefore(under, wrap.firstChild);
    pageRef.current.style.visibility = 'hidden';
    runAfterChange(() => {
      if (!wrapRef.current || !pageRef.current) return;
      const L = buildLeaf(getBox());
      L.under = under;
      layers.current = L;
      pose(L, 90);
      animate(90, 0, 420, easeInOut, (d) => pose(L, d), cleanup);
    });
    onChange(pageNumber - 1);
  }

  function onTouchStart(e) {
    if (busy.current || e.touches.length !== 1) {
      drag.current = null;
      return;
    }
    const t = e.touches[0];
    drag.current = {
      x0: t.clientX,
      y0: t.clientY,
      lastX: t.clientX,
      lastT: performance.now(),
      mode: null,
      deg: 0,
      dx: 0,
      vx: 0,
    };
  }

  function onTouchMove(e) {
    const d = drag.current;
    if (!d || busy.current) return;
    const t = e.touches[0];
    const dx = t.clientX - d.x0;
    const dy = t.clientY - d.y0;
    const now = performance.now();
    d.vx = (t.clientX - d.lastX) / Math.max(1, now - d.lastT);
    d.lastX = t.clientX;
    d.lastT = now;
    d.dx = dx;

    if (!d.mode) {
      if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
      if (Math.abs(dy) > Math.abs(dx)) {
        d.mode = 'scroll';
        return;
      }
      if (dx > 0 && pageNumber < totalPages) {
        d.mode = 'next';
        layers.current = buildLeaf(getBox());
        pageRef.current.style.visibility = 'hidden';
      } else if (dx < 0 && pageNumber > 1) {
        d.mode = 'prev';
      } else {
        d.mode = 'none';
      }
    }

    if (d.mode === 'next' && layers.current) {
      // الحافة الحرة للورقة تتبع الإصبع بالضبط
      const f = clamp(Math.max(0, dx - 10) / layers.current.box.width, 0, 1);
      d.deg = (Math.acos(1 - f) * 180) / Math.PI;
      pose(layers.current, d.deg);
    }
  }

  function onTouchEnd() {
    const d = drag.current;
    drag.current = null;
    if (!d || busy.current) return;
    if (d.mode === 'next' && layers.current) {
      const commit = d.dx > 70 || (d.vx > 0.5 && d.dx > 30);
      if (commit) runNext(d.deg);
      else cancelNext(d.deg);
    } else if (d.mode === 'prev') {
      if (d.dx < -70 || (d.vx < -0.5 && d.dx < -30)) runPrev();
    }
  }

  function onTouchCancel() {
    const d = drag.current;
    drag.current = null;
    if (d && d.mode === 'next' && layers.current && !busy.current) cancelNext(d.deg);
  }

  return (
    <div
      ref={wrapRef}
      className={styles.wrapper}
      style={{ touchAction: 'pan-y' }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchCancel}
    >
      <div className={styles.pageArea} ref={pageRef}>{children}</div>
      <div className={styles.footer}>
        <button
          className={styles.navBtn}
          disabled={pageNumber <= 1}
          onClick={() => runPrev()}
        >
          <ChevronRight size={20} />
        </button>
        <span className={styles.pageLabel}>صفحة {pageNumber} / {totalPages}</span>
        <button
          className={styles.navBtn}
          disabled={pageNumber >= totalPages}
          onClick={() => runNext(0)}
        >
          <ChevronLeft size={20} />
        </button>
        {footerExtra && <div className={styles.extra}>{footerExtra}</div>}
      </div>
    </div>
  );
}
