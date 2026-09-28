import { useEffect, useState } from 'react';
import { Trash2, Pencil, Plus } from 'lucide-react';
import { PLACEHOLDER_AYAHS, PLACEHOLDER_SURAHS } from '../data/placeholder-data.js';
import {
  listCollections,
  createCollection,
  renameCollection,
  deleteCollection,
  getCollectionAyahIds,
  removeAyahFromCollection
} from '../database/collections.js';
import styles from './Ayati.module.css';

export default function Ayati() {
  const [collections, setCollections] = useState([]);
  const [open, setOpen] = useState(null);
  const [ayahIds, setAyahIds] = useState([]);
  const [error, setError] = useState('');

  async function refresh() {
    try {
      setCollections(await listCollections());
      setError('');
    } catch (e) {
      setError(e?.message || String(e));
    }
  }

  async function openCollection(c) {
    setOpen(c);
    setAyahIds(await getCollectionAyahIds(c.id));
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleCreate() {
    const name = window.prompt('اسم المجموعة الجديدة');
    if (!name || !name.trim()) return;
    await createCollection(name.trim(), '📖');
    refresh();
  }

  async function handleRename() {
    const name = window.prompt('الاسم الجديد', open.name);
    if (!name || !name.trim()) return;
    await renameCollection(open.id, name.trim());
    setOpen({ ...open, name: name.trim() });
    refresh();
  }

  async function handleDelete() {
    if (!window.confirm('حذف مجموعة «' + open.name + '»؟')) return;
    await deleteCollection(open.id);
    setOpen(null);
    refresh();
  }

  async function handleRemove(ayahId) {
    await removeAyahFromCollection(open.id, ayahId);
    setAyahIds(await getCollectionAyahIds(open.id));
    refresh();
  }

  function surahName(n) {
    return PLACEHOLDER_SURAHS.find((s) => s.number === n)?.name_ar || '';
  }

  if (open) {
    return (
      <div className={styles.page}>
        <button className={styles.back} onClick={() => setOpen(null)}>← آياتي</button>
        <div className={styles.detailHeader}>
          <h1 className={styles.title}>{open.icon} {open.name}</h1>
          <div className={styles.headerActions}>
            <button onClick={handleRename}><Pencil size={18} /></button>
            <button onClick={handleDelete}><Trash2 size={18} /></button>
          </div>
        </div>
        {ayahIds.length === 0 && (
          <p className="text-muted">لا توجد آيات بعد. اضغط على أي آية في المصحف ثم «حفظ في آياتي».</p>
        )}
        <div className={styles.list}>
          {ayahIds.map((id) => {
            const a = PLACEHOLDER_AYAHS.find((x) => x.id === id);
            if (!a) return null;
            return (
              <div key={id} className={`card ${styles.item}`}>
                <div className={styles.itemText}>
                  <p className={styles.itemMeta}>{surahName(a.surah_number)} — آية {a.ayah_number}</p>
                  <p className={styles.itemAyah}>{a.text}</p>
                </div>
                <button onClick={() => handleRemove(id)}><Trash2 size={16} /></button>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.detailHeader}>
        <h1 className={styles.title}>آياتي</h1>
        <button className={styles.addBtn} onClick={handleCreate}>
          <Plus size={16} /> مجموعة
        </button>
      </div>
      {error && <p className={styles.error}>{error}</p>}
      <div className={styles.list}>
        {collections.map((c) => (
          <button key={c.id} className={`card ${styles.collection}`} onClick={() => openCollection(c)}>
            <span className={styles.icon}>{c.icon}</span>
            <span className={styles.collName}>{c.name}</span>
            <span className="text-muted">{c.item_count}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
