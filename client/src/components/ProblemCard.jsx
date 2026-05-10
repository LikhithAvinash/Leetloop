import { Link } from 'react-router-dom'
import ScoreBadge from './ScoreBadge'

const DIFF_CLASS = { Easy: 'badge-easy', Medium: 'badge-medium', Hard: 'badge-hard' }

export default function ProblemCard({ problem, onSolve, onRevise }) {
  const {
    user_problem_id, bracket, name, difficulty, category,
    leetcode_url, current_effective_score, next_revision_date,
    attempt_count, consecutive_zero_count,
    has_hint_attempt, has_nohint_attempt,
  } = problem

  const isMixedHint = bracket === 2 && has_hint_attempt === 1 && has_nohint_attempt === 1

  const today = new Date().toISOString().split('T')[0]
  const isDue = next_revision_date && next_revision_date <= today
  const daysUntil = next_revision_date
    ? Math.ceil((new Date(next_revision_date + 'T00:00:00Z') - new Date()) / 86400000)
    : null

  return (
    <div className="card card-hover animate-fade-up" style={{ padding: '14px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap', marginBottom: 5 }}>
            <span className={DIFF_CLASS[difficulty]} style={{ borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>
              {difficulty}
            </span>
            {consecutive_zero_count >= 1 && (
              <span style={{ fontSize: 11, color: 'var(--danger)', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)', borderRadius: 6, padding: '2px 7px' }}>
                ⚠ {consecutive_zero_count} zero{consecutive_zero_count > 1 ? 's' : ''}
              </span>
            )}
            {isMixedHint && (
              <span
                title="Solved at least once without a hint AND at least once with a hint"
                style={{ fontSize: 11, color: '#a78bfa', background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.25)', borderRadius: 6, padding: '2px 7px', cursor: 'default' }}
              >
                🔀 No-hint ✓ + With-hint
              </span>
            )}
          </div>
          <Link to={`/problems/${user_problem_id}`}
            style={{ textDecoration: 'none', color: 'var(--text)', fontWeight: 600, fontSize: 14, lineHeight: 1.4 }}>
            {name}
          </Link>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-3)' }}>{category}</p>
        </div>
        <ScoreBadge
          score={current_effective_score !== null && current_effective_score !== undefined ? Math.round(current_effective_score) : null}
          size="sm"
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--border)', gap: 8, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--text-3)' }}>
          {bracket === 2 && (
            <>
              <span>{attempt_count} rev{attempt_count !== 1 ? 's' : ''}</span>
              {next_revision_date && (
                <span style={{ color: isDue ? 'var(--warning)' : 'var(--text-3)' }}>
                  {isDue ? `Overdue ${Math.abs(daysUntil)}d` : daysUntil === 0 ? 'Due today' : `In ${daysUntil}d`}
                </span>
              )}
            </>
          )}
          {bracket === 1 && <span style={{ color: 'var(--accent)' }}>Unrevised</span>}
        </div>

        <div style={{ display: 'flex', gap: 7 }}>
          <a href={leetcode_url} target="_blank" rel="noopener noreferrer"
            className="btn btn-ghost btn-sm"
            style={{ textDecoration: 'none' }}>
            ↗ LC
          </a>
          {(bracket === 1 || bracket === 2) && onRevise && (
            <button className="btn btn-primary btn-sm" onClick={() => onRevise(problem)}>
              ⟳ Revise
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
