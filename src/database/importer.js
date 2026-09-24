import { getDb } from './db.js';

export async function importQuranData(jsonData) {
  const db = getDb();
  const { surahs, ayahs } = jsonData;

  if (!Array.isArray(surahs) || !Array.isArray(ayahs)) {
    throw new Error('صيغة الملف غير صحيحة: يجب أن يحتوي على surahs و ayahs كمصفوفتين');
  }

  validateDataset(surahs, ayahs);

  await db.execute('BEGIN TRANSACTION');
  try {
    for (const s of surahs) {
      await db.run(
        `INSERT OR REPLACE INTO surahs (number, name_ar, name_en, ayah_count, revelation_type)
         VALUES (?, ?, ?, ?, ?)`,
        [s.number, s.name_ar, s.name_en || null, s.ayah_count, s.revelation_type || null]
      );
    }

    const surahRows = await db.query('SELECT id, number FROM surahs');
    const surahIdByNumber = {};
    (surahRows.values || []).forEach(r => { surahIdByNumber[r.number] = r.id; });

    for (const a of ayahs) {
      const surahId = surahIdByNumber[a.surah_number];
      if (!surahId) throw new Error(`سورة غير معروفة: رقم ${a.surah_number}`);
      await db.run(
        `INSERT INTO ayahs (surah_id, ayah_number, text, page, juz, hizb, rub, sajdah)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [surahId, a.ayah_number, a.text, a.page || null, a.juz || null, a.hizb || null, a.rub || null, a.sajdah ? 1 : 0]
      );
    }
    await db.execute('COMMIT');
    return { surahsImported: surahs.length, ayahsImported: ayahs.length };
  } catch (err) {
    await db.execute('ROLLBACK');
    throw err;
  }
}

function validateDataset(surahs, ayahs) {
  if (surahs.length !== 114) {
    throw new Error(`عدد السور غير صحيح: ${surahs.length} (المتوقع 114)`);
  }
  if (ayahs.length !== 6236) {
    throw new Error(`عدد الآيات غير صحيح: ${ayahs.length} (المتوقع 6236)`);
  }
  const countBySurah = {};
  ayahs.forEach(a => { countBySurah[a.surah_number] = (countBySurah[a.surah_number] || 0) + 1; });
  for (const s of surahs) {
    if (countBySurah[s.number] !== s.ayah_count) {
      throw new Error(`سورة ${s.number}: عدد الآيات ${countBySurah[s.number]} لا يطابق ${s.ayah_count}`);
    }
  }
}
