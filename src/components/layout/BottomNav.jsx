import { NavLink, useLocation } from 'react-router-dom'

const items = [
  { path: '/home', label: 'الرئيسية', icon: '🏠' },
  { path: '/quran', label: 'المصحف', icon: '📖' },
  { path: '/memorization', label: 'الحفظ', icon: '🧠' },
  { path: '/review', label: 'المراجعة', icon: '🔄' },
  { path: '/more', label: 'المزيد', icon: '⋯' }
]

export default function BottomNav() {
  const location = useLocation()
  if (location.pathname === '/') return null

  return (
    <nav className="fixed bottom-0 inset-x-0 bg-surface-light dark:bg-surface-dark border-t border-primary-100 dark:border-primary-900 flex justify-around py-2 z-50">
      {items.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) =>
            `flex flex-col items-center text-xs gap-1 px-2 py-1 rounded-xl2 ${
              isActive ? 'text-primary-500 font-semibold' : 'text-ink-light/60 dark:text-ink-dark/60'
            }`
          }
        >
          <span className="text-xl">{item.icon}</span>
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
