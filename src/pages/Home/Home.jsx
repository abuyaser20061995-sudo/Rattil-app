export default function Home() {
  // بيانات مؤقتة (Placeholder) — سيتم ربطها بقاعدة البيانات الحقيقية في المرحلة 2
  const lastPosition = { surah: 'البقرة', ayah: 142 }
  const todayGoal = { reading: 10, memorization: 5, review: 20 }
  const streak = 12

  return (
    <div className="p-5 space-y-5" dir="rtl">
      <h1 className="text-2xl font-bold text-primary-700 dark:text-primary-300">رَتِّل</h1>

      <div className="bg-primary-50 dark:bg-primary-900/30 rounded-xl2 p-4">
        <p className="text-sm text-ink-light/70 dark:text-ink-dark/70 mb-1">أكمل من حيث توقفت</p>
        <p className="font-quran text-xl mb-3">سورة {lastPosition.surah} — الآية {lastPosition.ayah}</p>
        <button className="w-full bg-primary-700 text-white rounded-xl2 py-2.5 font-semibold">
          متابعة القراءة
        </button>
      </div>

      <div>
        <p className="text-sm font-semibold mb-2">وردك اليوم</p>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-surface-lightAlt dark:bg-surface-darkAlt rounded-xl2 p-3 text-center">
            <p className="text-2xl">📖</p>
            <p className="text-xs mt-1">{todayGoal.reading} صفحات</p>
          </div>
          <div className="bg-surface-lightAlt dark:bg-surface-darkAlt rounded-xl2 p-3 text-center">
            <p className="text-2xl">🧠</p>
            <p className="text-xs mt-1">{todayGoal.memorization} آيات</p>
          </div>
          <div className="bg-surface-lightAlt dark:bg-surface-darkAlt rounded-xl2 p-3 text-center">
            <p className="text-2xl">🔄</p>
            <p className="text-xs mt-1">{todayGoal.review} آية</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between bg-primary-50 dark:bg-primary-900/30 rounded-xl2 p-4">
        <span className="font-semibold">🔥 {streak} يومًا متتاليًا</span>
        <button className="text-primary-700 dark:text-primary-300 font-semibold text-sm">ابدأ جلسة اليوم</button>
      </div>
    </div>
  )
}
