import { getDb, query, run } from './db.js';

async function ready() {
  for (let i = 0; i < 50; i++) {
    try {
      getDb();
      return;
    } catch {
      await new Promise((r) => setTimeout(r, 200));
    }
  }
  throw new Error('قاعدة البيانات غير جاهزة');
}

export async function listNotes() {
  await ready();
  return query('SELECT * FROM notes ORDER BY id DESC');
}

export async function addNote(ayahId, content) {
  await ready();
  if (!content || !content.trim()) throw new Error('الملاحظة فارغة');
  const now = new Date().toISOString();
  await run('INSERT INTO notes (ayah_id, content, created_at, updated_at) VALUES (?, ?, ?, ?)', [
    ayahId,
    content.trim(),
    now,
    now
  ]);
}

export async function updateNote(id, content) {
  await ready();
  if (!content || !content.trim()) throw new Error('الملاحظة فارغة');
  await run('UPDATE notes SET content = ?, updated_at = ? WHERE id = ?', [
    content.trim(),
    new Date().toISOString(),
    id
  ]);
}

export async function deleteNote(id) {
  await ready();
  await run('DELETE FROM notes WHERE id = ?', [id]);
}
