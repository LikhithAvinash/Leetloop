const SCORE_LABELS = ['Failed', 'Shaky', 'Good', 'Perfect']

export default function ScoreBadge({ score, size = 'md', showLabel = false }) {
  const isNull = score === null || score === undefined
  const cls = isNull ? '' : `score-${Math.max(0, Math.min(3, score))}`

  return (
    <span
      className={cls}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        borderRadius: 7,
        padding: size === 'sm' ? '2px 8px' : '4px 11px',
        fontSize: size === 'sm' ? 11 : 12,
        fontWeight: 700,
        fontFamily: 'var(--font-mono)',
        background: isNull ? 'var(--surface-2)' : undefined,
        color: isNull ? 'var(--text-3)' : undefined,
        border: isNull ? '1px solid var(--border)' : undefined,
      }}
    >
      {isNull ? '—' : score}
      {!isNull && showLabel && (
        <span style={{ fontWeight: 500, fontFamily: 'var(--font-sans)', fontSize: 11 }}>
          {SCORE_LABELS[score]}
        </span>
      )}
    </span>
  )
}
