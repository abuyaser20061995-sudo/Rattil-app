import { getDb, query, run } from './db.js';

const DEFAULTS = [
  { name: 'المفضلة', icon: '⭐' },
  { name: 'للحفظ', icon: '🧠' },
  { name: 'للتدبر', icon: '💭' },
  { name: 'للصلاة', icon: '🕌' },
  { name: 'آيات أحبها', icon: '❤️' }
];

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

let ensurePromise = null;

async function doEnsure() {
  await ready();
  const rows = await query('SELECT COUNT(*) AS c FROM collections');
  if ((rows[0]?.c || 0) > 0) return;
  for (const d of DEFAULTS) {
    await run('INSERT INTO collections (name, icon, created_at) VALUES (?, ?, ?)', [
      d.name,
      d.icon,
      new Date().toISOString()
    ]);
  }
}

export function ensureDefaultCollections() {
  if (!ensurePromise) ensurePromise = doEnsure();
  return ensurePromise;
}

export async function listCollections() {
  await ensureDefaultCollections();
  return query(
    `SELECT c.id, c.name, c.icon,
       (SELECT COUNT(*) FROM collection_items i WHERE i.collection_id = c.id) AS item_count
     FROM collections c ORDER BY c.id`
  );
}

export async function createCollection(name, icon = '⭐') {
  await ready();
  await run('INSERT INTO collections (name, icon, created_at) VALUES (?, ?, ?)', [
    name,
    icon,
    new Date().toISOString()
  ]);
}

export async function renameCollection(id, name) {
  await ready();
  await run('UPDATE collections SET name = ? WHERE id = ?', [name, id]);
}

export async function deleteCollection(id) {
  await ready();
  await run('DELETE FROM collection_items WHERE collection_id = ?', [id]);
  await run('DELETE FROM collections WHERE id = ?', [id]);
}

export async function getCollectionAyahIds(collectionId) {
  await ready();
  const rows = await query(
    'SELECT ayah_id FROM collection_items WHERE collection_id = ? ORDER BY id',
    [collectionId]
  );
  return rows.map((r) => r.ayah_id);
}

export async function addAyahToCollection(collectionId, ayahId) {
  await ready();
  const exists = await query(
    'SELECT id FROM collection_items WHERE collection_id = ? AND ayah_id = ?',
    [collectionId, ayahId]
  );
  if (exists.length > 0) return;
  await run('INSERT INTO collection_items (collection_id, ayah_id) VALUES (?, ?)', [
    collectionId,
    ayahId
  ]);
}

export async function removeAyahFromCollection(collectionId, ayahId) {
  await ready();
  await run('DELETE FROM collection_items WHERE collection_id = ? AND ayah_id = ?', [
    collectionId,
    ayahId
  ]);
}

export async function addToFavorites(ayahId) {
  await ensureDefaultCollections();
  const rows = await query("SELECT id FROM collections WHERE name = 'المفضلة' LIMIT 1");
  if (rows.length === 0) throw new Error('مجموعة المفضلة غير موجودة');
  await addAyahToCollection(rows[0].id, ayahId);
}
