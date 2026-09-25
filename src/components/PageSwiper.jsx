import { useRef, useState } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import styles from './PageSwiper.module.css';

export default function PageSwiper({ pageNumber, totalPages, onChange, children }) {
  const startX = useRef(null);

  function handleTouchStart(e) {
    startX.current = e.touches[0].clientX;
  }

  function handleTouchEnd(e) {
    if (startX.current === null) return;
    const diff = e.changedTouches[0].clientX - startX.current;
    if (Math.abs(diff) < 60) return;
    // سحب لليمين (diff موجب) = الصفحة التالية، سحب لليسار (diff سالب) = الصفحة السابقة
    if (diff > 0 && pageNumber < totalPages) onChange(pageNumber + 1);
    if (diff < 0 && pageNumber > 1) onChange(pageNumber - 1);
    startX.current = null;
  }

  return (
    <div
      className={styles.wrapper}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className={styles.pageArea}>{children}</div>
      <div className={styles.footer}>
        <button
          className={styles.navBtn}
          disabled={pageNumber >= totalPages}
          onClick={() => onChange(pageNumber + 1)}
        >
          <ChevronRight size={20} />
        </button>
        <span className={styles.pageLabel}>صفحة {pageNumber} / {totalPages}</span>
        <button
          className={styles.navBtn}
          disabled={pageNumber <= 1}
          onClick={() => onChange(pageNumber - 1)}
        >
          <ChevronLeft size={20} />
        </button>
      </div>
    </div>
  );
}
