import { useMemo, useRef, useEffect } from 'react'
import ProgressRing from './ProgressRing'

const CELL    = 13
const GAP     = 3
const MON_GAP = 10
const MONTHS  = 6

/* ── Effective Score Gauge ─────────────────────────────────────── */
function EffectiveScoreGauge({ score = 0, loading }) {
  if (loading) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', minWidth: 120, gap: 8,
      }}>
        <div className="skeleton" style={{ width: 100, height: 100, borderRadius: '50%' }} />
      </div>
    )
  }

  // Color based on score
  const getScoreColor = (s) => {
    if (s >= 70) return '#22c55e'  // green — strong
    if (s >= 40) return '#eab308'  // yellow — average
    return '#ef4444'               // red — needs work
  }

  const getScoreLabel = (s) => {
    if (s >= 70) return 'Strong'
    if (s >= 40) return 'Average'
    return 'Needs Work'
  }

  const color = getScoreColor(score)
  const SIZE = 120
  const STROKE = 10
  const RADIUS = (SIZE - STROKE) / 2
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS
  const progress = (score / 100) * CIRCUMFERENCE

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: 6, flexShrink: 0,
    }}>
      <div style={{ position: 'relative', width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}
          style={{ transform: 'rotate(-90deg)' }}>
          {/* Background track */}
          <circle
            cx={SIZE / 2} cy={SIZE / 2} r={RADIUS}
            fill="none" stroke="rgba(255,255,255,0.06)"
            strokeWidth={STROKE}
          />
          {/* Progress arc */}
          <circle
            cx={SIZE / 2} cy={SIZE / 2} r={RADIUS}
            fill="none" stroke={color}
            strokeWidth={STROKE}
            strokeDasharray={`${progress} ${CIRCUMFERENCE - progress}`}
            strokeLinecap="round"
            style={{
              filter: `drop-shadow(0 0 6px ${color}55)`,
              transition: 'stroke-dasharray 0.8s ease, stroke 0.3s ease',
            }}
          />
        </svg>

        {/* Center text */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{
            fontSize: 30, fontWeight: 900, lineHeight: 1,
            color: color,
          }}>
            {score}
          </span>
          <span style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 600, marginTop: 2 }}>
            / 100
          </span>
        </div>
      </div>

      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color }}>
          {getScoreLabel(score)}
        </div>
        <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 1 }}>
          Effective Score
        </div>
      </div>
    </div>
  )
}

/* ── Main StreakCalendar Component ──────────────────────────────── */
export default function StreakCalendar({ streakData = {}, stats, statsLoading }) {
  const scrollRef = useRef(null)

  const { groups } = useMemo(() => {
    const today    = new Date()
    const todayStr = today.toISOString().split('T')[0]

    const start = new Date(today.getFullYear(), today.getMonth() - MONTHS, 1)
    start.setDate(start.getDate() - start.getDay())

    const end = new Date(today.getFullYear(), today.getMonth() + 1, 0)
    end.setDate(end.getDate() + (6 - end.getDay()))

    const cells = []
    const d = new Date(start)
    while (d <= end) {
      const key = d.toISOString().split('T')[0]
      cells.push({
        date:     key,
        count:    streakData[key] || 0,
        isFuture: key > todayStr,
        day:      d.getDate(),
        isToday:  key === todayStr,
      })
      d.setDate(d.getDate() + 1)
    }

    const weeks = []
    for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))

    const groups = []
    for (const week of weeks) {
      const label = new Date(week[0].date + 'T00:00:00')
        .toLocaleString('en-US', { month: 'short' })
      const last = groups[groups.length - 1]
      if (!last || last.label !== label) groups.push({ label, weeks: [week] })
      else last.weeks.push(week)
    }

    return { groups }
  }, [streakData])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth
    }
  }, [groups])

  const maxCount = Math.max(1, ...Object.values(streakData).map(Number).filter(Boolean))
  const DAY_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', '']
  const LABEL_W = 26

  function getColor(count, isFuture) {
    if (isFuture || !count) return 'rgba(255,255,255,0.05)'
    const r = count / maxCount
    if (r <= 0.25) return '#0e4429'
    if (r <= 0.5)  return '#006d32'
    if (r <= 0.75) return '#26a641'
    return '#39d353'
  }

  return (
    <div className="card" style={{ padding: '20px 24px' }}>
      {/* 3-column layout: ProgressRing | Streak | EffectiveScore */}
      <div style={{
        display: 'flex', gap: 24, alignItems: 'center',
        flexWrap: 'wrap',
      }}>
        {/* ── Left: Progress Ring ─────────────────────────────── */}
        <ProgressRing stats={stats} loading={statsLoading} />

        {/* ── Center: Streak Calendar ────────────────────────── */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: 18 }}>🔥</span>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>Streak</h3>
          </div>

          {/* Scrollable wrapper */}
          <div
            ref={scrollRef}
            style={{
              overflowX: 'auto', overflowY: 'hidden',
              scrollbarWidth: 'none', msOverflowStyle: 'none',
            }}
          >
            <style>{`.streak-scroll::-webkit-scrollbar { display: none; }`}</style>
            <div className="streak-scroll" style={{ display: 'inline-block', minWidth: 'max-content' }}>

              {/* Month label row */}
              <div style={{ display: 'flex', gap: 0, marginLeft: LABEL_W + 8, marginBottom: 4 }}>
                {groups.map((group, gi) => (
                  <div key={gi} style={{ display: 'flex', flexShrink: 0 }}>
                    {gi > 0 && <div style={{ width: MON_GAP }} />}
                    <div style={{ width: group.weeks.length * (CELL + GAP) - GAP }}>
                      <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-3)' }}>
                        {group.label}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* 7 rows of day cells */}
              {DAY_LABELS.map((label, di) => (
                <div key={di} style={{
                  display: 'flex', alignItems: 'center',
                  marginBottom: di < 6 ? GAP : 0,
                }}>
                  <div style={{
                    width: LABEL_W, flexShrink: 0, marginRight: 8,
                    fontSize: 9, color: 'var(--text-3)', fontWeight: 500,
                    textAlign: 'right',
                  }}>
                    {label}
                  </div>

                  {groups.map((group, gi) => (
                    <div key={gi} style={{ display: 'flex', flexShrink: 0 }}>
                      {gi > 0 && <div style={{ width: MON_GAP }} />}
                      <div style={{ display: 'flex', gap: GAP }}>
                        {group.weeks.map((week, wi) => {
                          const cell = week[di]
                          if (!cell) return <div key={wi} style={{ width: CELL, height: CELL }} />
                          return (
                            <div
                              key={wi}
                              title={`${cell.date}: ${cell.count} solve${cell.count !== 1 ? 's' : ''}`}
                              style={{
                                width: CELL, height: CELL,
                                borderRadius: 3, flexShrink: 0,
                                background: getColor(cell.count, cell.isFuture),
                                border: cell.isToday
                                  ? '1.5px solid var(--accent)'
                                  : '1px solid rgba(255,255,255,0.04)',
                                boxSizing: 'border-box',
                                cursor: cell.isFuture ? 'default' : 'pointer',
                                transition: 'opacity 0.15s',
                              }}
                              onMouseEnter={e => { if (!cell.isFuture) e.currentTarget.style.opacity = '0.65' }}
                              onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
                            />
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ))}

              {/* Legend */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 4, marginTop: 12,
                justifyContent: 'flex-end',
              }}>
                <span style={{ fontSize: 10, color: 'var(--text-3)', marginRight: 4 }}>Less</span>
                {[0, 0.25, 0.5, 0.75, 1].map((r, i) => (
                  <div key={i} style={{
                    width: CELL, height: CELL, borderRadius: 3, flexShrink: 0,
                    background: r === 0 ? 'rgba(255,255,255,0.05)' : getColor(Math.ceil(maxCount * r), false),
                  }} />
                ))}
                <span style={{ fontSize: 10, color: 'var(--text-3)', marginLeft: 4 }}>More</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right: Effective Score ──────────────────────────── */}
        <EffectiveScoreGauge
          score={stats?.averageEffectiveScore ?? 0}
          loading={statsLoading}
        />
      </div>
    </div>
  )
}
