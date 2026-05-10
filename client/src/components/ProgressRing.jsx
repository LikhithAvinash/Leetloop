/**
 * ProgressRing — Donut chart showing score bracket distribution.
 * Score brackets 0–6 each get a unique color arc segment.
 * Hover on a segment to see "count / score".
 */
import { useState } from 'react'

const BRACKET_META = [
  { label: 'Score 0', color: '#ef4444' },   // red
  { label: 'Score 1', color: '#f97316' },   // orange
  { label: 'Score 2', color: '#eab308' },   // yellow
  { label: 'Score 3', color: '#22c55e' },   // green
]

const SIZE = 170
const STROKE = 16
const RADIUS = (SIZE - STROKE) / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS
const CENTER = SIZE / 2

export default function ProgressRing({ stats, loading }) {
  const [hovered, setHovered] = useState(null) // { score, count, x, y }

  if (loading || !stats) {
    return (
      <div style={{
        width: SIZE, height: SIZE + 50, display: 'flex',
        alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <div className="skeleton" style={{ width: SIZE, height: SIZE, borderRadius: '50%' }} />
      </div>
    )
  }

  const { distribution = [0, 0, 0, 0], inRevision = 0, unsolved = 0, total = 0 } = stats
  const totalDist = distribution.reduce((a, b) => a + b, 0)

  // Build arc segments
  const segments = []
  let offset = 0

  if (totalDist > 0) {
    for (let i = 0; i < 4; i++) {
      if (distribution[i] === undefined || distribution[i] === 0) continue
      const fraction = distribution[i] / totalDist
      const segLength = fraction * CIRCUMFERENCE
      const gap = totalDist > 1 ? 3 : 0
      segments.push({
        ...BRACKET_META[i],
        count: distribution[i],
        dasharray: `${Math.max(0, segLength - gap)} ${CIRCUMFERENCE - Math.max(0, segLength - gap)}`,
        offset: -offset,
        score: i,
        startAngle: (offset / CIRCUMFERENCE) * 360,
        endAngle: ((offset + segLength) / CIRCUMFERENCE) * 360,
      })
      offset += segLength
    }
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: 8, flexShrink: 0, position: 'relative',
    }}>
      {/* Donut */}
      <div style={{ position: 'relative', width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}
          style={{ transform: 'rotate(-90deg)' }}>
          {/* Background track */}
          <circle
            cx={CENTER} cy={CENTER} r={RADIUS}
            fill="none" stroke="rgba(255,255,255,0.06)"
            strokeWidth={STROKE}
          />
          {/* Score segments */}
          {segments.map((seg, i) => (
            <circle
              key={i}
              cx={CENTER} cy={CENTER} r={RADIUS}
              fill="none"
              stroke={hovered?.score === seg.score ? seg.color : `${seg.color}cc`}
              strokeWidth={hovered?.score === seg.score ? STROKE + 4 : STROKE}
              strokeDasharray={seg.dasharray}
              strokeDashoffset={seg.offset}
              strokeLinecap="round"
              style={{
                filter: hovered?.score === seg.score
                  ? `drop-shadow(0 0 8px ${seg.color}88)`
                  : `drop-shadow(0 0 3px ${seg.color}33)`,
                transition: 'all 0.2s ease',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                const rect = e.currentTarget.closest('svg').getBoundingClientRect()
                setHovered({
                  score: seg.score,
                  count: seg.count,
                  color: seg.color,
                })
              }}
              onMouseLeave={() => setHovered(null)}
            />
          ))}
          {/* Dot markers at segment start */}
          {segments.length > 1 && segments.map((seg, i) => {
            const angle = ((-seg.offset) / CIRCUMFERENCE) * 2 * Math.PI
            const x = CENTER + RADIUS * Math.cos(angle)
            const y = CENTER + RADIUS * Math.sin(angle)
            return (
              <circle key={`dot-${i}`} cx={x} cy={y} r={2.5}
                fill={seg.color} stroke="var(--surface)" strokeWidth={1.5}
                style={{ pointerEvents: 'none' }}
              />
            )
          })}
        </svg>

        {/* Center text */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'none',
        }}>
          {hovered ? (
            /* Show hovered segment info */
            <>
              <div style={{
                fontSize: 28, fontWeight: 900, lineHeight: 1,
                color: hovered.color,
              }}>
                {hovered.count}<span style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-3)' }}>/{hovered.score}</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4, fontWeight: 500 }}>
                problems / score
              </div>
            </>
          ) : (
            /* Default view */
            <>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
                <span style={{ fontSize: 34, fontWeight: 900, color: 'var(--text)', lineHeight: 1 }}>
                  {inRevision}
                </span>
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-3)' }}>
                  /{total}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3 }}>
                <span style={{ color: '#22c55e', fontSize: 13 }}>✓</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)' }}>Solved</span>
              </div>
              {unsolved > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                  <span style={{
                    width: 5, height: 5, borderRadius: '50%',
                    background: '#60a5fa', display: 'inline-block',
                  }} />
                  <span style={{ fontSize: 10, color: 'var(--text-3)' }}>{unsolved} Bracket 1</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Legend row */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: '3px 8px',
        justifyContent: 'center', maxWidth: SIZE + 20,
      }}>
        {BRACKET_META.map((b, i) => {
          if (distribution[i] === 0) return null
          return (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 3,
              fontSize: 10, color: hovered?.score === i ? b.color : 'var(--text-3)',
              fontWeight: hovered?.score === i ? 700 : 500,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
              onMouseEnter={() => setHovered({ score: i, count: distribution[i], color: b.color })}
              onMouseLeave={() => setHovered(null)}
            >
              <div style={{
                width: 7, height: 7, borderRadius: 2,
                background: b.color, flexShrink: 0,
              }} />
              <span>{distribution[i]}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
