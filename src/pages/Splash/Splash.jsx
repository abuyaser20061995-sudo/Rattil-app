import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Splash() {
  const navigate = useNavigate()

  useEffect(() => {
    const timer = setTimeout(() => navigate('/home'), 1800)
    return () => clearTimeout(timer)
  }, [navigate])

  return (
    <div className="h-screen flex flex-col items-center justify-center gap-4 bg-primary-700 text-white">
      <h1 className="text-5xl font-quran">رَتِّل</h1>
      <p className="text-lg font-quran opacity-90">وَرَتِّلِ الْقُرْآنَ تَرْتِيلًا</p>
    </div>
  )
}
