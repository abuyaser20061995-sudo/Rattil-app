import { Routes, Route } from 'react-router-dom'
import BottomNav from './components/layout/BottomNav.jsx'
import DownloadGate from './pages/DownloadGate/DownloadGate.jsx'
import Splash from './pages/Splash/Splash.jsx'
import Home from './pages/Home/Home.jsx'
import Surahs from './pages/Surahs/Surahs.jsx'
import SurahDetail from './pages/SurahDetail/SurahDetail.jsx'

function Placeholder({ title }) {
  return (
    <div className="flex items-center justify-center h-[70vh] text-primary-500">
      <p className="text-lg">{title} — قيد الإنشاء (المرحلة القادمة)</p>
    </div>
  )
}

export default function App() {
  return (
    <DownloadGate>
      <div className="min-h-screen pb-20">
        <Routes>
          <Route path="/" element={<Splash />} />
          <Route path="/home" element={<Home />} />
          <Route path="/quran" element={<Surahs />} />
          <Route path="/quran/surah/:surahId" element={<SurahDetail />} />
          <Route path="/quran/read/:surahId" element={<Placeholder title="عرض المصحف الورقي" />} />
          <Route path="/memorization" element={<Placeholder title="الحفظ" />} />
          <Route path="/review" element={<Placeholder title="المراجعة والختمة" />} />
          <Route path="/more" element={<Placeholder title="المزيد" />} />
        </Routes>
        <BottomNav />
      </div>
    </DownloadGate>
  )
}
