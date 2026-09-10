import Dexie from 'dexie'

export const db = new Dexie('RattilDB')

db.version(1).stores({
  surahs: 'id, name, ayahCount, revelationType',
  ayahs: 'id, surahId, ayahNumber, pageNumber, juzNumber',
  pages: 'pageNumber, juzNumber',
  juz: 'id, startPage',
  bookmarks: '++id, ayahId, createdAt',
  notes: '++id, ayahId, text, createdAt',
  memorizationProgress: 'ayahId, status, lastReviewedAt',
  reviewItems: '++id, ayahId, dueDate, interval',
  memorizationPlans: '++id, surahId, startAyah, endAyah, durationDays, ayahsPerDay, startDate',
  readingHistory: '++id, ayahId, timestamp',
  listeningHistory: '++id, ayahId, timestamp, durationSec',
  recitationSessions: '++id, type, startAyah, endAyah, date, resultsSummary',
  recitationErrors: '++id, ayahId, sessionId, errorType, timestamp',
  settings: 'key, value',
  downloads: 'contentId, type, sizeBytes, downloadedAt'
})

export default db
