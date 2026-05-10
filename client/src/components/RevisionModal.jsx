import { useState } from 'react'
import { submitAttempt } from '../api'
import ScoreBadge from './ScoreBadge'
import AIBot from './AIBot'

// ─── Hint option definitions per approach type ────────────────────────────────
const OPTIMAL_HINT_OPTIONS = [
  { value: 0,  label: 'No hints',     color: '#10b981' },
  { value: 1,  label: '1 hint',       color: '#eab308' },
  { value: 2,  label: '2 hints',      color: '#f97316' },
  { value: 3,  label: '3+ / Failed',  color: '#ef4444' },
  { value: -1, label: "Didn't solve", color: '#94a3b8' },
]

const BRUTE_HINT_OPTIONS = [
  { value: 0,  label: 'No hints',     color: '#10b981' },
  { value: 1,  label: '1 hint',       color: '#eab308' },
  { value: 2,  label: '2+ / Failed',  color: '#ef4444' },
  { value: -1, label: "Didn't solve", color: '#94a3b8' },
]

const SCORE_DESC = {
  3: 'Perfect recall — no hints needed',
  2: 'Good — minor help required',
  1: 'Shaky — needed significant help',
  0: 'Failed — too many hints or unsolved',
}

// ─── Per-solution score helpers ───────────────────────────────────────────────
function computeOptimalScore(hints) {
  if (hints < 0)  return -1
  if (hints >= 3) return 0
  if (hints === 2) return 1
  if (hints === 1) return 2
  return 3
}

function computeBruteScore(hints) {
  if (hints < 0)  return -1
  if (hints >= 2) return 0
  if (hints === 1) return 1
  return 2
}

function scoreForSolution(sol) {
  return sol.type === 'brute' ? computeBruteScore(sol.hints) : computeOptimalScore(sol.hints)
}

function previewFinalScore(solutions) {
  if (!solutions || solutions.length === 0) return null
  const scores = solutions.map(scoreForSolution)
  const sum    = scores.reduce((a, b) => a + b, 0)
  return Math.max(0, Math.min(3, Math.floor(sum / solutions.length)))
}

function scoreColor(score) {
  if (score >= 3) return '#10b981'
  if (score >= 2) return '#eab308'
  if (score >= 1) return '#f97316'
  return '#ef4444'
}

// ─── Type config for styling ──────────────────────────────────────────────────
const TYPE_CONFIG = {
  optimal: {
    label: '⚡ Optimal',
    color: '#6366f1',
    bg: 'rgba(99,102,241,0.10)',
    border: 'rgba(99,102,241,0.30)',
    maxLabel: 'Max 3 pts',
    hintOptions: OPTIMAL_HINT_OPTIONS,
  },
  brute: {
    label: '🔧 Brute Force',
    color: '#a78bfa',
    bg: 'rgba(167,139,250,0.10)',
    border: 'rgba(167,139,250,0.30)',
    maxLabel: 'Max 2 pts',
    hintOptions: BRUTE_HINT_OPTIONS,
  },
}

// ─── Single solution card ─────────────────────────────────────────────────────
function SolutionCard({ solution, index, total, onChange, onRemove, aiLocked }) {
  const cfg = TYPE_CONFIG[solution.type]
  const indivScore = scoreForSolution(solution)

  return (
    <div style={{
      background: 'rgba(17,24,39,0.55)',
      border: `1px solid ${cfg.border}`,
      borderRadius: 12, padding: '12px 14px', marginBottom: 10,
      transition: 'border-color 0.2s',
      opacity: aiLocked ? 0.75 : 1,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        <span style={{
          background: cfg.bg, color: cfg.color,
          border: `1px solid ${cfg.border}`, borderRadius: 5,
          padding: '1px 7px', fontSize: 10, fontWeight: 700, flexShrink: 0,
        }}>#{index + 1}</span>

        {/* Type toggle */}
        <div style={{
          display: 'flex', background: 'rgba(26,34,52,0.7)',
          borderRadius: 6, padding: 2, flex: 1,
        }}>
          {['optimal', 'brute'].map(t => {
            const tc = TYPE_CONFIG[t]
            const active = solution.type === t
            return (
              <button key={t}
                onClick={() => !aiLocked && onChange({ ...solution, type: t, hints: 0 })}
                disabled={aiLocked}
                style={{
                  flex: 1, padding: '4px 8px', borderRadius: 4, border: 'none',
                  background: active ? tc.color : 'transparent',
                  color: active ? '#fff' : '#4a5d7a',
                  cursor: aiLocked ? 'not-allowed' : 'pointer',
                  fontSize: 10, fontWeight: 700, fontFamily: 'Inter, sans-serif',
                  transition: 'all 0.15s',
                }}
              >{tc.label}</button>
            )
          })}
        </div>

        <span style={{
          fontSize: 11, fontWeight: 700, flexShrink: 0,
          color: indivScore < 0 ? '#94a3b8' : scoreColor(indivScore),
        }}>
          {indivScore < 0 ? '–' : `${indivScore}pt`}
        </span>

        {total > 1 && !aiLocked && (
          <button onClick={onRemove} style={{
            flexShrink: 0, background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.25)', color: '#f87171',
            borderRadius: 5, width: 22, height: 22, cursor: 'pointer', fontSize: 13,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>×</button>
        )}
      </div>

      {aiLocked && (
        <div style={{
          marginBottom: 6, padding: '3px 8px', borderRadius: 5,
          background: 'rgba(124,111,247,0.08)', border: '1px solid rgba(124,111,247,0.12)',
          fontSize: 9, color: 'var(--accent-2)',
        }}>
          🤖 AI-evaluated — auto-filled
        </div>
      )}

      {/* Hints selector */}
      <div>
        <span style={{ fontSize: 10, color: '#64748b', display: 'block', marginBottom: 5 }}>
          {cfg.maxLabel} — Hints:
        </span>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {cfg.hintOptions.map(opt => (
            <button key={opt.value}
              onClick={() => !aiLocked && onChange({ ...solution, hints: opt.value })}
              disabled={aiLocked}
              style={{
                padding: '3px 9px', borderRadius: 6,
                border: `1px solid ${solution.hints === opt.value ? opt.color : '#2a3d5a'}`,
                background: solution.hints === opt.value ? `${opt.color}22` : 'rgba(26,34,52,0.5)',
                color: solution.hints === opt.value ? opt.color : '#64748b',
                cursor: aiLocked ? 'not-allowed' : 'pointer',
                fontSize: 10, fontFamily: 'Inter, sans-serif',
                fontWeight: solution.hints === opt.value ? 700 : 500,
                transition: 'all 0.12s ease',
              }}
            >{opt.label}</button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Language config ──────────────────────────────────────────────────────────
const LANGUAGES = [
  { id: 'python',     label: 'Python',      icon: '🐍', placeholder: '# Write your Python solution here\n\ndef solution():\n    pass\n' },
  { id: 'java',       label: 'Java',        icon: '☕', placeholder: '// Write your Java solution here\n\npublic class Solution {\n    public int solve() {\n        return 0;\n    }\n}\n' },
  { id: 'cpp',        label: 'C++',         icon: '⚙️', placeholder: '// Write your C++ solution here\n\nclass Solution {\npublic:\n    int solve() {\n        return 0;\n    }\n};\n' },
  { id: 'javascript', label: 'JavaScript',  icon: '⚡', placeholder: '// Write your JavaScript solution here\n\nconst solution = () => {\n\n};\n' },
  { id: 'pseudo',     label: 'Pseudo',      icon: '📋', placeholder: 'Write pseudo-code or your approach here...\n\nFunction solve(input):\n    // describe your logic step by step\n    return result\n' },
]

// ─── Main modal — 3 panel layout ──────────────────────────────────────────────
export default function RevisionModal({ problem, onClose, onSuccess }) {
  const [solutions, setSolutions] = useState([{ type: 'optimal', hints: 0, code: '' }])
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult]       = useState(null)
  const [error, setError]         = useState('')
  const [aiLocked, setAiLocked]   = useState(false)

  // ── LANGUAGE ─────────────────────────────────────────────────────────────────
  const [langId, setLangId] = useState('python')
  const lang = LANGUAGES.find(l => l.id === langId) || LANGUAGES[0]

  // ── SHARED CODE STATE — lives here, passed to center editor AND to AIBot ──
  const [sharedCode, setSharedCode] = useState('')
  const [codeSaved, setCodeSaved]   = useState(false)

  function handleCodeChange(val) {
    setSharedCode(val)
    setCodeSaved(false)
  }

  function handleSaveCode() {
    setCodeSaved(true)
  }

  function addSolution() {
    setSolutions(prev => [...prev, { type: 'brute', hints: 0, code: '' }])
  }

  function updateSolution(index, updated) {
    setSolutions(prev => prev.map((s, i) => i === index ? updated : s))
  }

  function removeSolution(index) {
    setSolutions(prev => prev.filter((_, i) => i !== index))
  }

  // ── AI evaluation callback — auto-fills the first solution card ────────────
  function handleAIEvalResult(evalData) {
    setSolutions([{
      type: evalData.type,
      hints: evalData.hints,
      code: sharedCode,
    }])
    setAiLocked(true)
  }

  function resetAILock() { setAiLocked(false) }

  const preview = previewFinalScore(solutions)
  const perScores = solutions.map(scoreForSolution)

  async function handleSubmit() {
    if (solutions.length === 0) { setError('Add at least one solution'); return }
    setError('')
    setSubmitting(true)
    try {
      const res = await submitAttempt({
        user_problem_id: problem.user_problem_id,
        solutions: solutions.map(s => ({
          type: s.type,
          hints: s.hints,
          code: sharedCode || s.code,
        })),
      })
      setResult(res)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  function handleClose() {
    if (result) onSuccess && onSuccess()
    onClose()
  }

  const diffColor = problem.difficulty === 'Easy' ? '#10b981' :
                    problem.difficulty === 'Hard' ? '#ef4444' : '#eab308'

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && handleClose()}>
      <div className="modal-box" style={{
        padding: 0, maxWidth: 1200, width: '96vw',
        display: 'flex', flexDirection: 'row',
        maxHeight: '90vh', overflow: 'hidden',
      }}>

        {/* ═══════════════════════════════════════════════════════════════════
            LEFT PANEL — Revision Form
            ═══════════════════════════════════════════════════════════════════ */}
        <div style={{
          flex: '0 0 300px', minWidth: 0,
          display: 'flex', flexDirection: 'column',
          borderRight: '1px solid var(--border)',
        }}>
          {/* Header */}
          <div style={{
            padding: '14px 16px', flexShrink: 0,
            borderBottom: '1px solid #1e2d45',
            background: 'linear-gradient(135deg, rgba(99,102,241,0.08), transparent)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#f1f5f9' }}>
                  Submit Revision
                </h2>
                <p style={{ margin: '3px 0 0', fontSize: 12, color: '#94a3b8' }}>
                  {problem.name} · <span style={{ color: diffColor }}>{problem.difficulty}</span>
                </p>
              </div>
              <button onClick={handleClose} style={{
                background: 'rgba(42,61,90,0.5)', border: '1px solid #2a3d5a',
                color: '#94a3b8', borderRadius: 7, width: 26, height: 26,
                cursor: 'pointer', fontSize: 15,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>×</button>
            </div>
          </div>

          {/* Scrollable body */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px' }}>
            {!result ? (
              <>
                {aiLocked && (
                  <div style={{
                    marginBottom: 10, padding: '6px 12px', borderRadius: 8,
                    background: 'rgba(124,111,247,0.06)', border: '1px solid rgba(124,111,247,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}>
                    <span style={{ fontSize: 10, color: 'var(--accent-2)' }}>🤖 AI auto-filled</span>
                    <button onClick={resetAILock} style={{
                      background: 'transparent', border: '1px solid var(--border)',
                      color: 'var(--text-3)', borderRadius: 5, padding: '1px 8px',
                      fontSize: 9, cursor: 'pointer', fontWeight: 600,
                    }}>Override</button>
                  </div>
                )}

                {solutions.map((sol, idx) => (
                  <SolutionCard key={idx} solution={sol} index={idx}
                    total={solutions.length}
                    onChange={updated => updateSolution(idx, updated)}
                    onRemove={() => removeSolution(idx)}
                    aiLocked={aiLocked}
                  />
                ))}

                {!aiLocked && (
                  <button onClick={addSolution} style={{
                    width: '100%', padding: '7px 0', borderRadius: 8, marginBottom: 12,
                    border: '1.5px dashed #2a3d5a', background: 'rgba(99,102,241,0.04)',
                    color: '#6366f1', cursor: 'pointer', fontSize: 11, fontWeight: 600,
                    fontFamily: 'Inter, sans-serif', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', gap: 5,
                  }}>＋ Add Solution</button>
                )}

                {/* Score preview */}
                {solutions.length > 0 && (
                  <div style={{
                    padding: '8px 12px', borderRadius: 9, marginBottom: 12,
                    background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <span style={{ fontSize: 11, color: '#64748b' }}>Score:</span>
                      <ScoreBadge score={preview} showLabel />
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {solutions.map((s, i) => {
                        const sc = perScores[i]
                        const cfg = TYPE_CONFIG[s.type]
                        return (
                          <span key={i} style={{
                            fontSize: 10, borderRadius: 4, padding: '1px 6px',
                            background: cfg.bg, color: cfg.color,
                            border: `1px solid ${cfg.border}`, fontWeight: 600,
                          }}>
                            #{i + 1} {s.type === 'optimal' ? '⚡' : '🔧'} {sc < 0 ? '–' : sc}pt
                          </span>
                        )
                      })}
                    </div>
                    <div style={{ fontSize: 10, color: '#4a5d7a', fontFamily: 'monospace', marginTop: 4 }}>
                      ⌊({perScores.join('+')})/{solutions.length}⌋ = {preview}
                    </div>
                  </div>
                )}

                {error && <p style={{ color: '#ef4444', fontSize: 11, marginBottom: 10 }}>⚠ {error}</p>}

                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-secondary btn-sm" onClick={handleClose} style={{ flex: 1 }}>
                    Cancel
                  </button>
                  <button id="submit-revision-btn" className="btn btn-primary btn-sm"
                    disabled={submitting || solutions.length === 0}
                    onClick={handleSubmit} style={{ flex: 1.5 }}
                  >
                    {submitting ? '⟳ …' : '⟳ Submit'}
                  </button>
                </div>
              </>
            ) : (
              /* ── Result view ── */
              <div className="animate-fade-in">
                <div style={{ textAlign: 'center', padding: '16px 0 12px', borderBottom: '1px solid #1e2d45', marginBottom: 14 }}>
                  {result.ejected ? (
                    <div>
                      <div style={{ fontSize: 36, marginBottom: 6 }}>⬅</div>
                      <h3 style={{ margin: 0, color: '#ef4444', fontSize: 16, fontWeight: 700 }}>Ejected to Bracket 1</h3>
                      <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: 11 }}>2 consecutive zeros — reset.</p>
                    </div>
                  ) : (
                    <div>
                      <div style={{ marginBottom: 6 }}>
                        <ScoreBadge score={result.score} size="lg" showLabel />
                      </div>
                      <h3 style={{ margin: '6px 0 3px', color: '#f1f5f9', fontSize: 15, fontWeight: 700 }}>
                        Score: {result.score}/3
                      </h3>
                      <p style={{ margin: 0, color: '#64748b', fontSize: 11 }}>{SCORE_DESC[result.score]}</p>

                      {result.solution_scores && result.solution_scores.length > 0 && (
                        <div style={{
                          display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 8, justifyContent: 'center',
                          background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.18)',
                          borderRadius: 8, padding: '6px 10px',
                        }}>
                          {result.solution_scores.map((sc, i) => {
                            const t = result.solution_types?.[i] || 'optimal'
                            const cfg = TYPE_CONFIG[t]
                            return (
                              <span key={i} style={{ fontSize: 11, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 3 }}>
                                <span style={{
                                  background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
                                  borderRadius: 4, padding: '0px 5px', fontSize: 9, fontWeight: 700,
                                }}>#{i + 1} {t === 'optimal' ? '⚡' : '🔧'}</span>
                                <strong style={{ color: scoreColor(sc) }}>{sc < 0 ? '–' : sc}</strong>
                              </span>
                            )
                          })}
                          <span style={{ fontSize: 10, color: '#4a5d7a' }}>→ {result.score}/3</span>
                        </div>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 14 }}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 10, color: '#4a5d7a', marginBottom: 2 }}>Effective</div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: '#94a3b8' }}>
                            {result.effective_score?.toFixed(2)}
                          </div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 10, color: '#4a5d7a', marginBottom: 2 }}>Next Rev.</div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: '#6366f1' }}>
                            {result.next_revision_date} ({result.interval_days}d)
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <button className="btn btn-primary btn-sm" onClick={handleClose} style={{ width: '100%' }}>
                  Done ✓
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            CENTER PANEL — Syntax-highlighted Code Editor
            ═══════════════════════════════════════════════════════════════════ */}
        <div style={{
          flex: '1 1 auto', minWidth: 0,
          display: 'flex', flexDirection: 'column',
          borderRight: '1px solid var(--border)',
          background: '#0d1117',
        }}>
          {/* Editor toolbar */}
          <div style={{
            padding: '8px 14px', flexShrink: 0,
            borderBottom: '1px solid #1e2d45',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: '#161b22',
          }}>
            {/* Language selector tabs */}
            <div style={{ display: 'flex', gap: 4 }}>
              {LANGUAGES.map(l => (
                <button
                  key={l.id}
                  onClick={() => setLangId(l.id)}
                  style={{
                    padding: '3px 10px', borderRadius: 6, fontSize: 10, fontWeight: 700,
                    border: langId === l.id ? '1px solid #6366f1' : '1px solid #2a3d5a',
                    background: langId === l.id ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.03)',
                    color: langId === l.id ? '#818cf8' : '#4a5d7a',
                    cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'Inter, sans-serif',
                  }}
                >
                  {l.icon} {l.label}
                </button>
              ))}
            </div>

            {/* Right side: line count + save */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {sharedCode.trim() && (
                <span style={{ fontSize: 9, color: '#4a5d7a', fontFamily: 'monospace' }}>
                  {sharedCode.split('\n').length} lines
                </span>
              )}
              <button
                onClick={handleSaveCode}
                disabled={!sharedCode.trim()}
                style={{
                  padding: '3px 12px', fontSize: 10, fontWeight: 700,
                  background: codeSaved ? 'rgba(34,197,94,0.12)' : 'rgba(99,102,241,0.15)',
                  border: `1px solid ${codeSaved ? 'rgba(34,197,94,0.3)' : 'rgba(99,102,241,0.3)'}`,
                  color: codeSaved ? '#22c55e' : '#818cf8',
                  borderRadius: 6, cursor: sharedCode.trim() ? 'pointer' : 'not-allowed',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                {codeSaved ? '✓ Saved' : '💾 Save'}
              </button>
              <span style={{ fontSize: 9, color: '#3a4d6a' }}>Ctrl+S</span>
            </div>
          </div>

          {/* Code editor */}
          <div style={{ flex: 1, position: 'relative' }}>
            <textarea
              value={sharedCode}
              onChange={e => handleCodeChange(e.target.value)}
              placeholder={lang.placeholder}
              spellCheck={false}
              style={{
                width: '100%', height: '100%', resize: 'none',
                background: 'transparent', border: 'none',
                padding: '14px 16px',
                color: '#c9d1d9', fontSize: 13,
                fontFamily: "'Fira Code', 'JetBrains Mono', 'Cascadia Code', 'Consolas', monospace",
                lineHeight: 1.7, outline: 'none',
                tabSize: 2,
              }}
              onKeyDown={e => {
                if (e.key === 'Tab') {
                  e.preventDefault()
                  const start = e.target.selectionStart
                  const end = e.target.selectionEnd
                  const val = sharedCode
                  setSharedCode(val.substring(0, start) + '  ' + val.substring(end))
                  setTimeout(() => {
                    e.target.selectionStart = e.target.selectionEnd = start + 2
                  }, 0)
                }
                if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                  e.preventDefault()
                  handleSaveCode()
                }
              }}
            />
            {!sharedCode && (
              <div style={{
                position: 'absolute', top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center', pointerEvents: 'none', zIndex: 1,
              }}>
                <div style={{ fontSize: 32, marginBottom: 8, opacity: 0.2 }}>⌨️</div>
                <div style={{ fontSize: 11, color: '#3a4d6a' }}>
                  {lang.icon} {lang.label} editor ready
                </div>
                <div style={{ fontSize: 9, color: '#2a3a55', marginTop: 4 }}>Ctrl+S to save · Tab for indent</div>
              </div>
            )}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            RIGHT PANEL — AI Assistant
            ═══════════════════════════════════════════════════════════════════ */}
        <div style={{
          flex: '0 0 280px', minWidth: 0,
          display: 'flex', flexDirection: 'column',
          maxHeight: '90vh',
        }}>
          <AIBot
            problem={problem}
            code={sharedCode}
            language={lang.label}
            onEvalResult={handleAIEvalResult}
          />
        </div>

      </div>
    </div>
  )
}
