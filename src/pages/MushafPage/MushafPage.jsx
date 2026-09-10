import { useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/database.js'

const TOTAL_PAGES = 604

export default function MushafPage() {
  const { pageNumber: pageParam } = useParams()
  const navigate = useNavigate()
  const page = Math.min(Math.max(Number(pageParam) || 1, 1), TOTAL_PAGES)

  const ayahs = useLiveQuery(
    () => db.ayahs.where('pageNumber').equals(page).sortBy('id'),
    [page],
    []
  )

  const allSurahs = useLiveQuery(() => db.surahs.toArray(), [], [])
  const surahById = useMemo(() => {
    const map = {}
    ;(allSurahs || []).forEach((s) => { map[s.id] = s })
    return map
  }, [allSurahs])

  const juzNumber = ayahs?.[0]?.juzNumber

  const goToPage = (p) => {
    if (p < 1 || p > TOTAL_PAGES) return
    navigate(`/quran/page/${p}`, { replace: true })
  }

  return (
    <div dir="rtl" className="min-h-screen bg-[#0B0E0B] text-[#F4F1E9] flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 text-xs text-[#C9BE9E]">
        <button onClick={() => navigate(-1)} className="text-sm">‹ رجوع</button>
        <span>الجزء {juzNumber || '—'}</span>
      </div>

      <div className="flex-1 px-5 pb-6">
        {ayahs?.map((ayah) => {
          const surah = surahById[ayah.surahId]
          const showHeader = ayah.ayahNumber === 1
          const showBismillah = showHeader && ayah.surahId !== 1 && ayah.surahId !== 9

          return (
            <div key={ayah.id}>
              {showHeader && surah && (
                <div className="my-5 text-center">
                  <div className="border border-[#C9BE9E]/50 rounded-lg py-2 px-4 inline-block">
                    <span className="font-quran text-lg text-[#C9BE9E]">سورة {surah.name}</span>
                  </div>
                  {showBismillah && (
                    <p className="font-quran text-2xl mt-4 mb-2">
                      بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                    </p>
                  )}
                </div>
              )}
              <span className="font-quran text-[1.6rem] leading-[3rem] text-justify">
                {ayah.text}{' '}
                <span className="inline-flex items-center justify-center w-7 h-7 mx-1 rounded-full border border-[#C9BE9E] text-[0.7rem] text-[#C9BE9E] align-middle">
                  {ayah.ayahNumber}
                </span>{' '}
              </span>
            </div>
          )
        })}
      </div>

      <div className="flex items-center justify-between px-5 py-4 border-t border-[#C9BE9E]/20 text-[#C9BE9E]">
        <button
          onClick={() => goToPage(page - 1)}
          disabled={page <= 1}
          className="text-sm disabled:opacity-30"
        >
          ‹ السابقة
        </button>
        <span className="text-sm font-semibold">{page}</span>
        <button
          onClick={() => goToPage(page + 1)}
          disabled={page >= TOTAL_PAGES}
          className="text-sm disabled:opacity-30"
        >
          التالية ›
        </button>
      </div>
    </div>
  )
}
