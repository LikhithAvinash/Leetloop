import ProblemCard from './ProblemCard'

export default function BracketColumn({ bracket, problems, onSolve, onRevise, loading }) {
  const isB1 = bracket === 1
  const accentColor = isB1 ? 'var(--accent)' : 'var(--success)'
  const accentAlpha = isB1 ? 'var(--accent-glow)' : 'rgba(34,197,94,0.1)'

  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      {/* Header */}
      <div style={{
        background: accentAlpha,
        border: `1px solid ${isB1 ? 'var(--border-2)' : 'rgba(34,197,94,0.2)'}`,
        borderRadius: 'var(--radius)',
        padding: '12px 16px', marginBottom: 12,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: accentColor }}>
            {isB1 ? '① Bracket 1 — Unrevised' : '② Bracket 2 — Revision'}
          </h2>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-3)' }}>
            {isB1 ? "Solved but never revised" : "Scheduled for spaced repetition"}
          </p>
        </div>
        <span style={{ background: accentAlpha, color: accentColor, borderRadius: 20, padding: '3px 11px', fontSize: 13, fontWeight: 800 }}>
          {loading ? '—' : problems.length}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 100 }} />)
        ) : problems.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '36px 20px',
            color: 'var(--text-3)', fontSize: 14,
            border: '1px dashed var(--border-2)', borderRadius: 'var(--radius)',
          }}>
            {isB1 ? '🎯 No unrevised problems.' : '✨ Nothing in revision yet.'}
          </div>
        ) : (
          problems.map(p => (
            <ProblemCard key={p.user_problem_id} problem={p} onSolve={onSolve} onRevise={onRevise} />
          ))
        )}
      </div>
    </div>
  )
}
