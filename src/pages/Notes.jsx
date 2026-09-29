import { useEffect, useState } from 'react';
import { Trash2, Pencil } from 'lucide-react';
import { PLACEHOLDER_AYAHS, PLACEHOLDER_SURAHS } from '../data/placeholder-data.js';
import { listNotes, updateNote, deleteNote } from '../database/notes.js';
import styles from './Notes.module.css';

function surahName(n) {
  return PLACEHOLDER_SURAHS.find((s) => s.number === n)?.name_ar || 'سورة ' + n;
}

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function Notes() {
  const [notes, setNotes] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState('');

  async function refresh() {
    setNotes(await listNotes());
  }

  useEffect(() => {
    refresh();
  }, []);

  function startEdit(n) {
    setEditingId(n.id);
    setDraft(n.content);
  }

  async function saveEdit(id) {
    await updateNote(id, draft);
    setEditingId(null);
    refresh();
  }

  async function handleDelete(id) {
    if (!window.confirm('حذف هذه الملاحظة؟')) return;
    await deleteNote(id);
    refresh();
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>ملاحظاتي</h1>
      {notes.length === 0 && (
        <p className="text-muted">
          لا توجد ملاحظات بعد. اضغط على أي آية في المصحف ثم «إضافة ملاحظة».
        </p>
      )}
      <div className={styles.list}>
        {notes.map((n) => {
          const ayah = PLACEHOLDER_AYAHS.find((a) => a.id === n.ayah_id);
          return (
            <div key={n.id} className={`card ${styles.item}`}>
              {ayah && (
                <>
                  <p className={styles.meta}>
                    {surahName(ayah.surah_number)} — آية {ayah.ayah_number}
                  </p>
                  <p className={styles.ayahText}>{ayah.text}</p>
                </>
              )}
              {editingId === n.id ? (
                <>
                  <textarea
                    className={styles.editBox}
                    rows={3}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                  />
                  <div className={styles.row}>
                    <button className="btn-primary" style={{ flex: 1 }} onClick={() => saveEdit(n.id)}>
                      حفظ
                    </button>
                    <button className="btn-secondary" onClick={() => setEditingId(null)}>
                      إلغاء
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className={styles.noteContent}>{n.content}</p>
                  <div className={styles.footer}>
                    <span className="text-muted">{formatDate(n.created_at)}</span>
                    <div className={styles.actions}>
                      <button onClick={() => startEdit(n)}><Pencil size={16} /></button>
                      <button onClick={() => handleDelete(n.id)}><Trash2 size={16} /></button>
                    </div>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
