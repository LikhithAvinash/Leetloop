import { useState, useEffect, useMemo } from 'react'
import { addProblem, solveProblem } from '../api'
import { SERIES } from '../data/seriesData'
import {
  getJoinedSeries, recordSolve, CATEGORY_ORDER, incrementScore,
  getDailyUnsolvedSnapshot, saveDailyUnsolvedSnapshot,
  getDailyRevisionSnapshot, saveDailyRevisionSnapshot,
} from '../hooks/useSettings'
import { useAppData, useRefresh } from '../context/AppDataContext'
import TodayQueue from '../components/TodayQueue'
import RevisionModal from '../components/RevisionModal'
import StreakCalendar from '../components/StreakCalendar'

// ─── Helpers ──────────────────────────────────────────────────────────────────
function todayStr() {
  return new Date().toISOString().split('T')[0]
}

/**
 * Build a fingerprint from the current settings that affect which problems
 * are picked.  When this changes, we regenerate the daily set.
 */
function topicFingerprint(settings, joined) {
  const seriesId = joined?.seriesId || ''
  const mode = joined?.mode || ''
  return `${settings.unsolvedPerDay}|${settings.unsolvedStartTopic || ''}|${seriesId}|${mode}`
}

function revisionFingerprint(settings) {
  return `${settings.revisionPerDay}`
}

const DIFF_STYLE = {
  Easy: { color: '#22c55e', bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.25)' },
  Medium: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)' },
  Hard: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.25)' },
}

/* ── Pick N unsolved in category order starting from a specific topic ─────── */
function pickUnsolvedInOrder(categories, excludeIds, count, startTopic) {
  const result = []

  // Build ordered category list
  let orderedCats = [...CATEGORY_ORDER]
  // Add any categories not in CATEGORY_ORDER
  for (const cat of Object.keys(categories)) {
    if (!orderedCats.includes(cat)) orderedCats.push(cat)
  }

  // If startTopic is specified and exists, rotate the order to start from that topic
  if (startTopic) {
    const idx = orderedCats.indexOf(startTopic)
    if (idx > 0) {
      orderedCats = [...orderedCats.slice(idx), ...orderedCats.slice(0, idx)]
    }
  }

  for (const cat of orderedCats) {
    if (!categories[cat]) continue
    for (const p of categories[cat]) {
      if (!excludeIds.has(p.id)) {
        result.push({ ...p, category: cat })
        if (result.length >= count) return result
      }
    }
  }
  return result
}

export default function Dashboard() {
  const { queue: allDue, problems: allProblems, stats, loading, settings, streakData: contextStreak, score: contextScore } = useAppData()
  const refresh = useRefresh()

  const [revisionQueue, setRevisionQueue] = useState([])
  const [revisingProblem, setRevisingProblem] = useState(null)
  const [streakData, setStreakData] = useState(contextStreak)
  const [solvingId, setSolvingId] = useState(null)
  // Optimistic solved set — track problems solved in this session for instant UI
  const [optimisticSolved, setOptimisticSolved] = useState(new Set())
  const [currentScore, setCurrentScore] = useState(contextScore)

  // Sync streak from context
  useEffect(() => { setStreakData(contextStreak) }, [contextStreak])
  useEffect(() => { setCurrentScore(contextScore) }, [contextScore])

  // Server-derived set of solved leetcode IDs (Bracket 1 & 2) — derived from shared context
  const solvedLeetcodeIds = useMemo(() => new Set(
    allProblems.filter(p => (p.bracket === 1 || p.bracket === 2) && p.leetcode_id).map(p => p.leetcode_id)
  ), [allProblems])

  const solvedLoaded = !loading

  const joined = getJoinedSeries()

  const { categories, seriesInfo } = useMemo(() => {
    if (!joined) return { categories: null, seriesInfo: null }
    const s = SERIES.find(s => s.id === joined.seriesId)
    if (!s) return { categories: null, seriesInfo: null }
    const cats = s.modes ? s.categories[joined.mode || s.defaultMode] : s.categories
    return { categories: cats, seriesInfo: s }
  }, [joined])

  // ── REVISION queue: driven from context data, locked per day ────────────────
  useEffect(() => {
    if (loading) return
    const today = todayStr()
    const snapshot = getDailyRevisionSnapshot()
    const currentFP = revisionFingerprint(settings)

    if (snapshot && snapshot.date === today && snapshot.fingerprint === currentFP) {
      // Same day, same settings: restore only problems still due from today's locked set
      const stillDue = allDue.filter(p => snapshot.ids.includes(p.user_problem_id))
      setRevisionQueue(stillDue)
    } else {
      // New day OR settings changed: fresh pick — strictly limited to settings.revisionPerDay
      const limited = allDue.slice(0, settings.revisionPerDay)
      const newSnapshot = {
        date: today,
        ids: limited.map(p => p.user_problem_id),
        fingerprint: currentFP,
      }
      saveDailyRevisionSnapshot(newSnapshot)
      setRevisionQueue(limited)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allDue, loading, settings.revisionPerDay])

  // ── isSolved: combines server data + optimistic local state ──────────────────
  const isSolved = (leetcodeId) => solvedLeetcodeIds.has(leetcodeId) || optimisticSolved.has(leetcodeId)

  // ── UNSOLVED TODAY: server-synced daily snapshot ─────────────────────────────
  const dailyUnsolved = useMemo(() => {
    if (!categories || !joined || !solvedLoaded) return []

    // Build a flat lookup: id → problem object
    const allMap = new Map()
    for (const cat of Object.keys(categories)) {
      for (const p of categories[cat]) allMap.set(p.id, { ...p, category: cat })
    }

    const today = todayStr()
    const snapshot = getDailyUnsolvedSnapshot()
    const currentFP = topicFingerprint(settings, joined)

    // Combined solved: server + optimistic
    const combinedSolved = new Set([...solvedLeetcodeIds, ...optimisticSolved])

    let finalIds

    if (snapshot && snapshot.date === today && snapshot.fingerprint === currentFP) {
      // ── SAME DAY, SAME SETTINGS: use the locked snapshot ──────────────────
      // Filter out solved ones for display, but do NOT add new ones
      finalIds = snapshot.ids.filter(id => !combinedSolved.has(id))
      // Update the snapshot with the reduced list and push to server too.
      // Previously this was local-only, which meant logout→login restored the
      // stale full list from the server and showed already-solved problems again.
      const updatedSnapshot = { ...snapshot, ids: finalIds }
      saveDailyUnsolvedSnapshot(updatedSnapshot)
    } else {
      // ── NEW DAY or SETTINGS/TOPIC CHANGED: generate fresh set ──────────────
      // Carry over any existing unsolved from previous snapshot (if same series)
      let carryOver = []
      if (snapshot && snapshot.ids) {
        carryOver = snapshot.ids.filter(id => !combinedSolved.has(id))
      }

      // If it's a new day, carry unsolved forward. If topic changed same day, start fresh.
      let startIds = []
      if (snapshot && snapshot.date === today && snapshot.fingerprint !== currentFP) {
        // Topic/count changed same day — regenerate completely from new topic
        startIds = []
      } else {
        // New day: carry over unsolved from yesterday
        startIds = carryOver
      }

      const excludeIds = new Set([...combinedSolved, ...startIds])
      const needed = Math.max(0, settings.unsolvedPerDay - startIds.length)
      let extras = []
      if (needed > 0) {
        extras = pickUnsolvedInOrder(categories, excludeIds, needed, settings.unsolvedStartTopic).map(p => p.id)
      }
      finalIds = [...startIds, ...extras]
      // STRICT: cap to unsolvedPerDay
      finalIds = finalIds.slice(0, settings.unsolvedPerDay)

      // Save snapshot to both localStorage AND server
      const newSnapshot = {
        date: today,
        ids: finalIds,
        fingerprint: currentFP,
      }
      saveDailyUnsolvedSnapshot(newSnapshot)
    }

    // Resolve to full problem objects
    return finalIds.map(id => allMap.get(id)).filter(Boolean)
  }, [categories, joined, solvedLoaded, solvedLeetcodeIds, optimisticSolved, settings.unsolvedPerDay, settings.unsolvedStartTopic])

  // ── Mark unsolved problem as solved (SINGLE CLICK — optimistic) ─────────────
  async function handleSolveUnsolved(problem) {
    setSolvingId(problem.id)

    // OPTIMISTIC: immediately mark as solved in local state
    setOptimisticSolved(prev => new Set([...prev, problem.id]))

    // Increment score
    setCurrentScore(incrementScore(1))

    try {
      // Ensure tracked in DB
      let newlyAddedId = null;
      try {
        const res = await addProblem({
          leetcode_id: problem.id,
          name: problem.name,
          difficulty: problem.difficulty,
          category: problem.category || 'General',
          leetcode_url: problem.url,
        })
        if (res && res.user_problem) {
          newlyAddedId = res.user_problem.id;
        }
      } catch { /* 409 = already tracked, fine */ }

      // Immediately move to Bracket 2
      if (newlyAddedId) {
        // Was just added, use the new ID to solve immediately
        await solveProblem(newlyAddedId)
      } else {
        // Was already tracked, find the user_problem
        const allLatest = allProblems
        let found = allLatest.find(p => p.leetcode_id === problem.id)
        if (found && found.bracket === 1) {
          await solveProblem(found.user_problem_id)
        }
      }

      // Record streak locally + trigger global refresh
      setStreakData(recordSolve())
      await refresh()
    } catch (e) {
      console.error('handleSolveUnsolved error:', e)
      // Rollback optimistic state
      setOptimisticSolved(prev => {
        const next = new Set(prev)
        next.delete(problem.id)
        return next
      })
      alert('Could not mark as solved: ' + e.message)
    } finally {
      setSolvingId(null)
    }
  }

  // ── After completing a revision ──────────────────────────────────────────────
  async function handleRevisionDone(completedUserProblemId) {
    setRevisionQueue(prev => {
      const next = prev.filter(p => p.user_problem_id !== completedUserProblemId)
      // Update the daily revision snapshot
      const snapshot = getDailyRevisionSnapshot()
      if (snapshot) {
        saveDailyRevisionSnapshot({
          ...snapshot,
          ids: next.map(p => p.user_problem_id),
        })
      }
      return next
    })
    setStreakData(recordSolve())
    setCurrentScore(incrementScore(1))
    setRevisingProblem(null)
    // Refresh global data so stats update instantly
    await refresh()
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px' }}>
      <section style={{ marginBottom: 28 }}>
        <StreakCalendar streakData={streakData} stats={stats} statsLoading={loading} />
      </section>

      {/* Unrevised Today */}
      <section style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>🆕 Unrevised Today</h2>
          {joined && seriesInfo && (
            <span style={{
              background: `${seriesInfo.color}18`, color: seriesInfo.color,
              borderRadius: 8, padding: '2px 10px', fontSize: 11, fontWeight: 700,
              border: `1px solid ${seriesInfo.color}40`,
            }}>
              {seriesInfo.icon} {seriesInfo.name} {joined.mode || ''}
            </span>
          )}
          {!loading && dailyUnsolved.length > 0 && (
            <span style={{
              background: 'rgba(34,197,94,0.15)', color: '#22c55e',
              borderRadius: 20, padding: '2px 10px', fontSize: 12, fontWeight: 700,
            }}>
              {dailyUnsolved.filter(p => !isSolved(p.id)).length}/{settings.unsolvedPerDay}
            </span>
          )}
        </div>

        {!joined ? (
          <div className="card" style={{
            padding: '32px 24px', textAlign: 'center',
            border: '1px dashed var(--border-2)', borderRadius: 14,
          }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>📚</div>
            <h3 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>
              No series joined yet
            </h3>
            <p style={{ margin: '0 0 14px', color: 'var(--text-3)', fontSize: 13 }}>
              Go to Settings (⚙️) or the Series page to join a curated problem series.
            </p>
          </div>
        ) : loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 12 }}>
            {[0, 1].map(i => <div key={i} className="skeleton" style={{ height: 120 }} />)}
          </div>
        ) : dailyUnsolved.length === 0 ? (
          <div className="card" style={{
            padding: '32px 24px', textAlign: 'center',
            border: '1px dashed rgba(34,197,94,0.3)', borderRadius: 14,
          }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>🎉</div>
            <h3 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 700, color: '#22c55e' }}>
              All problems solved!
            </h3>
            <p style={{ margin: 0, color: 'var(--text-3)', fontSize: 13 }}>
              You've completed the entire series. Amazing work!
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 12 }}>
            {dailyUnsolved.map(p => {
              const d = DIFF_STYLE[p.difficulty]
              const done = isSolved(p.id)
              return (
                <div key={p.id} className="card" style={{
                  padding: 18, opacity: done ? 0.55 : 1,
                  borderColor: done ? 'rgba(34,197,94,0.3)' : 'var(--border)',
                  transition: 'opacity 0.3s ease, border-color 0.3s ease',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{
                      background: d.bg, color: d.color, border: `1px solid ${d.border}`,
                      borderRadius: 6, padding: '2px 10px', fontSize: 11, fontWeight: 600,
                    }}>{p.difficulty}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{p.category}</span>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>
                    {p.id}. {p.name}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <a href={p.url} target="_blank" rel="noopener noreferrer"
                      className="btn btn-secondary btn-sm" style={{ textDecoration: 'none', flex: '0 0 auto' }}>
                      ↗ LeetCode
                    </a>
                    {!done ? (
                      <button className="btn btn-success btn-sm" style={{ flex: 1 }}
                        onClick={() => handleSolveUnsolved(p)} disabled={solvingId === p.id}>
                        {solvingId === p.id ? '...' : '✓ Mark Solved'}
                      </button>
                    ) : (
                      <span style={{ flex: 1, textAlign: 'center', color: '#22c55e', fontWeight: 700, fontSize: 13, alignSelf: 'center' }}>
                        ✓ Solved
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Revision Today */}
      <section style={{ marginBottom: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>🔄 Revision Today</h2>
          {!loading && revisionQueue.length > 0 && (
            <span style={{
              background: 'rgba(99,102,241,0.15)', color: '#818cf8',
              borderRadius: 20, padding: '2px 10px', fontSize: 12, fontWeight: 700,
            }}>
              {revisionQueue.length}/{settings.revisionPerDay} problem{settings.revisionPerDay !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <TodayQueue
          problems={revisionQueue}
          loading={loading}
          onRevise={(p) => setRevisingProblem(p)}
        />
      </section>

      {/* Revision Modal */}
      {revisingProblem && (
        <RevisionModal
          problem={revisingProblem}
          onClose={() => setRevisingProblem(null)}
          onSuccess={() => handleRevisionDone(revisingProblem.user_problem_id)}
        />
      )}
    </div>
  )
}
