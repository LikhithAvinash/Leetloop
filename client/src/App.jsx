import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import { AppDataProvider } from './context/AppDataContext'
import Navbar from './components/Navbar'
import Dashboard from './pages/Dashboard'
import AllProblems from './pages/AllProblems'
import ProblemDetail from './pages/ProblemDetail'
import Series from './pages/Series'
import SettingsPage from './pages/SettingsPage'
import Login from './pages/Login'
import { isSetupDone, syncProgressFromServer, getJoinedSeries, markSetupDone, clearUserCache } from './hooks/useSettings'

function getStoredAuth() {
  try {
    const u = localStorage.getItem('lt_user')
    return u ? JSON.parse(u) : null
  } catch { return null }
}

function AppInner() {
  const [user, setUser] = useState(getStoredAuth)
  const [showSetup, setShowSetup] = useState(() => !isSetupDone())
  const [synced, setSynced] = useState(false)

  // Sync progress from server whenever a user is logged in
  useEffect(() => {
    if (!user) { setSynced(true); return }
    syncProgressFromServer().finally(() => {
      // After sync, re-check setup: if server has joined_series, skip setup screen
      if (getJoinedSeries()) markSetupDone()
      setShowSetup(!isSetupDone())
      setSynced(true)
    })
  }, [user])


  async function handleAuth(userData) {
    localStorage.setItem('lt_user', JSON.stringify(userData))
    setUser(userData)
    // syncProgressFromServer will run via the useEffect above
  }

  function handleLogout() {
    clearUserCache()                       // remove all u{id}_* keys for this user
    localStorage.removeItem('lt_user')
    localStorage.removeItem('lt_token')
    setUser(null)
    setSynced(false)
  }

  if (!user) return <Login onAuth={handleAuth} />

  // Wait for server sync before rendering (avoids flash of stale data)
  if (!synced) {
    return (
      <div style={{
        minHeight: '100vh', background: '#0d0d0d',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#64748b', fontSize: 15, gap: 12,
      }}>
        <span style={{ fontSize: 22, animation: 'spin 1s linear infinite' }}>⟳</span>
        Syncing your progress…
      </div>
    )
  }

  // Show settings page on first login
  if (showSetup) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
        <SettingsPage isFirstTime={true} onDone={() => setShowSetup(false)} />
      </div>
    )
  }

  return (
    <BrowserRouter>
      <AppDataProvider>
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
          <Navbar user={user} onLogout={handleLogout} />
          <main style={{ flex: 1, padding: '28px 0' }}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/problems" element={<AllProblems />} />
              <Route path="/problems/:id" element={<ProblemDetail />} />
              <Route path="/series" element={<Series />} />
              <Route path="/settings" element={<SettingsPage onDone={() => window.history.back()} />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </AppDataProvider>
    </BrowserRouter>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AppInner />
    </ThemeProvider>
  )
}
