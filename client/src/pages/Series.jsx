import { useState, useEffect, useMemo } from 'react'
import { SERIES } from '../data/seriesData'
import { addProblem, solveProblem } from '../api'
import { getJoinedSeries, setJoinedSeries, recordSolve, getUserPrefix, incrementScore, getDailyUnsolvedSnapshot } from '../hooks/useSettings'
import { useAppData, useRefresh } from '../context/AppDataContext'

function getSolvedMap() {
  const sk = getUserPrefix() + 'lt_series_solved'
  try { return JSON.parse(localStorage.getItem(sk) || '{}') } catch { return {} }
}
function setSolvedMapLS(m) {
  const sk = getUserPrefix() + 'lt_series_solved'
  localStorage.setItem(sk, JSON.stringify(m))
}

const DIFF_STYLE = {
  Easy:   { color: '#22c55e', bg: 'rgba(34,197,94,0.1)',  border: 'rgba(34,197,94,0.25)' },
  Medium: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)' },
  Hard:   { color: '#ef4444', bg: 'rgba(239,68,68,0.1)',  border: 'rgba(239,68,68,0.25)' },
}

/* ── Main Component ───────────────────────────────────────────── */
export default function Series() {
  const { problems: allServerProblems, loading: serverLoading } = useAppData()
  const refresh = useRefresh()

  const [activeSeries, setActiveSeries] = useState(SERIES[0].id)
  const [modes, setModes] = useState({}) // { neetcode: '150' }
  const [openCats, setOpenCats] = useState({})
  const [solved, setSolved] = useState(getSolvedMap)
  const [solvingId, setSolvingId] = useState(null)
  const [joined, setJoined] = useState(getJoinedSeries)

  const series = SERIES.find(s => s.id === activeSeries)
  const currentMode = series.modes ? (modes[series.id] || series.defaultMode) : null
  const categories = series.modes ? series.categories[currentMode] : series.categories

  // Build a server-derived set of solved leetcode IDs (from shared context)
  const serverSolvedIds = useMemo(() => new Set(
    allServerProblems.filter(p => (p.bracket === 1 || p.bracket === 2) && p.leetcode_id).map(p => p.leetcode_id)
  ), [allServerProblems])

  // ── Sync solved map from server problems (context-driven, updates on every refresh) ──
  useEffect(() => {
    if (serverLoading || serverSolvedIds.size === 0) return

    const existing = getSolvedMap()
    let changed = false
    for (const s of SERIES) {
      const modeList = s.modes ? s.modes.map(m => m.value) : [null]
      for (const mode of modeList) {
        const cats = s.modes ? s.categories[mode] : s.categories
        if (!cats) continue
        for (const cat of Object.keys(cats)) {
          for (const p of cats[cat]) {
            if (serverSolvedIds.has(p.id)) {
              const key = `${s.id}_${mode || 'd'}_${p.id}`
              if (!existing[key]) {
                existing[key] = true
                changed = true
              }
            }
          }
        }
      }
    }
    if (changed) {
      setSolvedMapLS(existing)
      setSolved({ ...existing })
    }
  }, [serverSolvedIds, serverLoading])

  // Flatten all problems
  const allProblems = useMemo(() => {
    const all = []
    for (const cat of Object.keys(categories)) {
      for (const p of categories[cat]) all.push({ ...p, category: cat })
    }
    return all
  }, [categories])

  const seriesSolvedKey = (problemId) => `${activeSeries}_${currentMode || 'd'}_${problemId}`

  // isSolved: check BOTH local solved map AND server-derived context
  const isSolved = (problemId) => !!solved[seriesSolvedKey(problemId)] || serverSolvedIds.has(problemId)

  const totalCount = allProblems.length
  const solvedCount = allProblems.filter(p => isSolved(p.id)).length
  const unsolvedProblems = allProblems.filter(p => !isSolved(p.id))

  // Daily problems — read from Dashboard's active list for joined series
  const dailyProblems = useMemo(() => {
    const isJoinedSeries = joined &&
      joined.seriesId === activeSeries &&
      (!series.modes || joined.mode === currentMode)

    if (isJoinedSeries) {
      // Read from the shared daily unsolved snapshot (server-synced)
      const snapshot = getDailyUnsolvedSnapshot()
      if (snapshot && snapshot.ids) {
        return snapshot.ids.map(id => allProblems.find(p => p.id === id)).filter(Boolean)
      }
      return []
    }
    return []
  }, [activeSeries, currentMode, allProblems.length, joined, solved, serverSolvedIds])

  async function handleSolve(problem) {
    setSolvingId(problem.id)

    // Optimistic update — immediately mark as solved in local state
    const newSolved = { ...solved, [seriesSolvedKey(problem.id)]: true }
    setSolved(newSolved)
    setSolvedMapLS(newSolved)

    let newlyAddedId = null;
    try {
      // Add to backend tracker
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
    } catch (e) {
      // Already tracked is fine
    }

    try {
      if (newlyAddedId) {
        await solveProblem(newlyAddedId);
      } else {
        // Move to bracket 2 if still in bracket 1
        const found = allServerProblems.find(p => p.leetcode_id === problem.id)
        if (found && found.bracket === 1) {
          await solveProblem(found.user_problem_id)
        }
      }
    } catch (e) {
      console.error('Solve error:', e)
    }

    recordSolve()
    incrementScore(1)
    setSolvingId(null)
    // Refresh shared context so Dashboard stats/ring/streak update immediately
    refresh()
  }

  function toggleCat(cat) {
    setOpenCats(prev => ({ ...prev, [cat]: !prev[cat] }))
  }

  const progress = totalCount > 0 ? (solvedCount / totalCount * 100) : 0

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{
          margin: '0 0 6px', fontSize: 30, fontWeight: 900,
          background: 'linear-gradient(135deg, #6366f1, #a78bfa, #60a5fa)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
        }}>
          LeetCode Series
        </h1>
        <p style={{ margin: 0, color: 'var(--text-3)', fontSize: 14 }}>
          Curated problem sets for systematic interview prep
        </p>
      </div>

      {/* Series selector tabs */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
        {SERIES.map(s => (
          <button
            key={s.id}
            onClick={() => setActiveSeries(s.id)}
            style={{
              padding: '10px 22px', borderRadius: 10, fontSize: 14, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'var(--font-sans)',
              border: `1.5px solid ${activeSeries === s.id ? s.color : 'var(--border)'}`,
              background: activeSeries === s.id ? `${s.color}18` : 'var(--surface)',
              color: activeSeries === s.id ? s.color : 'var(--text-2)',
              transition: 'all 0.2s ease',
              display: 'flex', alignItems: 'center', gap: 8,
            }}
          >
            <span style={{ fontSize: 18 }}>{s.icon}</span>
            {s.name}
          </button>
        ))}
      </div>

      {/* Active series info + mode toggle */}
      <div className="card" style={{ padding: 24, marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h2 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 800, color: 'var(--text)' }}>
              {series.icon} {series.name}
              {currentMode && <span style={{ color: series.color, marginLeft: 8 }}>{currentMode}</span>}
            </h2>
            <p style={{ margin: 0, color: 'var(--text-3)', fontSize: 13 }}>{series.description}</p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Mode toggle for neetcode */}
            {series.modes && (
              <div style={{ display: 'flex', gap: 4, background: 'var(--bg-2)', borderRadius: 8, padding: 3 }}>
                {series.modes.map(m => (
                  <button key={m.value} onClick={() => setModes(prev => ({ ...prev, [series.id]: m.value }))}
                    style={{
                      padding: '6px 16px', borderRadius: 6, fontSize: 13, fontWeight: 700,
                      border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)',
                      background: currentMode === m.value ? series.color : 'transparent',
                      color: currentMode === m.value ? '#fff' : 'var(--text-3)',
                      transition: 'all 0.18s',
                    }}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            )}

            {/* Join / Leave button */}
            {(() => {
              const isJoined = joined && joined.seriesId === series.id && (!series.modes || joined.mode === currentMode)
              return (
                <button
                  className={isJoined ? 'btn btn-ghost btn-sm' : 'btn btn-primary btn-sm'}
                  onClick={() => {
                    if (isJoined) {
                      setJoinedSeries(null)
                      setJoined(null)
                    } else {
                      const j = { seriesId: series.id, mode: currentMode }
                      setJoinedSeries(j)
                      setJoined(j)
                    }
                  }}
                  style={isJoined ? { borderColor: 'rgba(239,68,68,0.25)', color: 'var(--danger)' } : {}}
                >
                  {isJoined ? '✕ Leave' : '🚀 Join'}
                </button>
              )
            })()}

            {/* Progress */}
            <div style={{ textAlign: 'right', minWidth: 100 }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: series.color }}>{solvedCount}/{totalCount}</div>
              <div style={{ fontSize: 11, color: 'var(--text-3)' }}>completed</div>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ marginTop: 16, height: 6, borderRadius: 3, background: 'var(--bg-3)', overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 3,
            background: `linear-gradient(90deg, ${series.color}, ${series.color}aa)`,
            width: `${progress}%`,
            transition: 'width 0.4s ease',
          }} />
        </div>
      </div>

      {/* Daily Questions */}
      {dailyProblems.length > 0 && (
        <div className="card" style={{
          padding: 20, marginBottom: 24,
          borderColor: 'rgba(99,102,241,0.3)',
          background: 'linear-gradient(135deg, rgba(99,102,241,0.05), rgba(167,139,250,0.05))',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <span style={{ fontSize: 20 }}>📅</span>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>Today's Practice</h3>
            <span style={{
              background: 'rgba(99,102,241,0.15)', color: '#818cf8',
              borderRadius: 12, padding: '2px 10px', fontSize: 11, fontWeight: 700,
            }}>from unrevised</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 12 }}>
            {dailyProblems.map(p => {
              const d = DIFF_STYLE[p.difficulty]
              const pSolved = isSolved(p.id)
              return (
                <div key={p.id} style={{
                  background: 'var(--surface-2)', border: `1px solid ${pSolved ? 'rgba(34,197,94,0.3)' : 'var(--border)'}`,
                  borderRadius: 10, padding: '14px 16px',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
                  opacity: pSolved ? 0.6 : 1,
                  transition: 'opacity 0.3s ease, border-color 0.3s ease',
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {p.id}. {p.name}
                    </div>
                    <span style={{ ...badgeStyle, background: d.bg, color: d.color, border: `1px solid ${d.border}` }}>{p.difficulty}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <a href={p.url} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm" style={{ textDecoration: 'none', fontSize: 12, padding: '5px 10px' }}>
                      ↗ LC
                    </a>
                    {!pSolved && (
                      <button className="btn btn-success btn-sm" onClick={() => handleSolve(p)} disabled={solvingId === p.id}
                        style={{ fontSize: 12, padding: '5px 12px' }}>
                        {solvingId === p.id ? '...' : '✓ Solve'}
                      </button>
                    )}
                    {pSolved && <span style={{ color: '#22c55e', fontSize: 13, fontWeight: 700 }}>✓ Done</span>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Problem categories with toggle */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {Object.entries(categories).map(([cat, problems]) => {
          const isOpen = openCats[cat] ?? false
          const catSolved = problems.filter(p => isSolved(p.id)).length
          return (
            <div key={cat} className="card" style={{ overflow: 'hidden' }}>
              {/* Category header — clickable toggle */}
              <button
                onClick={() => toggleCat(cat)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '16px 20px', cursor: 'pointer',
                  background: 'transparent', border: 'none', fontFamily: 'var(--font-sans)',
                  color: 'var(--text)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{
                    fontSize: 12, transition: 'transform 0.2s',
                    transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                    color: 'var(--text-3)',
                  }}>▶</span>
                  <span style={{ fontSize: 15, fontWeight: 700 }}>{cat}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500 }}>({problems.length})</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 12, color: catSolved === problems.length ? '#22c55e' : 'var(--text-3)', fontWeight: 600 }}>
                    {catSolved}/{problems.length}
                  </span>
                  {/* Mini progress */}
                  <div style={{ width: 60, height: 4, borderRadius: 2, background: 'var(--bg-3)', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: 2,
                      background: catSolved === problems.length ? '#22c55e' : series.color,
                      width: `${problems.length > 0 ? catSolved / problems.length * 100 : 0}%`,
                      transition: 'width 0.3s ease',
                    }} />
                  </div>
                </div>
              </button>

              {/* Expanded problem list */}
              {isOpen && (
                <div style={{
                  borderTop: '1px solid var(--border)',
                  animation: 'fadeUp 0.2s ease forwards',
                }}>
                  {problems.map((p, idx) => {
                    const d = DIFF_STYLE[p.difficulty]
                    const pSolved = isSolved(p.id)
                    return (
                      <div
                        key={`${p.id}-${idx}`}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '10px 20px', gap: 12,
                          borderBottom: idx < problems.length - 1 ? '1px solid var(--border)' : 'none',
                          background: pSolved ? 'rgba(34,197,94,0.10)' : 'transparent',
                          transition: 'background 0.15s',
                        }}
                      >
                        {/* Status indicator */}
                        <div style={{
                          width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                          background: pSolved ? '#22c55e' : 'var(--border-2)',
                          border: pSolved ? 'none' : '1.5px solid var(--text-3)',
                          transition: 'all 0.2s',
                        }} />

                        {/* Problem name */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <span style={{
                            fontSize: 14, fontWeight: 500,
                            color: pSolved ? 'var(--text-3)' : 'var(--text)',
                            textDecoration: pSolved ? 'line-through' : 'none',
                          }}>
                            {p.id}. {p.name}
                          </span>
                        </div>

                        {/* Difficulty badge */}
                        <span style={{
                          ...badgeStyle,
                          background: d.bg, color: d.color, border: `1px solid ${d.border}`,
                          flexShrink: 0,
                        }}>
                          {p.difficulty}
                        </span>

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                          <a href={p.url} target="_blank" rel="noopener noreferrer"
                            style={{
                              padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                              textDecoration: 'none', color: 'var(--accent)',
                              background: 'var(--accent-glow)', border: '1px solid rgba(124,111,247,0.2)',
                              transition: 'all 0.15s', display: 'inline-flex', alignItems: 'center', gap: 4,
                            }}>
                            ↗ LeetCode
                          </a>
                          {!pSolved ? (
                            <button
                              className="btn btn-sm"
                              onClick={() => handleSolve({ ...p, category: cat })}
                              disabled={solvingId === p.id}
                              style={{
                                background: 'rgba(34,197,94,0.1)', color: '#22c55e',
                                border: '1px solid rgba(34,197,94,0.25)',
                                padding: '4px 12px', fontSize: 12, fontWeight: 600,
                              }}
                            >
                              {solvingId === p.id ? '...' : 'Solve'}
                            </button>
                          ) : (
                            <span style={{ fontSize: 12, color: '#22c55e', fontWeight: 700, padding: '4px 8px' }}>✓ Solved</span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

const badgeStyle = {
  display: 'inline-block', padding: '2px 8px', borderRadius: 5,
  fontSize: 11, fontWeight: 600, marginTop: 4,
}
