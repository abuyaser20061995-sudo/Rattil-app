import { useQuranDownload } from '../../hooks/useQuran.js'

export default function DownloadGate({ children }) {
  const { status, progress, error, startDownload } = useQuranDownload()

  if (status === 'checking') {
    return (
      <div className="h-screen flex items-center justify-center">
        <p className="text-primary-500">جارِ التحقق...</p>
      </div>
    )
  }

  if (status === 'ready') {
    return children
  }

  return (
    <div className="h-screen flex flex-col items-center justify-center gap-5 p-6 text-center" dir="rtl">
      <div className="text-5xl">📖</div>
      <h2 className="text-xl font-bold text-primary-700 dark:text-primary-300">
        نزّل المصحف كامل
      </h2>
      <p className="text-sm text-ink-light/70 dark:text-ink-dark/70 leading-relaxed">
        مرة واحدة وأنت متصل بالإنترنت، وبعدها يصير كل شيء
        (القراءة، الحفظ، التسميع) شغّال بدون إنترنت نهائيًا.
      </p>

      {status === 'needed' && (
        <button
          onClick={startDownload}
          className="w-full max-w-xs bg-primary-700 text-white rounded-xl2 py-3 font-semibold"
        >
          تنزيل المصحف الآن
        </button>
      )}

      {status === 'downloading' && (
        <div className="w-full max-w-xs space-y-2">
          <div className="h-2 bg-primary-100 dark:bg-primary-900 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-700 dark:bg-primary-300 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-ink-light/60 dark:text-ink-dark/60">{progress}%</p>
        </div>
      )}

      {status === 'error' && (
        <div className="w-full max-w-xs space-y-3">
          <p className="text-sm text-red-500">{error}</p>
          <button
            onClick={startDownload}
            className="w-full bg-primary-700 text-white rounded-xl2 py-3 font-semibold"
          >
            إعادة المحاولة
          </button>
        </div>
      )}
    </div>
  )
}
