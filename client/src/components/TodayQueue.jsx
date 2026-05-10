import { Link } from 'react-router-dom'
import ScoreBadge from './ScoreBadge'

const DIFF = {
  Easy: { color: '#22c55e', alpha: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.25)' },
  Medium: { color: '#f59e0b', alpha: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)' },
  Hard: { color: '#ef4444', alpha: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.25)' },
}

export default function TodayQueue({ problems, onRevise, loading }) {
  if (loading) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
        {[0, 1].map(i => <div key={i} className="skeleton" style={{ height: 200 }} />)}
      </div>
    )
  }

  if (problems.length === 0) {
    return (
      <div style={{
        textAlign: 'center', padding: '52px 24px',
        background: 'var(--surface)', border: '1px dashed var(--border-2)',
        borderRadius: 'var(--radius-lg)',
      }}>
        <div style={{ fontSize: 44, marginBottom: 10 }}>🎉</div>
        <h3 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>All caught up!</h3>
        <p style={{ margin: 0, color: 'var(--text-3)', fontSize: 13 }}>
          No problems due today. Add more or enjoy the break.
        </p>
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
      {problems.map((p, idx) => {
        const d = DIFF[p.difficulty] || DIFF.Medium
        return (
          <div key={p.user_problem_id} className="card animate-fade-up"
            style={{ padding: 22, borderColor: d.border, animationDelay: `${idx * 70}ms`, position: 'relative', overflow: 'hidden' }}>
            {/* Accent orb */}
            <div style={{
              position: 'absolute', top: -30, right: -30, width: 100, height: 100, borderRadius: '50%',
              background: `radial-gradient(circle, ${d.alpha}, transparent 70%)`,
              pointerEvents: 'none',
            }} />

            <div style={{ position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ background: d.alpha, color: d.color, border: `1px solid ${d.border}`, borderRadius: 7, padding: '3px 10px', fontSize: 12, fontWeight: 600 }}>
                  {p.difficulty}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-3)' }}>score</span>
                  <ScoreBadge score={p.current_effective_score !== null ? Math.round(p.current_effective_score) : null} size="sm" />
                </div>
              </div>

              <Link to={`/problems/${p.user_problem_id}`}
                style={{ textDecoration: 'none', color: 'var(--text)', fontWeight: 700, fontSize: 16, lineHeight: 1.35, display: 'block', marginBottom: 4 }}>
                {p.name}
              </Link>
              <p style={{ margin: '0 0 16px', fontSize: 12, color: 'var(--text-3)' }}>{p.category}</p>

              <div style={{ display: 'flex', gap: 18, marginBottom: 16, fontSize: 12 }}>
                <div>
                  <div style={{ color: 'var(--text-3)', marginBottom: 2 }}>Revisions</div>
                  <div style={{ color: 'var(--text)', fontWeight: 700 }}>{p.attempt_count}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-3)', marginBottom: 2 }}>Eff. Score</div>
                  <div style={{ color: 'var(--text)', fontWeight: 700 }}>
                    {p.current_effective_score !== null ? p.current_effective_score?.toFixed(1) : '—'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <a href={p.leetcode_url} target="_blank" rel="noopener noreferrer"
                  className="btn btn-secondary btn-sm" style={{ textDecoration: 'none', flex: '0 0 auto' }}>
                  ↗ LeetCode
                </a>
                <button
                  id={`revise-btn-${p.user_problem_id}`}
                  className="btn btn-primary btn-sm"
                  style={{ flex: 1 }}
                  onClick={() => onRevise(p)}
                >
                  ⟳ Revise
                </button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
