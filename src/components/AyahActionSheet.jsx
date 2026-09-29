import { useState } from 'react';
import { Headphones, Brain, RotateCcw, Star, StickyNote, BookOpen, Copy, X } from 'lucide-react';
import { addToFavorites } from '../database/collections.js';
import { addAyahToMemorization } from '../database/memorization.js';
import { addToReview } from '../database/review.js';
import { addNote } from '../database/notes.js';
import { PLACEHOLDER_SURAHS } from '../data/placeholder-data.js';
import styles from './AyahActionSheet.module.css';

export default function AyahActionSheet({ ayah, onClose }) {
  const [message, setMessage] = useState('');
  const [noteMode, setNoteMode] = useState(false);
  const [noteText, setNoteText] = useState('');

  function surahOf() {
    return PLACEHOLDER_SURAHS.find((s) => s.number === ayah.surah_number);
  }

  async function saveToAyati() {
    try {
      await addToFavorites(ayah.id);
      setMessage('تمت الإضافة إلى المفضلة ✓');
      setTimeout(onClose, 900);
    } catch (e) {
      setMessage('تعذر الحفظ: ' + (e?.message || ''));
    }
  }

  async function addToMemorization() {
    try {
      await addAyahToMemorization(ayah.surah_number, surahOf().ayah_count, ayah.ayah_number);
      setMessage('أُضيفت إلى الحفظ ✓');
      setTimeout(onClose, 900);
    } catch (e) {
      setMessage(e?.message || 'تعذر الإضافة');
    }
  }

  async function addToReviewAction() {
    try {
      const r = await addToReview(
        ayah.surah_number,
        surahOf().ayah_count,
        ayah.ayah_number,
        ayah.ayah_number
      );
      setMessage(r === 'exists' ? 'الآية موجودة بالفعل في المراجعة' : 'أُضيفت إلى المراجعة ✓');
      setTimeout(onClose, 900);
    } catch (e) {
      setMessage(e?.message || 'تعذر الإضافة');
    }
  }

  async function submitNote() {
    try {
      await addNote(ayah.id, noteText);
      setMessage('أُضيفت الملاحظة ✓');
      setTimeout(onClose, 900);
    } catch (e) {
      setMessage(e?.message || 'تعذر الحفظ');
    }
  }

  if (noteMode) {
    return (
      <div className={styles.overlay} onClick={onClose}>
        <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
          <div className={styles.header}>
            <span className="text-muted">ملاحظة على آية {ayah.ayah_number}</span>
            <button onClick={onClose}><X size={20} /></button>
          </div>
          <textarea
            className={styles.noteInput}
            rows={4}
            placeholder="اكتب ما تريد أن تتذكره عن هذه الآية..."
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
          />
          {message && <p className={styles.noteMessage}>{message}</p>}
          <button className="btn-primary" style={{ width: '100%' }} onClick={submitNote}>
            حفظ الملاحظة
          </button>
        </div>
      </div>
    );
  }

  const actions = [
    { icon: Headphones, label: 'استماع', onPress: onClose },
    { icon: Brain, label: 'إضافة للحفظ', onPress: addToMemorization },
    { icon: RotateCcw, label: 'إضافة للمراجعة', onPress: addToReviewAction },
    { icon: Star, label: 'حفظ في آياتي', onPress: saveToAyati },
    { icon: StickyNote, label: 'إضافة ملاحظة', onPress: () => setNoteMode(true) },
    { icon: BookOpen, label: 'التفسير', onPress: onClose },
    { icon: Copy, label: 'نسخ', onPress: onClose }
  ];

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <span className="text-muted">{message || 'آية رقم ' + ayah.ayah_number}</span>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <div className={styles.actions}>
          {actions.map(({ icon: Icon, label, onPress }) => (
            <button key={label} className={styles.actionBtn} onClick={onPress}>
              <Icon size={20} color="var(--color-primary)" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
