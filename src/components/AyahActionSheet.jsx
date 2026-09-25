import { Headphones, Brain, RotateCcw, Star, StickyNote, BookOpen, Copy, X } from 'lucide-react';
import styles from './AyahActionSheet.module.css';

const actions = [
  { icon: Headphones, label: 'استماع' },
  { icon: Brain, label: 'إضافة للحفظ' },
  { icon: RotateCcw, label: 'إضافة للمراجعة' },
  { icon: Star, label: 'حفظ في آياتي' },
  { icon: StickyNote, label: 'إضافة ملاحظة' },
  { icon: BookOpen, label: 'التفسير' },
  { icon: Copy, label: 'نسخ' }
];

export default function AyahActionSheet({ ayah, onClose }) {
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.sheet} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <span className="text-muted">آية رقم {ayah.ayah_number}</span>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <div className={styles.actions}>
          {actions.map(({ icon: Icon, label }) => (
            <button key={label} className={styles.actionBtn} onClick={onClose}>
              <Icon size={20} color="var(--color-primary)" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
