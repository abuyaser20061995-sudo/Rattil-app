import { useParams, useNavigate } from 'react-router-dom'
import { useSurah, useAyahsBySurah } from '../../hooks/useQuran.js'

export default function SurahDetail() {
  const { surahId } = useParams()
  const navigate = useNavigate()
  const surah = useSurah(surahId)
  const ayahs = useAyahsBySurah(surahId)

  if (!surah) {
    return <div className="p-6 text-center text-primary-500">جارِ التحميل...</div>
  }

  return (
    <div className="p-4 space-y-5" dir="rtl">
      <div className="text-center space-y-1">
        <h1 className="font-quran text-3xl text-primary-700 dark:text-primary-300">{surah.name}</h1>
        <p className="text-sm text-ink-light/60 dark:text-ink-dark/60">
          {surah.ayahCount} آية · {surah.revelationType}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={() => navigate(`/quran/read/${surah.id}`)}
          className="bg-primary-700 text-white rounded-xl2 py-2.5 text-sm font-semibold"
        >
          قراءة
        </button>
        <button className="bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-xl2 py-2.5 text-sm font-semibold">
          استماع
        </button>
        <button className="bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-xl2 py-2.5 text-sm font-semibold">
          حفظ
        </button>
      </div>

      <div className="space-y-3 font-quran text-lg leading-loose text-right">
        {ayahs.map((ayah) => (
          <p key={ayah.id}>
            {ayah.text}
            <span className="inline-block mx-1 text-primary-500 text-sm align-middle">
              ﴿{ayah.ayahNumber}﴾
            </span>
          </p>
        ))}
      </div>
    </div>
  )
}
