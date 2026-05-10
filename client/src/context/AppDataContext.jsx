/**
 * AppDataContext.jsx
 *
 * A single shared data layer for the whole app.
 * Holds: stats (score dist, totals), queue (today's revisions), allProblems list,
 *        settings (reactive), score.
 *
 * Any component can:
 *   - Read live data via `useAppData()`
 *   - Trigger an immediate refresh via `useRefresh()`
 *
 * Background poll: every POLL_INTERVAL ms the data is silently refreshed.
 * After any mutation (solve, revision submit) call `refresh()` to instantly
 * update every panel on screen — no page reload needed.
 */
import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { getTodayQueue, getProblems, getProblemStats } from '../api'
import { getEffectiveSettings, getSettings, getStreakData, getScore, applyDailyPenaltyIfNeeded } from '../hooks/useSettings'

const POLL_INTERVAL = 10_000 // 10 seconds

// ─── Context objects ─────────────────────────────────────────────────────────
const AppDataContext  = createContext(null)
const RefreshContext  = createContext(null)

// ─── Helpers ──────────────────────────────────────────────────────────────────
async function fetchAll() {
  const [queue, problems, stats] = await Promise.all([
    getTodayQueue(),
    getProblems(),
    getProblemStats().catch(() => null),
  ])
  return { queue, problems, stats }
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function AppDataProvider({ children }) {
  const [data, setData] = useState({
    queue:    [],
    problems: [],
    stats:    null,
    loading:  true,
    lastFetched: null,
    settings: getEffectiveSettings(),
    rawSettings: getSettings(),
    streakData: getStreakData(),
    score: getScore(),
  })
  const timerRef = useRef(null)

  const refresh = useCallback(async () => {
    try {
      const result = await fetchAll()
      // Apply daily penalty on first load
      const score = applyDailyPenaltyIfNeeded()
      setData({
        queue:       result.queue,
        problems:    result.problems,
        stats:       result.stats,
        loading:     false,
        lastFetched: Date.now(),
        settings:    getEffectiveSettings(),
        rawSettings: getSettings(),
        streakData:  getStreakData(),
        score:       score,
      })
    } catch (err) {
      console.warn('[AppData] refresh failed:', err.message)
      setData(prev => ({ ...prev, loading: false }))
    }
  }, [])

  // Initial load + polling
  useEffect(() => {
    refresh()
    timerRef.current = setInterval(refresh, POLL_INTERVAL)
    return () => clearInterval(timerRef.current)
  }, [refresh])

  // Visibility-based refresh: when user returns to tab, re-fetch
  useEffect(() => {
    function onVisible() {
      if (document.visibilityState === 'visible') refresh()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [refresh])

  return (
    <AppDataContext.Provider value={data}>
      <RefreshContext.Provider value={refresh}>
        {children}
      </RefreshContext.Provider>
    </AppDataContext.Provider>
  )
}

// ─── Hooks ────────────────────────────────────────────────────────────────────
/** Read the current live data snapshot */
export function useAppData() {
  const ctx = useContext(AppDataContext)
  if (!ctx) throw new Error('useAppData must be used inside <AppDataProvider>')
  return ctx
}

/** Get the refresh() function to call after any mutation */
export function useRefresh() {
  const ctx = useContext(RefreshContext)
  if (!ctx) throw new Error('useRefresh must be used inside <AppDataProvider>')
  return ctx
}
