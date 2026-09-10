import { useState, useEffect, useCallback } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/database.js'
import { isQuranDownloaded, downloadFullQuran } from '../services/quranService.js'

export function useQuranDownload() {
  const [status, setStatus] = useState('checking') // checking | needed | downloading | ready | error
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState(null)

  useEffect(() => {
    isQuranDownloaded().then((ok) => setStatus(ok ? 'ready' : 'needed'))
  }, [])

  const startDownload = useCallback(async () => {
    setStatus('downloading')
    setError(null)
    try {
      await downloadFullQuran(setProgress)
      setStatus('ready')
    } catch (err) {
      setError(err.message)
      setStatus('error')
    }
  }, [])

  return { status, progress, error, startDownload }
}

export function useSurahs() {
  return useLiveQuery(() => db.surahs.orderBy('id').toArray(), [], [])
}

export function useSurah(surahId) {
  return useLiveQuery(() => db.surahs.get(Number(surahId)), [surahId])
}

export function useAyahsBySurah(surahId) {
  return useLiveQuery(
    () => db.ayahs.where('surahId').equals(Number(surahId)).sortBy('ayahNumber'),
    [surahId],
    []
  )
}
