import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getProblemAttempts, getProblems } from '../api'
import { useRefresh } from '../context/AppDataContext'
import ScoreBadge from '../components/ScoreBadge'
import RevisionModal from '../components/RevisionModal'

const DIFF_COLOR = { Easy: '#10b981', Medium: '#eab308', Hard: '#ef4444' }

function ScoreBar({ score }) {
  if (score === null || score === undefined) return null
  const pct = (score / 6) * 100
  const color = score >= 3 ? '#10b981' : score >= 2 ? '#eab308' : '#ef4444'
  return (
    <div style={{ background: '#1a2234', borderRadius: 4, height: 6, overflow: 'hidden' }}>
      <div style={{
        width: `${pct}%`, height: '100%',
        background: `linear-gradient(90deg, ${color}80, ${color})`,
        borderRadius: 4, transition: 'width 0.5s ease',
      }} />
    </div>
  )
}

export default function ProblemDetail() {
  const { id } = useParams()
  const refresh = useRefresh()
  const [attempts, setAttempts] = useState([])
  const [problem, setProblem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [revisingProblem, setRevisingProblem] = useState(null)
  const [expandedAttempt, setExpandedAttempt] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [attemptData, allProblems] = await Promise.all([
        getProblemAttempts(id),
        getProblems(),
      ])
      setAttempts(attemptData)
      const found = allProblems.find(p => String(p.user_problem_id) === String(id))
      setProblem(found || null)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])

  if (loading) {
    return (
      <div style={{ maxWidth: 880, margin: '0 auto', padding: '0 24px' }}>
        {[0, 1, 2].map(i => <div key={i} className="skeleton" style={{ height: 80, marginBottom: 12 }} />)}
      </div>
    )
  }

  if (!problem) {
    return (
      <div style={{ maxWidth: 880, margin: '0 auto', padding: '48px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
        <h2 style={{ color: '#f1f5f9' }}>Problem not found</h2>
        <Link to="/problems" className="btn-secondary" style={{ display: 'inline-block', textDecoration: 'none', marginTop: 12 }}>
          ← Back to Problems
        </Link>
      </div>
    )
  }

  const diffColor = DIFF_COLOR[problem.difficulty] || '#94a3b8'

  // Score trend for chart
  const scoreTrend = [...attempts].reverse().map((a, i) => ({
    idx: i + 1,
    score: a.score,
    effective: a.effective_score_after,
    date: a.attempted_at?.split('T')[0],
  }))

  return (
    <div style={{ maxWidth: 880, margin: '0 auto', padding: '0 24px' }}>
      {/* Back */}
      <Link to="/problems" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#64748b', textDecoration: 'none', fontSize: 13, marginBottom: 20 }}>
        ← All Problems
      </Link>

      {/* Problem header */}
      <div className="card" style={{ padding: '24px 28px', marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{
                background: `${diffColor}18`, color: diffColor, border: `1px solid ${diffColor}40`,
                borderRadius: 7, padding: '3px 10px', fontSize: 12, fontWeight: 700,
              }}>
                {problem.difficulty}
              </span>
              <span style={{ fontSize: 12, color: '#4a5d7a' }}>{problem.category}</span>
            </div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#f1f5f9' }}>{problem.name}</h1>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <a
              href={problem.leetcode_url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary"
              style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13 }}
            >
              ↗ Open LeetCode
            </a>
            {problem.bracket >= 1 && (
              <button
                className="btn-primary"
                onClick={() => setRevisingProblem(problem)}
              >
                ⟳ Submit Revision
              </button>
            )}
          </div>
        </div>

        {/* Quick stats */}
        <div style={{ display: 'flex', gap: 24, marginTop: 20, paddingTop: 16, borderTop: '1px solid #1e2d45', flexWrap: 'wrap' }}>
          {[
            { label: 'Bracket', value: problem.bracket === 1 ? '① Unrevised' : '② Revised', color: problem.bracket === 1 ? '#818cf8' : '#34d399' },
            { label: 'Revisions', value: problem.attempt_count },
            { label: 'Eff. Score', value: problem.current_effective_score !== null ? problem.current_effective_score?.toFixed(2) : '—' },
            { label: 'Next Due', value: problem.next_revision_date || '—' },
          ].map(s => (
            <div key={s.label}>
              <div style={{ fontSize: 11, color: '#4a5d7a', marginBottom: 3 }}>{s.label}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: s.color || '#f1f5f9' }}>{s.value}{s.label === 'Eff. Score' && s.value !== '—' ? '/3' : ''}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Score trend mini-chart */}
      {scoreTrend.length > 0 && (
        <div className="card" style={{ padding: '20px 24px', marginBottom: 24 }}>
          <h2 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: '#94a3b8' }}>
            Score Trend ({scoreTrend.length} revision{scoreTrend.length !== 1 ? 's' : ''})
          </h2>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 70 }}>
            {scoreTrend.map((t) => (
              <div key={t.idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, minWidth: 0 }}>
                <div style={{
                  width: '100%',
                  height: `${(t.score / 6) * 56}px`,
                  minHeight: 4,
                  background: t.score >= 3 ? '#10b981' : t.score >= 2 ? '#eab308' : t.score <= 0 ? '#ef4444' : '#f97316',
                  borderRadius: '4px 4px 0 0',
                  transition: 'height 0.3s ease',
                }} />
                <span style={{ fontSize: 9, color: '#4a5d7a' }}>{t.date?.slice(5)}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            <span style={{ fontSize: 11, color: '#4a5d7a' }}>earliest</span>
            <span style={{ fontSize: 11, color: '#4a5d7a' }}>latest</span>
          </div>
        </div>
      )}

      {/* Attempt history timeline */}
      <h2 style={{ fontSize: 16, fontWeight: 700, color: '#94a3b8', marginBottom: 14 }}>
        Attempt History
      </h2>

      {attempts.length === 0 ? (
        <div style={{
          padding: '32px', textAlign: 'center', color: '#4a5d7a', fontSize: 14,
          border: '1px dashed #1e2d45', borderRadius: 14,
        }}>
          No revision attempts yet.
          {problem.bracket === 1 && ' Mark as solved first, then submit revisions.'}
        </div>
      ) : (
        <div style={{ position: 'relative' }}>
          {/* Timeline line */}
          <div style={{
            position: 'absolute', left: 19, top: 0, bottom: 0,
            width: 2,
            background: 'linear-gradient(to bottom, #6366f1, transparent)',
          }} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {attempts.map((a, idx) => {
              const isExpanded = expandedAttempt === a.id
              return (
                <div key={a.id} style={{ paddingLeft: 48, position: 'relative' }}>
                  {/* Circle */}
                  <div style={{
                    position: 'absolute', left: 10, top: 18,
                    width: 20, height: 20, borderRadius: '50%',
                    background: a.score >= 3 ? '#10b981' : a.score >= 2 ? '#eab308' : a.score <= 0 ? '#ef4444' : '#f97316',
                    border: '3px solid #0a0f1e',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 9, color: 'white', fontWeight: 800,
                  }}>
                    {a.score}
                  </div>

                  <div className="card" style={{ padding: '16px 18px' }}>
                    <div
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', gap: 12 }}
                      onClick={() => setExpandedAttempt(isExpanded ? null : a.id)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                        <ScoreBadge score={a.score} showLabel />
                        <span style={{ fontSize: 12, color: '#64748b' }}>
                          {new Date(a.attempted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        <span style={{ fontSize: 12, color: '#4a5d7a' }}>
                          {a.hint_count} hint{a.hint_count !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 12, color: '#64748b' }}>
                          eff: <span style={{ color: '#94a3b8', fontFamily: 'JetBrains Mono, monospace' }}>
                            {a.effective_score_after?.toFixed(2)}
                          </span>
                        </span>
                        <span style={{ color: '#4a5d7a', fontSize: 14 }}>{isExpanded ? '▲' : '▼'}</span>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="animate-fade-in" style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #1e2d45' }}>
                        {/* Solutions pasted */}
                        {a.solutions_pasted && (
                          <details style={{ marginTop: 12 }}>
                            <summary style={{ cursor: 'pointer', fontSize: 12, color: '#6366f1', fontWeight: 600, marginBottom: 8 }}>
                              View pasted solutions
                            </summary>
                            <pre style={{
                              background: 'rgba(17,24,39,0.8)',
                              border: '1px solid #1e2d45',
                              borderRadius: 10, padding: 14,
                              fontSize: 12, color: '#94a3b8',
                              fontFamily: 'JetBrains Mono, monospace',
                              overflowX: 'auto',
                              whiteSpace: 'pre-wrap',
                              wordBreak: 'break-word',
                              margin: 0,
                            }}>
                              {a.solutions_pasted}
                            </pre>
                          </details>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {revisingProblem && (
        <RevisionModal
          problem={revisingProblem}
          onClose={() => setRevisingProblem(null)}
          onSuccess={() => { load(); refresh() }}
        />
      )}
    </div>
  )
}
