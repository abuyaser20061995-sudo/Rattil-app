import { getDb, withoutAutoSave } from './db.js';
import { normalizeArabic } from '../utils/arabic.js';

function escapeSql(value) {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'number') return String(value);
  return "'" + String(value).replace(/'/g, "''") + "'";
}

export async function importQuranData(jsonData) {
  const { surahs, ayahs } = jsonData;

  if (!Array.isArray(surahs) || !Array.isArray(ayahs)) {
    throw new Error('صيغة الملف غير صحيحة: يجب أن يحتوي على surahs و ayahs كمصفوفتين');
  }

  validateDataset(surahs, ayahs);

  return withoutAutoSave(async () => {
    const db = getDb();

    const surahValues = surahs
      .map(
        (s) =>
          '(' +
          [s.number, escapeSql(s.name_ar), escapeSql(s.name_en || null), s.ayah_count, escapeSql(s.revelation_type || null)].join(',') +
          ')'
      )
      .join(',');

    const surahSql =
      'INSERT OR REPLACE INTO surahs (number, name_ar, name_en, ayah_count, revelation_type) VALUES ' + surahValues + ';';

    await db.execute('BEGIN TRANSACTION');
    try {
      await db.execute('DELETE FROM ayahs;');
      await db.execute('DELETE FROM surahs;');
      await db.execute(surahSql);

      const surahRows = await db.query('SELECT id, number FROM surahs');
      const surahIdByNumber = {};
      (surahRows.values || []).forEach((r) => {
        surahIdByNumber[r.number] = r.id;
      });

      const BATCH_SIZE = 500;
      for (let i = 0; i < ayahs.length; i += BATCH_SIZE) {
        const batch = ayahs.slice(i, i + BATCH_SIZE);
        const values = batch
          .map((a) => {
            const surahId = surahIdByNumber[a.surah_number];
            if (!surahId) throw new Error('سورة غير معروفة: رقم ' + a.surah_number);
            return (
              '(' +
              [
                surahId,
                a.ayah_number,
                escapeSql(a.text),
                escapeSql(normalizeArabic(a.text)),
                a.page ?? 'NULL',
                a.juz ?? 'NULL',
                a.hizb ?? 'NULL',
                a.rub ?? 'NULL',
                a.sajdah ? 1 : 0
              ].join(',') +
              ')'
            );
          })
          .join(',');

        const sql =
          'INSERT INTO ayahs (surah_id, ayah_number, text, text_normalized, page, juz, hizb, rub, sajdah) VALUES ' + values + ';';
        await db.execute(sql);
      }

      await db.execute('COMMIT');
      return { surahsImported: surahs.length, ayahsImported: ayahs.length };
    } catch (err) {
      await db.execute('ROLLBACK');
      throw err;
    }
  });
}

function validateDataset(surahs, ayahs) {
  if (surahs.length !== 114) {
    throw new Error('عدد السور غير صحيح: ' + surahs.length + ' (المتوقع 114)');
  }
  if (ayahs.length !== 6236) {
    throw new Error('عدد الآيات غير صحيح: ' + ayahs.length + ' (المتوقع 6236)');
  }
  const countBySurah = {};
  ayahs.forEach((a) => {
    countBySurah[a.surah_number] = (countBySurah[a.surah_number] || 0) + 1;
  });
  for (const s of surahs) {
    if (countBySurah[s.number] !== s.ayah_count) {
      throw new Error('سورة ' + s.number + ': عدد الآيات ' + countBySurah[s.number] + ' لا يطابق ' + s.ayah_count);
    }
  }
}
