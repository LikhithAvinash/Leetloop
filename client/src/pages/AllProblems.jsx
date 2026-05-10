import { useState } from 'react'
import { solveProblem } from '../api'
import { useAppData, useRefresh } from '../context/AppDataContext'
import SearchBar from '../components/SearchBar'
import BracketColumn from '../components/BracketColumn'
import RevisionModal from '../components/RevisionModal'

// A problem has the "mixed hint" condition when it has been solved BOTH
// with a hint (hint_count > 0) AND without a hint (hint_count = 0) at least once.
function isMixedHint(p) {
  return p.has_hint_attempt === 1 && p.has_nohint_attempt === 1
}

const FILTER_OPTIONS = [
  { key: 'all',    label: 'All' },
  { key: 'Easy',   label: 'Easy' },
  { key: 'Medium', label: 'Medium' },
  { key: 'Hard',   label: 'Hard' },
  {
    key: 'mixed-hint',
    label: '🔀 No-hint + With-hint',
    title: 'Bracket 2 problems where you solved at least once WITHOUT a hint AND at least once WITH a hint',
  },
]

export default function AllProblems() {
  const { problems: all, loading } = useAppData()
  const refresh = useRefresh()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [revisingProblem, setRevisingProblem] = useState(null)

  async function handleSolve(userProblemId) {
    try {
      await solveProblem(userProblemId)
      refresh()
    } catch (err) {
      alert(err.message)
    }
  }

  const filtered = all.filter(p => {
    const matchesSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.category.toLowerCase().includes(search.toLowerCase())
    const matchesDiff =
      filter === 'all'       ? true :
      filter === 'mixed-hint'? (p.bracket === 2 && isMixedHint(p)) :
                               p.difficulty === filter
    return matchesSearch && matchesDiff
  })

  const bracket1 = filtered.filter(p => p.bracket === 1)
  const bracket2 = filtered.filter(p => p.bracket === 2)

  // Count for the badge on the mixed-hint button
  const mixedCount = all.filter(p => p.bracket === 2 && isMixedHint(p)).length

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{
          margin: '0 0 6px', fontSize: 28, fontWeight: 900,
          background: 'linear-gradient(135deg, #6366f1, #a78bfa)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
        }}>
          All Problems
        </h1>
        <p style={{ margin: 0, color: '#64748b', fontSize: 14 }}>
          {all.length} problems tracked · {all.filter(p => p.bracket === 1).length} unrevised · {all.filter(p => p.bracket === 2).length} revised
          {mixedCount > 0 && (
            <span style={{ marginLeft: 8, color: '#a78bfa' }}>
              · {mixedCount} mixed-hint
            </span>
          )}
        </p>
      </div>

      {/* Search & filter bar */}
      <div style={{
        display: 'flex', gap: 12, alignItems: 'center',
        marginBottom: 24, flexWrap: 'wrap',
      }}>
        <SearchBar onAdded={refresh} />

        <input
          className="input-field"
          style={{ maxWidth: 220 }}
          placeholder="Filter by name / category..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {FILTER_OPTIONS.map(f => {
            const isActive = filter === f.key
            const isMixed = f.key === 'mixed-hint'

            // Color logic per filter
            const activeColor =
              f.key === 'Easy'   ? 'rgba(16,185,129,1)'  :
              f.key === 'Medium' ? 'rgba(234,179,8,1)'   :
              f.key === 'Hard'   ? 'rgba(239,68,68,1)'   :
              isMixed            ? 'rgba(167,139,250,1)'  :
                                   'rgba(99,102,241,1)'
            const activeBorder =
              f.key === 'Easy'   ? 'rgba(16,185,129,0.4)'  :
              f.key === 'Medium' ? 'rgba(234,179,8,0.4)'   :
              f.key === 'Hard'   ? 'rgba(239,68,68,0.4)'   :
              isMixed            ? 'rgba(167,139,250,0.4)'  :
                                   'rgba(99,102,241,0.4)'
            const activeBg =
              isMixed ? 'rgba(167,139,250,0.1)' : 'rgba(99,102,241,0.1)'

            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                title={f.title || undefined}
                style={{
                  padding: isMixed ? '8px 14px' : '8px 14px',
                  borderRadius: 8,
                  border: `1px solid ${isActive ? activeBorder : '#2a3d5a'}`,
                  background: isActive ? activeBg : 'transparent',
                  color: isActive ? activeColor : '#64748b',
                  cursor: 'pointer',
                  fontSize: 12, fontWeight: 600,
                  transition: 'all 0.15s ease',
                  fontFamily: 'Inter, sans-serif',
                  display: 'flex', alignItems: 'center', gap: 5,
                }}
              >
                {f.label}
                {isMixed && mixedCount > 0 && (
                  <span style={{
                    background: isActive ? 'rgba(167,139,250,0.25)' : 'rgba(99,102,241,0.15)',
                    color: isActive ? '#a78bfa' : '#818cf8',
                    borderRadius: 10, padding: '1px 6px', fontSize: 11, fontWeight: 700,
                  }}>
                    {mixedCount}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Two-column bracket layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <BracketColumn
          bracket={1}
          problems={bracket1}
          loading={loading}
          onRevise={setRevisingProblem}
        />
        <BracketColumn
          bracket={2}
          problems={bracket2}
          loading={loading}
          onRevise={setRevisingProblem}
        />
      </div>

      {revisingProblem && (
        <RevisionModal
          problem={revisingProblem}
          onClose={() => setRevisingProblem(null)}
          onSuccess={() => { setRevisingProblem(null); refresh() }}
        />
      )}
    </div>
  )
}
