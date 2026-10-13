import { getDb, query } from './db.js';
import { normalizeArabic } from '../utils/arabic.js';

let surahsCache = null;
let basmalaCache = null;

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

export async function listSurahs() {
  await ready();
  if (surahsCache) return surahsCache;
  const rows = await query('SELECT id, number, name_ar, name_en, ayah_count, revelation_type FROM surahs ORDER BY number');
  surahsCache = rows;
  return rows;
}

export async function getSurahByNumber(number) {
  const surahs = await listSurahs();
  return surahs.find((s) => s.number === Number(number)) || null;
}

export async function getAyahsByPage(page) {
  await ready();
  return query(
    `SELECT a.*, s.number AS surah_number, s.name_ar AS surah_name
     FROM ayahs a JOIN surahs s ON s.id = a.surah_id
     WHERE a.page = ? ORDER BY s.number, a.ayah_number`,
    [page]
  );
}

export async function getAyahsBySurah(surahNumber) {
  await ready();
  return query(
    `SELECT a.*, s.number AS surah_number, s.name_ar AS surah_name
     FROM ayahs a JOIN surahs s ON s.id = a.surah_id
     WHERE s.number = ? ORDER BY a.ayah_number`,
    [surahNumber]
  );
}

export async function getTotalPages() {
  await ready();
  const rows = await query('SELECT MAX(page) AS m FROM ayahs');
  return rows[0]?.m || 604;
}

export async function searchAyahs(term) {
  await ready();
  if (!term || !term.trim()) return [];
  const normalizedTerm = normalizeArabic(term);
  if (!normalizedTerm) return [];
  return query(
    `SELECT a.*, s.number AS surah_number, s.name_ar AS surah_name
     FROM ayahs a JOIN surahs s ON s.id = a.surah_id
     WHERE a.text_normalized LIKE ? ORDER BY s.number, a.ayah_number LIMIT 100`,
    ['%' + normalizedTerm + '%']
  );
}

export async function getAyahById(id) {
  await ready();
  const rows = await query(
    `SELECT a.*, s.number AS surah_number, s.name_ar AS surah_name
     FROM ayahs a JOIN surahs s ON s.id = a.surah_id
     WHERE a.id = ?`,
    [id]
  );
  return rows[0] || null;
}

// البسملة الحقيقية مأخوذة حرفيًا من آية 1 بسورة الفاتحة (مصدر Tanzil نفسه)
export async function getBasmalaText() {
  await ready();
  if (basmalaCache) return basmalaCache;
  const rows = await query('SELECT text FROM ayahs a JOIN surahs s ON s.id = a.surah_id WHERE s.number = 1 AND a.ayah_number = 1');
  basmalaCache = rows[0]?.text || null;
  return basmalaCache;
}

// يفصل البسملة عن بداية نص الآية الأولى لأي سورة (إن وُجدت ضمنه)
export function splitBasmala(ayahText, basmala) {
  if (!basmala) return { basmala: null, rest: ayahText };
  if (ayahText.startsWith(basmala)) {
    return { basmala, rest: ayahText.slice(basmala.length).trim() };
  }
  return { basmala: null, rest: ayahText };
}
