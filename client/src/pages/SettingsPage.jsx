import { useState, useMemo } from 'react'
import { SERIES } from '../data/seriesData'
import { getSettings, saveSettings, getJoinedSeries, setJoinedSeries, markSetupDone, CATEGORY_ORDER } from '../hooks/useSettings'

export default function SettingsPage({ onDone, isFirstTime }) {
  const currentSettings = getSettings()
  const [settings, setSettings] = useState(currentSettings)
  const [joined, setJoined] = useState(getJoinedSeries)
  const [selectedSeries, setSelectedSeries] = useState(joined?.seriesId || '')
  const [selectedMode, setSelectedMode] = useState(joined?.mode || '150')
  const [editingUnsolvedTopic, setEditingUnsolvedTopic] = useState(false)
  const [editingRevisionTopic, setEditingRevisionTopic] = useState(false)

  // Compute available topics from the selected series
  const availableTopics = useMemo(() => {
    if (!selectedSeries) return []
    const s = SERIES.find(s => s.id === selectedSeries)
    if (!s) return []
    const cats = s.modes ? s.categories[selectedMode || s.defaultMode] : s.categories
    if (!cats) return []
    return Object.keys(cats)
  }, [selectedSeries, selectedMode])

  // Default topic = first topic in selected series
  const defaultTopic = availableTopics.length > 0 ? availableTopics[0] : ''

  function handleSave() {
    saveSettings(settings)
    if (selectedSeries) {
      const s = SERIES.find(s => s.id === selectedSeries)
      setJoinedSeries({
        seriesId: selectedSeries,
        mode: s?.modes ? selectedMode : null,
      })
    }
    markSetupDone()
    onDone()
  }

  const currentSeries = SERIES.find(s => s.id === selectedSeries)

  return (
    <div style={{
      maxWidth: 640, margin: '0 auto', padding: '40px 24px',
      animation: 'fadeUp 0.35s ease forwards',
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>⚙️</div>
        <h1 style={{
          margin: '0 0 8px', fontSize: 28, fontWeight: 900,
          background: 'linear-gradient(135deg, #6366f1, #a78bfa)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
        }}>
          {isFirstTime ? 'Welcome to LeetTrack!' : 'Settings'}
        </h1>
        <p style={{ color: 'var(--text-3)', fontSize: 14, margin: 0, maxWidth: 400, marginInline: 'auto' }}>
          {isFirstTime
            ? 'Set up your daily problem preferences. You can change these anytime from the settings.'
            : 'Adjust your daily problem count and active series. Changes apply immediately.'}
        </p>
      </div>

      {/* Daily problem counts */}
      <div className="card" style={{ padding: 24, marginBottom: 20 }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>
          📊 Daily Problem Count
        </h3>
        <p style={{ color: 'var(--text-3)', fontSize: 13, margin: '0 0 18px' }}>
          Set how many problems you want to practice each day.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {/* Unrevised */}
          <div style={{
            background: 'var(--bg-2)', borderRadius: 10, padding: 18,
            border: '1px solid var(--border)',
          }}>
            <div style={{ fontSize: 13, color: 'var(--text-3)', fontWeight: 600, marginBottom: 8 }}>
              🆕 Unrevised / Day
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button className="btn btn-ghost btn-sm"
                onClick={() => setSettings(s => ({ ...s, unsolvedPerDay: Math.max(1, s.unsolvedPerDay - 1) }))}>
                −
              </button>
              <span style={{ fontSize: 28, fontWeight: 800, color: 'var(--accent)', minWidth: 32, textAlign: 'center' }}>
                {settings.unsolvedPerDay}
              </span>
              <button className="btn btn-ghost btn-sm"
                onClick={() => setSettings(s => ({ ...s, unsolvedPerDay: Math.min(10, s.unsolvedPerDay + 1) }))}>
                +
              </button>
            </div>
          </div>

          {/* Revision */}
          <div style={{
            background: 'var(--bg-2)', borderRadius: 10, padding: 18,
            border: '1px solid var(--border)',
          }}>
            <div style={{ fontSize: 13, color: 'var(--text-3)', fontWeight: 600, marginBottom: 8 }}>
              🔄 Revision / Day
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button className="btn btn-ghost btn-sm"
                onClick={() => setSettings(s => ({ ...s, revisionPerDay: Math.max(1, s.revisionPerDay - 1) }))}>
                −
              </button>
              <span style={{ fontSize: 28, fontWeight: 800, color: '#22c55e', minWidth: 32, textAlign: 'center' }}>
                {settings.revisionPerDay}
              </span>
              <button className="btn btn-ghost btn-sm"
                onClick={() => setSettings(s => ({ ...s, revisionPerDay: Math.min(10, s.revisionPerDay + 1) }))}>
                +
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Topic Selection */}
      <div className="card" style={{ padding: 24, marginBottom: 20 }}>
        <h3 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>
          🎯 Starting Topic
        </h3>
        <p style={{ color: 'var(--text-3)', fontSize: 13, margin: '0 0 18px' }}>
          Choose which topic problems start from. Problems will be scheduled sequentially from this topic downward through all remaining topics.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {/* Unrevised Topic */}
          <div style={{
            background: 'var(--bg-2)', borderRadius: 10, padding: 18,
            border: '1px solid var(--border)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ fontSize: 13, color: 'var(--text-3)', fontWeight: 600 }}>
                🆕 Unrevised Topic
              </div>
              <button className="btn btn-ghost btn-sm" style={{ fontSize: 11, padding: '3px 8px' }}
                onClick={() => setEditingUnsolvedTopic(!editingUnsolvedTopic)}>
                {editingUnsolvedTopic ? '✓ Done' : '✏️ Edit'}
              </button>
            </div>
            {editingUnsolvedTopic ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 200, overflowY: 'auto' }}>
                {availableTopics.map(topic => {
                  const isActive = (settings.unsolvedStartTopic || defaultTopic) === topic
                  return (
                    <button key={topic}
                      onClick={() => setSettings(s => ({ ...s, unsolvedStartTopic: topic }))}
                      style={{
                        padding: '6px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                        border: `1px solid ${isActive ? 'var(--accent)' : 'var(--border)'}`,
                        background: isActive ? 'var(--accent-glow)' : 'transparent',
                        color: isActive ? 'var(--accent)' : 'var(--text-2)',
                        cursor: 'pointer', fontFamily: 'var(--font-sans)',
                        textAlign: 'left', transition: 'all 0.15s',
                      }}
                    >
                      {topic}
                    </button>
                  )
                })}
              </div>
            ) : (
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
                {settings.unsolvedStartTopic || defaultTopic || 'Not set'}
              </div>
            )}
          </div>

          {/* Revision Topic */}
          <div style={{
            background: 'var(--bg-2)', borderRadius: 10, padding: 18,
            border: '1px solid var(--border)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ fontSize: 13, color: 'var(--text-3)', fontWeight: 600 }}>
                🔄 Revision Topic
              </div>
              <button className="btn btn-ghost btn-sm" style={{ fontSize: 11, padding: '3px 8px' }}
                onClick={() => setEditingRevisionTopic(!editingRevisionTopic)}>
                {editingRevisionTopic ? '✓ Done' : '✏️ Edit'}
              </button>
            </div>
            {editingRevisionTopic ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 200, overflowY: 'auto' }}>
                {availableTopics.map(topic => {
                  const isActive = (settings.revisionStartTopic || defaultTopic) === topic
                  return (
                    <button key={topic}
                      onClick={() => setSettings(s => ({ ...s, revisionStartTopic: topic }))}
                      style={{
                        padding: '6px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                        border: `1px solid ${isActive ? '#22c55e' : 'var(--border)'}`,
                        background: isActive ? 'rgba(34,197,94,0.1)' : 'transparent',
                        color: isActive ? '#22c55e' : 'var(--text-2)',
                        cursor: 'pointer', fontFamily: 'var(--font-sans)',
                        textAlign: 'left', transition: 'all 0.15s',
                      }}
                    >
                      {topic}
                    </button>
                  )
                })}
              </div>
            ) : (
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
                {settings.revisionStartTopic || defaultTopic || 'Not set'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Join a Series */}
      <div className="card" style={{ padding: 24, marginBottom: 20 }}>
        <h3 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>
          📚 Join a Series
        </h3>
        <p style={{ color: 'var(--text-3)', fontSize: 13, margin: '0 0 18px' }}>
          Pick a curated series. Every day you'll get unrevised problems in order — starting from the topic you selected above.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {SERIES.map(s => {
            const isSelected = selectedSeries === s.id
            return (
              <button key={s.id}
                onClick={() => setSelectedSeries(s.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '14px 18px', borderRadius: 12,
                  border: `2px solid ${isSelected ? s.color : 'var(--border)'}`,
                  background: isSelected ? `${s.color}12` : 'var(--bg-2)',
                  cursor: 'pointer', fontFamily: 'var(--font-sans)',
                  transition: 'all 0.2s',
                  textAlign: 'left', width: '100%',
                }}
              >
                <span style={{ fontSize: 24 }}>{s.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: isSelected ? s.color : 'var(--text)' }}>
                    {s.name}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{s.description}</div>
                </div>
                {isSelected && (
                  <div style={{ color: s.color, fontSize: 20, fontWeight: 900 }}>✓</div>
                )}
              </button>
            )
          })}
        </div>

        {/* Mode toggle for Neetcode */}
        {currentSeries?.modes && (
          <div style={{ marginTop: 14, display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: 'var(--text-3)', fontWeight: 600 }}>Mode:</span>
            <div style={{ display: 'flex', gap: 4, background: 'var(--bg-2)', borderRadius: 8, padding: 3 }}>
              {currentSeries.modes.map(m => (
                <button key={m.value} onClick={() => setSelectedMode(m.value)}
                  style={{
                    padding: '6px 16px', borderRadius: 6, fontSize: 13, fontWeight: 700,
                    border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)',
                    background: selectedMode === m.value ? currentSeries.color : 'transparent',
                    color: selectedMode === m.value ? '#fff' : 'var(--text-3)',
                    transition: 'all 0.18s',
                  }}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Save button */}
      <button className="btn btn-primary btn-lg" onClick={handleSave}
        style={{ width: '100%', padding: '14px 28px', fontSize: 16 }}>
        {isFirstTime ? '🚀 Get Started' : '💾 Save Settings'}
      </button>
    </div>
  )
}
