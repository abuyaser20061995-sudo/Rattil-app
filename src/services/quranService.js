import { db } from '../db/database.js'

const QURAN_API_URL = 'https://api.alquran.cloud/v1/quran/quran-uthmani'

export async function isQuranDownloaded() {
  const count = await db.surahs.count()
  return count > 0
}

export async function downloadFullQuran(onProgress) {
  onProgress?.(5)

  const response = await fetch(QURAN_API_URL)
  if (!response.ok) {
    throw new Error('تعذّر تحميل بيانات القرآن، تحقق من الاتصال بالإنترنت وحاول مجددًا')
  }
  const json = await response.json()
  const surahsData = json.data.surahs

  onProgress?.(35)

  const surahsToInsert = []
  const ayahsToInsert = []

  surahsData.forEach((surah) => {
    surahsToInsert.push({
      id: surah.number,
      name: surah.name,
      englishName: surah.englishName,
      ayahCount: surah.ayahs.length,
      revelationType: surah.revelationType === 'Meccan' ? 'مكية' : 'مدنية'
    })

    surah.ayahs.forEach((ayah) => {
      ayahsToInsert.push({
        id: ayah.number,
        surahId: surah.number,
        ayahNumber: ayah.numberInSurah,
        pageNumber: ayah.page,
        juzNumber: ayah.juz,
        text: ayah.text
      })
    })
  })

  onProgress?.(65)

  await db.transaction('rw', db.surahs, db.ayahs, db.downloads, async () => {
    await db.surahs.bulkPut(surahsToInsert)
    await db.ayahs.bulkPut(ayahsToInsert)
    await db.downloads.put({
      contentId: 'quran-text-uthmani',
      type: 'quranData',
      sizeBytes: new Blob([JSON.stringify(json)]).size,
      downloadedAt: Date.now()
    })
  })

  onProgress?.(100)
}

export async function getAllSurahs() {
  return db.surahs.orderBy('id').toArray()
}

export async function getSurahById(id) {
  return db.surahs.get(Number(id))
}

export async function getAyahsBySurah(surahId) {
  return db.ayahs.where('surahId').equals(Number(surahId)).sortBy('ayahNumber')
}

export async function searchAyahs(query) {
  const q = (query || '').trim()
  if (q.length < 2) return []
  return db.ayahs.filter((ayah) => ayah.text.includes(q)).limit(50).toArray()
      }
