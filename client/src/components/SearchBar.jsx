import { useState, useEffect, useRef } from 'react'
import { searchProblems, addProblem } from '../api'

export default function SearchBar({ onAdded }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [adding, setAdding] = useState(null)
  const [added, setAdded] = useState(null)
  const [error, setError] = useState('')
  const timerRef = useRef(null)
  const containerRef = useRef(null)

  useEffect(() => {
    if (query.length < 2) { setResults([]); setOpen(false); return }
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const data = await searchProblems(query)
        setResults(data)
        setOpen(true)
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 400)
  }, [query])

  useEffect(() => {
    function handleClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function handleAdd(p) {
    setAdding(p.leetcode_id)
    setError('')
    try {
      await addProblem(p)
      setAdded(p.leetcode_id)
      setTimeout(() => setAdded(null), 2000)
      setQuery('')
      setOpen(false)
      onAdded && onAdded()
    } catch (err) {
      setError(err.message)
    } finally {
      setAdding(null)
    }
  }

  const diffColor = { Easy: '#10b981', Medium: '#eab308', Hard: '#ef4444' }

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', maxWidth: 520 }}>
      <div style={{ position: 'relative' }}>
        <span style={{
          position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
          color: '#4a5d7a', fontSize: 16, pointerEvents: 'none',
        }}>🔍</span>
        <input
          id="search-bar-input"
          className="input-field"
          style={{ paddingLeft: 40 }}
          placeholder="Search LeetCode problems to add..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
        />
        {loading && (
          <span style={{
            position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
            color: '#6366f1', fontSize: 12,
          }}>⟳</span>
        )}
      </div>

      {error && <p style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{error}</p>}

      {open && results.length > 0 && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          marginTop: 6,
          background: '#111827',
          border: '1px solid #2a3d5a',
          borderRadius: 12,
          zIndex: 100,
          maxHeight: 320,
          overflowY: 'auto',
          boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
        }}>
          {results.map(p => (
            <div
              key={p.leetcode_id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderBottom: '1px solid #1e2d45',
                gap: 10,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#f1f5f9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {p.leetcode_id}. {p.name}
                </p>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>{p.category}</p>
              </div>
              <span style={{ color: diffColor[p.difficulty], fontSize: 12, fontWeight: 600, flexShrink: 0 }}>{p.difficulty}</span>
              <button
                className="btn-primary"
                style={{ padding: '6px 14px', fontSize: 13, flexShrink: 0 }}
                disabled={adding === p.leetcode_id || added === p.leetcode_id}
                onClick={() => handleAdd(p)}
              >
                {added === p.leetcode_id ? '✓ Added' : adding === p.leetcode_id ? '...' : '+ Add'}
              </button>
            </div>
          ))}
        </div>
      )}

      {open && results.length === 0 && !loading && query.length >= 2 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 6,
          background: '#111827', border: '1px solid #2a3d5a', borderRadius: 12,
          padding: '16px', textAlign: 'center', color: '#4a5d7a', fontSize: 14,
          boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
        }}>
          No results for "{query}"
        </div>
      )}
    </div>
  )
}
