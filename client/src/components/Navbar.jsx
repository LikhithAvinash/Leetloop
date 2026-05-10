import { Link, useLocation } from 'react-router-dom'
import { useAppData } from '../context/AppDataContext'

export default function Navbar({ user, onLogout }) {
  const loc = useLocation()
  const { loading, lastFetched, score } = useAppData()

  const linkStyle = (path) => ({
    padding: '7px 14px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 500,
    textDecoration: 'none',
    transition: 'all 0.18s ease',
    color: loc.pathname === path ? 'var(--accent)' : 'var(--text-2)',
    background: loc.pathname === path ? 'var(--accent-glow)' : 'transparent',
    border: `1px solid ${loc.pathname === path ? 'var(--accent)' : 'transparent'}`,
  })

  const scoreColor = score >= 0 ? '#22c55e' : '#ef4444'
  const scoreBg = score >= 0 ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)'
  const scoreBorder = score >= 0 ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'

  return (
    <nav style={{
      background: 'var(--surface)',
      borderBottom: '1px solid var(--border)',
      position: 'sticky', top: 0, zIndex: 40,
      backdropFilter: 'blur(12px)',
    }}>
      <div style={{
        maxWidth: 1280, margin: '0 auto', padding: '0 24px',
        height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        {/* Logo */}
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{
            width: 30, height: 30,
            background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
            borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 15, fontWeight: 900, color: 'white',
          }}>L</div>
          <span className="gradient-text" style={{ fontSize: 16, fontWeight: 800 }}>LeetTrack</span>
          <span style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 500 }}>SRS</span>
          {/* Live sync dot */}
          <span
            title={loading ? 'Syncing…' : lastFetched ? `Last synced ${new Date(lastFetched).toLocaleTimeString()}` : ''}
            style={{
              width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
              background: loading ? '#f59e0b' : '#22c55e',
              boxShadow: loading ? '0 0 0 2px rgba(245,158,11,0.3)' : '0 0 0 2px rgba(34,197,94,0.25)',
              animation: loading ? 'pulse 1s ease-in-out infinite' : 'none',
              transition: 'background 0.4s ease, box-shadow 0.4s ease',
              marginLeft: 2,
            }}
          />
        </Link>

        {/* Right */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Link to="/" style={linkStyle('/')}>Dashboard</Link>
          <Link to="/problems" style={linkStyle('/problems')}>Problems</Link>
          <Link to="/series" style={linkStyle('/series')}>Series</Link>

          <Link to="/settings" style={{
            ...linkStyle('/settings'),
            width: 34, height: 34, padding: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16,
          }} title="Settings">⚙️</Link>

          {/* Score Badge */}
          <div
            title={`Score: ${score}`}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: scoreBg,
              border: `1px solid ${scoreBorder}`,
              borderRadius: 8, padding: '5px 10px',
              cursor: 'default',
              transition: 'all 0.3s ease',
            }}
          >
            <span style={{ fontSize: 14 }}>⚡</span>
            <span style={{
              fontSize: 14, fontWeight: 800, color: scoreColor,
              minWidth: 16, textAlign: 'center',
              fontVariantNumeric: 'tabular-nums',
            }}>
              {score}
            </span>
          </div>

          <div style={{ width: 1, height: 18, background: 'var(--border)', margin: '0 6px' }} />

          {/* User */}
          {user && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'var(--surface-2)', border: '1px solid var(--border)',
              borderRadius: 9, padding: '5px 10px',
            }}>
              <div style={{
                width: 24, height: 24, borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 800, color: 'white', flexShrink: 0,
              }}>
                {(user.firstName || user.username || '?')[0].toUpperCase()}
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.firstName || user.username}
              </span>
            </div>
          )}

          {/* Logout */}
          <button
            id="logout-btn"
            onClick={onLogout}
            className="btn btn-ghost btn-sm"
            style={{ color: 'var(--danger)', borderColor: 'rgba(239,68,68,0.25)' }}
          >
            Sign Out
          </button>
        </div>
      </div>
    </nav>
  )
}
