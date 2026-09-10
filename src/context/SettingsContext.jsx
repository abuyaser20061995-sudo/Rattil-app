import { createContext, useContext, useEffect, useState } from 'react'

const SettingsContext = createContext(null)

export function SettingsProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('rattil_theme')
    return saved || 'system'
  })

  useEffect(() => {
    const root = document.documentElement
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const isDark = theme === 'dark' || (theme === 'system' && prefersDark)
    root.classList.toggle('dark', isDark)
    localStorage.setItem('rattil_theme', theme)
  }, [theme])

  const value = { theme, setTheme }
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export function useSettings() {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings يجب أن يُستخدم داخل SettingsProvider')
  return ctx
}
