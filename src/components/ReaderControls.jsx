import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Type } from 'lucide-react';
import styles from './ReaderControls.module.css';

const MIN = 0.6;
const MAX = 2.4;

export default function ReaderControls({ mode, setMode, scale, setScale }) {
  const [open, setOpen] = useState(false);
  const pct = Math.round(scale * 100);
  const clamp = (v) => Math.min(MAX, Math.max(MIN, Math.round(v * 10) / 10));

  return (
    <>
      <button className={styles.btn} onClick={() => setOpen(true)} aria-label="إعدادات القراءة">
        <Type size={18} />
      </button>
      {open && createPortal(
        <div className={styles.overlay} onClick={() => setOpen(false)}>
          <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
            <p className={styles.title}>إعدادات القراءة</p>
            <div className={styles.seg}>
              <button
                className={mode === 'pages' ? styles.segActive : styles.segBtn}
                onClick={() => setMode('pages')}
              >
                📖 صفحة المصحف
              </button>
              <button
                className={mode === 'flow' ? styles.segActive : styles.segBtn}
                onClick={() => setMode('flow')}
              >
                📝 نص مرن
              </button>
            </div>

            {mode === 'flow' ? (
              <>
                <p className={styles.label}>حجم الخط: {pct}٪</p>
                <div className={styles.sizeRow}>
                  <button className={styles.round} onClick={() => setScale(clamp(scale - 0.1))}>−</button>
                  <input
                    className={styles.range}
                    type="range"
                    min={MIN * 100}
                    max={MAX * 100}
                    step="10"
                    value={pct}
                    onChange={(e) => setScale(clamp(Number(e.target.value) / 100))}
                  />
                  <button className={styles.round} onClick={() => setScale(clamp(scale + 0.1))}>+</button>
                </div>
                <button className={styles.reset} onClick={() => setScale(1)}>
                  الحجم الأصلي (مثل صفحة المصحف)
                </button>
              </>
            ) : (
              <p className={styles.note}>
                للتكبير أو التصغير اختر «نص مرن». الحجم الأصلي فيه يساوي حجم خط صفحة المصحف.
              </p>
            )}

            <button className={styles.done} onClick={() => setOpen(false)}>تم</button>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
