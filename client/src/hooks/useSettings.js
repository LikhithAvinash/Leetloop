/**
 * useSettings.js — Persistent user settings.
 *
 * ALL localStorage keys are prefixed with the logged-in user's ID
 * to ensure full per-user data isolation (different browsers / accounts).
 *
 * localStorage is used as a fast local cache.
 * The server (user_data table) is the source of truth for cross-device sync.
 *
 * Call `syncProgressFromServer()` once on login/app start.
 * All write helpers (saveSettings, setJoinedSeries, etc.) write to both
 * localStorage AND the server.
 */
import { getProgress, saveProgress } from '../api'

// ─── User prefix for per-user isolation ──────────────────────────────────────
export function getUserPrefix() {
  try {
    const u = JSON.parse(localStorage.getItem('lt_user') || 'null')
    return u?.id ? `u${u.id}_` : ''
  } catch { return '' }
}

// ─── Prefixed key helper ──────────────────────────────────────────────────────
function k(base) { return getUserPrefix() + base }

const DEFAULTS = {
  unsolvedPerDay: 2,
  revisionPerDay: 2,
  unsolvedStartTopic: '',   // empty = first topic in series (default)
  revisionStartTopic: '',   // empty = first topic in series (default)
}

// ─── Sync from server → localStorage (call once on app start) ──────────────
export async function syncProgressFromServer() {
  try {
    const data = await getProgress()
    // Merge server values into localStorage (server wins)
    if (data.settings)        localStorage.setItem(k('lt_settings'),        JSON.stringify(data.settings))
    if (data.joined_series)   localStorage.setItem(k('lt_joined_series'),   JSON.stringify(data.joined_series))
    if (data.streak)          localStorage.setItem(k('lt_streak_data'),     JSON.stringify(data.streak))
    if (data.solved_map)      localStorage.setItem(k('lt_series_solved'),   JSON.stringify(data.solved_map))
    if (data.score != null)   localStorage.setItem(k('lt_score'),           JSON.stringify(data.score))
    // Sync daily snapshots from server (critical for cross-device)
    if (data.daily_unsolved)  localStorage.setItem(k('lt_daily_unsolved'),  JSON.stringify(data.daily_unsolved))
    if (data.daily_revision)  localStorage.setItem(k('lt_daily_revision'),  JSON.stringify(data.daily_revision))
  } catch (err) {
    // Offline or not logged in — local cache still works
    console.warn('Progress sync skipped:', err.message)
  }
}

// ─── Clear all user-specific keys (call on logout) ───────────────────────────
export function clearUserCache() {
  const prefix = getUserPrefix()
  if (!prefix) return
  const keysToRemove = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith(prefix)) keysToRemove.push(key)
  }
  keysToRemove.forEach(key => localStorage.removeItem(key))
}

// ─── Settings ───────────────────────────────────────────────────────────────
export function getSettings() {
  try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(k('lt_settings')) || '{}') } }
  catch { return { ...DEFAULTS } }
}

/**
 * Save settings. Changes apply immediately (no delay).
 */
export function saveSettings(s) {
  const payload = { ...s }
  // Remove any legacy delay fields
  delete payload.settings_changed_at
  localStorage.setItem(k('lt_settings'), JSON.stringify(payload))
  saveProgress('settings', payload).catch(() => {}) // fire-and-forget
}

/**
 * Returns the settings — always returns current settings (no delay).
 */
export function getEffectiveSettings() {
  return getSettings()
}

// ─── Daily Unsolved Snapshot (server-synced) ─────────────────────────────────
export function getDailyUnsolvedSnapshot() {
  try { return JSON.parse(localStorage.getItem(k('lt_daily_unsolved')) || 'null') } catch { return null }
}

export function saveDailyUnsolvedSnapshot(snapshot) {
  localStorage.setItem(k('lt_daily_unsolved'), JSON.stringify(snapshot))
  saveProgress('daily_unsolved', snapshot).catch(() => {})
}

// ─── Daily Revision Snapshot (server-synced) ─────────────────────────────────
export function getDailyRevisionSnapshot() {
  try { return JSON.parse(localStorage.getItem(k('lt_daily_revision')) || 'null') } catch { return null }
}

export function saveDailyRevisionSnapshot(snapshot) {
  localStorage.setItem(k('lt_daily_revision'), JSON.stringify(snapshot))
  saveProgress('daily_revision', snapshot).catch(() => {})
}

// ─── Joined Series ───────────────────────────────────────────────────────────
export function getJoinedSeries() {
  try { return JSON.parse(localStorage.getItem(k('lt_joined_series')) || 'null') } catch { return null }
}

export function setJoinedSeries(joined) {
  localStorage.setItem(k('lt_joined_series'), JSON.stringify(joined))
  saveProgress('joined_series', joined).catch(() => {})
}

// ─── Solved Map (series progress) ────────────────────────────────────────────
export function getSolvedMap() {
  try { return JSON.parse(localStorage.getItem(k('lt_series_solved')) || '{}') } catch { return {} }
}

export function setSolvedMap(map) {
  localStorage.setItem(k('lt_series_solved'), JSON.stringify(map))
  saveProgress('solved_map', map).catch(() => {})
}

// ─── Streak data ─────────────────────────────────────────────────────────────
export function getStreakData() {
  try { return JSON.parse(localStorage.getItem(k('lt_streak_data')) || '{}') } catch { return {} }
}

export function recordSolve() {
  const data = getStreakData()
  const today = new Date().toISOString().split('T')[0]
  data[today] = (data[today] || 0) + 1
  localStorage.setItem(k('lt_streak_data'), JSON.stringify(data))
  saveProgress('streak', data).catch(() => {})
  return data
}

// ─── Score system ────────────────────────────────────────────────────────────
export function getScore() {
  try { return JSON.parse(localStorage.getItem(k('lt_score')) || '0') } catch { return 0 }
}

export function setScore(val) {
  localStorage.setItem(k('lt_score'), JSON.stringify(val))
  saveProgress('score', val).catch(() => {})
}

export function incrementScore(amount = 1) {
  const current = getScore()
  const next = current + amount
  setScore(next)
  return next
}

/**
 * Apply daily penalty if user didn't solve ALL daily problems yesterday.
 * Called on each refresh / first load. Only applies once per day.
 *
 * Logic:
 *   - Check the last penalty date. If it's already today, skip.
 *   - Look at yesterday's unsolved snapshot: if any IDs remain, -1.
 *   - Look at yesterday's revision snapshot: if any IDs remain, -1.
 *   - Total penalty is -1 (not per-problem) if ANY problems were left.
 *   - Score never goes below 0.
 *
 * Returns the updated score.
 */
export function applyDailyPenaltyIfNeeded() {
  const today = new Date().toISOString().split('T')[0]
  const lastPenaltyDate = localStorage.getItem(k('lt_last_penalty_date'))

  // Already checked today — don't penalize again
  if (lastPenaltyDate === today) return getScore()

  // Mark today as checked (before applying, to avoid double-fire)
  localStorage.setItem(k('lt_last_penalty_date'), today)

  // Check yesterday's unsolved snapshot
  const unsolvedSnap = getDailyUnsolvedSnapshot()
  const revisionSnap = getDailyRevisionSnapshot()

  let hadLeftover = false

  // If the snapshot exists and is from a PREVIOUS day, check if problems remained
  if (unsolvedSnap && unsolvedSnap.date && unsolvedSnap.date < today) {
    if (unsolvedSnap.ids && unsolvedSnap.ids.length > 0) {
      hadLeftover = true
    }
  }

  if (revisionSnap && revisionSnap.date && revisionSnap.date < today) {
    if (revisionSnap.ids && revisionSnap.ids.length > 0) {
      hadLeftover = true
    }
  }

  if (hadLeftover) {
    const current = getScore()
    const next = Math.max(0, current - 1)
    setScore(next)
    return next
  }

  return getScore()
}

// ─── Setup done flag ─────────────────────────────────────────────────────────
export function isSetupDone() {
  return localStorage.getItem(k('lt_setup_done')) === 'true'
}

export function markSetupDone() {
  localStorage.setItem(k('lt_setup_done'), 'true')
}

// ─── Category ordering for sequential daily problems ─────────────────────────
export const CATEGORY_ORDER = [
  'Arrays & Hashing',
  'Two Pointers',
  'Sliding Window',
  'Stack',
  'Binary Search',
  'Linked List',
  'Trees',
  'Heap / Priority Queue',
  'Backtracking',
  'Tries',
  'Graphs',
  'Advanced Graphs',
  '1-D Dynamic Programming',
  '2-D Dynamic Programming',
  'Greedy',
  'Intervals',
  'Math & Geometry',
  'Bit Manipulation',
]
