const BASE = '/api'

function getToken() {
  return localStorage.getItem('lt_token')
}

async function request(method, path, body, requiresAuth = true) {
  const headers = { 'Content-Type': 'application/json' }
  if (requiresAuth) {
    const token = getToken()
    if (token) headers['Authorization'] = `Bearer ${token}`
  }
  const opts = { method, headers }
  if (body) opts.body = JSON.stringify(body)
  const res = await fetch(BASE + path, opts)
  if (res.status === 401) {
    localStorage.removeItem('lt_token')
    localStorage.removeItem('lt_user')
    window.location.href = '/login'
    throw new Error('Session expired. Please log in again.')
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || res.statusText)
  }
  return res.json()
}

// Auth (no token needed)
export const register = (data) => request('POST', '/auth/register', data, false)
export const login = (data) => request('POST', '/auth/login', data, false)
export const getMe = () => request('GET', '/auth/me')

// Problems
export const searchProblems = (q) => request('GET', `/search?q=${encodeURIComponent(q)}`)
export const addProblem = (data) => request('POST', '/problems', data)
export const getProblems = (bracket) =>
  request('GET', `/problems${bracket ? `?bracket=${bracket}` : ''}`)
export const solveProblem = (id) => request('PUT', `/problems/${id}/solve`)
export const getProblemStats = () => request('GET', '/problems/stats')
export const getProblemAttempts = (id) => request('GET', `/problems/${id}/attempts`)

// Attempts
export const submitAttempt = (data) => request('POST', '/attempts', data)

// Queue
export const getTodayQueue = () => request('GET', '/queue/today')
export const getUpcomingQueue = () => request('GET', '/queue/upcoming')

// Health
export const getHealth = () => request('GET', '/health', null, false)

// User progress (cross-device sync)
export const getProgress = () => request('GET', '/progress')
export const saveProgress = (key, value) => request('PUT', `/progress/${key}`, { value })

// AI
export const getAIHint = (data) => request('POST', '/ai/hint', data)
export const evaluateCode = (data) => request('POST', '/ai/evaluate', data)
