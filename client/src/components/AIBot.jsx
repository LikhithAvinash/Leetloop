import { useState, useRef, useEffect } from 'react'
import { getAIHint, evaluateCode } from '../api'

/**
 * AIBot — AI Assistant panel (right side of RevisionModal).
 *
 * No text input — it reads code from the shared `code` prop (managed by parent).
 * Two actions: Get Hint, Evaluate Code.
 *
 * Props:
 *   problem         — { name, difficulty, category }
 *   code            — the shared code string from the center editor
 *   onEvalResult    — callback when AI evaluation completes
 */
export default function AIBot({ problem, code, language, onEvalResult }) {
  const [hints, setHints] = useState([])
  const [hintLoading, setHintLoading] = useState(false)
  const [evalResult, setEvalResult] = useState(null)
  const [evalLoading, setEvalLoading] = useState(false)
  const [error, setError] = useState('')
  const chatEndRef = useRef(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [hints, evalResult, error])

  // Reset when problem changes
  useEffect(() => {
    setHints([])
    setEvalResult(null)
    setError('')
  }, [problem?.name])

  // ── Request a progressive hint ────────────────────────────────────────────
  async function requestHint() {
    if (hints.length >= 3) return
    setHintLoading(true)
    setError('')
    try {
      const res = await getAIHint({
        problemName: problem.name,
        difficulty: problem.difficulty,
        category: problem.category,
        hintNumber: hints.length + 1,
        userCode: code || undefined,
        language: language || 'Python',
      })
      setHints(prev => [...prev, res.hint])
    } catch (err) {
      setError(err.message)
    } finally {
      setHintLoading(false)
    }
  }

  // ── Submit code for AI evaluation ─────────────────────────────────────────
  async function submitForEval() {
    if (!code || !code.trim()) {
      setError('Write or paste your code in the editor first ←')
      return
    }
    setEvalLoading(true)
    setError('')
    try {
      const res = await evaluateCode({
        problemName: problem.name,
        difficulty: problem.difficulty,
        category: problem.category,
        code: code.trim(),
        hintsTaken: hints.length,
        language: language || 'Python',
      })
      setEvalResult(res)
      if (onEvalResult) {
        onEvalResult({
          type: res.type,
          score: res.score,
          hints: hints.length,
          explanation: res.explanation,
          timeComplexity: res.timeComplexity,
          spaceComplexity: res.spaceComplexity,
          improvements: res.improvements,
        })
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setEvalLoading(false)
    }
  }

  const scoreColors = ['#ef4444', '#f97316', '#eab308', '#10b981']
  const scoreLabels = ['Failed', 'Shaky', 'Good', 'Perfect']

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      background: 'var(--bg-2)',
      borderRadius: '0 var(--radius-xl) var(--radius-xl) 0',
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 16px', borderBottom: '1px solid var(--border)',
        background: 'linear-gradient(135deg, rgba(124,111,247,0.08), transparent)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>🤖</span>
          <div>
            <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>AI Assistant</h3>
            <p style={{ margin: 0, fontSize: 10, color: 'var(--text-3)' }}>Reads from your code editor</p>
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '12px 14px',
        display: 'flex', flexDirection: 'column', gap: 10,
      }}>
        {/* Welcome */}
        <div style={{
          padding: '10px 12px', borderRadius: 10,
          background: 'rgba(124,111,247,0.06)',
          border: '1px solid rgba(124,111,247,0.12)',
          fontSize: 11, color: 'var(--text-2)', lineHeight: 1.6,
        }}>
          <strong style={{ color: 'var(--accent-2)' }}>👋 Hey!</strong> Working on{' '}
          <strong style={{ color: 'var(--text)' }}>{problem.name}</strong>.
          <br /><br />
          • <strong>Stuck?</strong> Hit "Get Hint" — up to 3 progressive clues.<br />
          • <strong>Done?</strong> Save your code in the editor, then hit "Evaluate".
          <br />
          <span style={{ color: 'var(--text-3)', fontSize: 10 }}>
            Each hint reduces max score: 0→3, 1→2, 2→1, 3→0
          </span>
        </div>

        {/* Code status indicator */}
        <div style={{
          padding: '6px 10px', borderRadius: 7,
          background: code?.trim() ? 'rgba(34,197,94,0.06)' : 'rgba(245,158,11,0.06)',
          border: `1px solid ${code?.trim() ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.15)'}`,
          fontSize: 10, color: code?.trim() ? '#22c55e' : '#f59e0b',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <span style={{ fontSize: 12 }}>{code?.trim() ? '✅' : '⏳'}</span>
          {code?.trim()
            ? `${language || 'Code'} · ${code.trim().split('\n').length} lines in editor`
            : 'Waiting for code in editor…'
          }
        </div>

        {/* Hint messages */}
        {hints.map((h, i) => (
          <div key={i} style={{
            padding: '10px 12px', borderRadius: 10,
            background: 'var(--surface)',
            borderLeft: `3px solid ${i === 0 ? '#6366f1' : i === 1 ? '#a78bfa' : '#f97316'}`,
            fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5,
            animation: 'fadeUp 0.3s ease forwards',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
              <span style={{
                fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 4,
                background: i === 0 ? 'rgba(99,102,241,0.15)' : i === 1 ? 'rgba(167,139,250,0.15)' : 'rgba(249,115,22,0.15)',
                color: i === 0 ? '#6366f1' : i === 1 ? '#a78bfa' : '#f97316',
              }}>
                HINT {i + 1}/3
              </span>
              <span style={{ fontSize: 9, color: 'var(--text-3)' }}>
                {i === 0 ? '🟢 Conceptual' : i === 1 ? '🟡 Specific' : '🟠 Detailed'}
              </span>
            </div>
            {h}
          </div>
        ))}

        {/* Evaluation result */}
        {evalResult && (
          <div style={{
            padding: '12px', borderRadius: 12,
            background: 'var(--surface)',
            border: `1px solid ${scoreColors[evalResult.score]}30`,
            animation: 'fadeUp 0.3s ease forwards',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <span style={{ fontSize: 14 }}>📊</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>AI Evaluation</span>
            </div>

            <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
              <span style={{
                padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                background: `${scoreColors[evalResult.score]}18`,
                color: scoreColors[evalResult.score],
                border: `1px solid ${scoreColors[evalResult.score]}30`,
              }}>
                {evalResult.score}/3 — {scoreLabels[evalResult.score]}
              </span>
              <span style={{
                padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 600,
                background: evalResult.type === 'optimal' ? 'rgba(99,102,241,0.12)' : 'rgba(167,139,250,0.12)',
                color: evalResult.type === 'optimal' ? '#6366f1' : '#a78bfa',
                border: `1px solid ${evalResult.type === 'optimal' ? 'rgba(99,102,241,0.3)' : 'rgba(167,139,250,0.3)'}`,
              }}>
                {evalResult.type === 'optimal' ? '⚡ Optimal' : '🔧 Brute Force'}
              </span>
            </div>

            <div style={{ display: 'flex', gap: 14, marginBottom: 8, fontSize: 10 }}>
              <div>
                <span style={{ color: 'var(--text-3)' }}>Time: </span>
                <span style={{ color: 'var(--text)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                  {evalResult.timeComplexity}
                </span>
              </div>
              <div>
                <span style={{ color: 'var(--text-3)' }}>Space: </span>
                <span style={{ color: 'var(--text)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                  {evalResult.spaceComplexity}
                </span>
              </div>
            </div>

            <p style={{ margin: '0 0 6px', fontSize: 11, color: 'var(--text-2)', lineHeight: 1.5 }}>
              {evalResult.explanation}
            </p>
            {evalResult.improvements && (
              <p style={{
                margin: 0, fontSize: 10, color: '#eab308', lineHeight: 1.4,
                padding: '5px 8px', borderRadius: 6,
                background: 'rgba(234,179,8,0.06)', border: '1px solid rgba(234,179,8,0.15)',
              }}>
                💡 {evalResult.improvements}
              </p>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            padding: '7px 10px', borderRadius: 8,
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
            fontSize: 11, color: '#ef4444',
          }}>
            ⚠️ {error}
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Bottom actions — no textarea, just buttons */}
      <div style={{
        padding: '10px 14px', borderTop: '1px solid var(--border)',
        background: 'var(--bg-3)', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={requestHint}
            disabled={hintLoading || hints.length >= 3}
            style={{ flex: 1, fontSize: 11 }}
          >
            {hintLoading ? '⟳ …' : hints.length >= 3 ? '3/3 Used' : `💡 Hint ${hints.length + 1}/3`}
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={submitForEval}
            disabled={evalLoading || !code?.trim()}
            style={{ flex: 1.2, fontSize: 11 }}
          >
            {evalLoading ? '⟳ Evaluating…' : '🔍 Evaluate Code'}
          </button>
        </div>

        {hints.length > 0 && (
          <div style={{
            marginTop: 6, padding: '3px 8px', borderRadius: 5,
            background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.12)',
            fontSize: 9, color: '#f59e0b', textAlign: 'center',
          }}>
            {hints.length} hint{hints.length > 1 ? 's' : ''} → max score: {Math.max(0, 3 - hints.length)}
          </div>
        )}
      </div>
    </div>
  )
}
