import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSurahs } from '../../hooks/useQuran.js'

export default function Surahs() {
  const surahs = useSurahs()
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  const filtered = useMemo(() => {
    if (!surahs) return []
    const q = query.trim()
    if (!q) return surahs
    return surahs.filter((s) => s.name.includes(q) || String(s.id) === q)
  }, [surahs, query])

  return (
    <div className="p-4 space-y-4" dir="rtl">
      <h1 className="text-xl font-bold text-primary-700 dark:text-primary-300">السور</h1>

      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="ابحث عن سورة..."
        className="w-full rounded-xl2 border border-primary-100 dark:border-primary-900 bg-surface-lightAlt dark:bg-surface-darkAlt px-4 py-2.5 text-sm outline-none focus:border-primary-500"
      />

      <div className="divide-y divide-primary-50 dark:divide-primary-900/40">
        {filtered.map((surah) => (
          <button
            key={surah.id}
            onClick={() => navigate(`/quran/surah/${surah.id}`)}
            className="w-full flex items-center justify-between py-3 text-right"
          >
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 flex items-center justify-center rounded-full bg-primary-50 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 text-xs font-bold">
                {surah.id}
              </span>
              <div>
                <p className="font-quran text-lg">{surah.name}</p>
                <p className="text-xs text-ink-light/60 dark:text-ink-dark/60">
                  {surah.ayahCount} آية · {surah.revelationType}
                </p>
              </div>
            </div>
            <span className="text-primary-500">‹</span>
          </button>
        ))}

        {filtered.length === 0 && (
          <p className="text-center text-sm text-ink-light/50 py-8">لا توجد نتائج</p>
        )}
      </div>
    </div>
  )
}
