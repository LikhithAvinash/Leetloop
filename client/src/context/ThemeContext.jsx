import { createContext, useContext, useEffect } from 'react'

const ThemeCtx = createContext()

export function ThemeProvider({ children }) {
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'dark')
  }, [])

  return <ThemeCtx.Provider value={{ theme: 'dark' }}>{children}</ThemeCtx.Provider>
}

export const useTheme = () => useContext(ThemeCtx)
