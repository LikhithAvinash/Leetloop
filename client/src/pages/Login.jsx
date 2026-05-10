import { useState } from 'react'
import * as api from '../api/index'

export default function Login({ onAuth }) {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '' })
  const [agreed, setAgreed] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const update = (k, v) => { setForm(p => ({ ...p, [k]: v })); setError('') }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (mode === 'register') {
      if (!agreed) { setError('Please agree to the Terms & Conditions.'); return }
      if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return }
    }

    setLoading(true)
    try {
      let result
      if (mode === 'register') {
        const username = `${form.firstName.trim()} ${form.lastName.trim()}`
        result = await api.register({ username, email: form.email.trim().toLowerCase(), password: form.password })
      } else {
        result = await api.login({ email: form.email.trim().toLowerCase(), password: form.password })
      }
      // result = { token, user: { id, username, email } }
      localStorage.setItem('lt_token', result.token)
      onAuth(result.user)
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0d0d0d',
      display: 'flex',
      alignItems: 'stretch',
      fontFamily: 'var(--font-sans)',
    }}>
      {/* Left — image panel (full height) */}
      <div style={{
        flex: '0 0 45%',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '48px 52px',
      }}>
        {/* Background image */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'url(/login_bg.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }} />
        {/* Dark overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to bottom, rgba(8,6,20,0.55) 0%, rgba(8,6,20,0.2) 40%, rgba(8,6,20,0.75) 100%)',
        }} />

        {/* Logo */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            background: 'rgba(255,255,255,0.12)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 12, padding: '8px 16px',
          }}>
            <div style={{
              width: 28, height: 28,
              background: 'linear-gradient(135deg, #7c6ff7, #a78bfa)',
              borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 15, fontWeight: 900, color: 'white',
            }}>L</div>
            <span style={{ color: 'white', fontWeight: 700, fontSize: 15 }}>LeetTrack</span>
          </div>
        </div>

        {/* Bottom text */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h2 style={{
            color: 'white', fontWeight: 800, fontSize: 30, lineHeight: 1.35,
            margin: '0 0 10px', letterSpacing: '-0.3px',
          }}>
            Solve Problems,<br />Revise Problems.
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, margin: '0 0 16px', maxWidth: 320 }}>
            Track your LeetCode journey with spaced repetition, smart revision queues, and curated problem series.
          </p>
        </div>
      </div>

      {/* Right — form panel */}
      <div style={{
        flex: 1,
        background: 'var(--surface)',
        padding: '60px 64px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}>
        <div style={{ maxWidth: 480, width: '100%', margin: '0 auto' }}>
          {/* Header */}
          <div style={{ marginBottom: 32 }}>
            <h1 style={{ fontSize: 30, fontWeight: 800, color: 'var(--text)', margin: '0 0 8px', letterSpacing: '-0.3px' }}>
              {mode === 'login' ? 'Welcome back' : 'Create an account'}
            </h1>
            <p style={{ fontSize: 14, color: 'var(--text-3)', margin: 0 }}>
              {mode === 'login'
                ? <><span>Don't have an account? </span><button onClick={() => { setMode('register'); setError('') }} style={linkBtn}>Sign up</button></>
                : <><span>Already have an account? </span><button onClick={() => { setMode('login'); setError('') }} style={linkBtn}>Log in</button></>
              }
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Register name fields */}
            {mode === 'register' && (
              <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <input id="login-firstname" className="input-field" placeholder="First name"
                  style={{ padding: '13px 16px', fontSize: 15 }}
                  value={form.firstName} onChange={e => update('firstName', e.target.value)} required />
                <input id="login-lastname" className="input-field" placeholder="Last name"
                  style={{ padding: '13px 16px', fontSize: 15 }}
                  value={form.lastName} onChange={e => update('lastName', e.target.value)} required />
              </div>
            )}

            {/* Email */}
            <input id="login-email" className="input-field" type="email"
              placeholder="Email"
              style={{ padding: '13px 16px', fontSize: 15 }}
              value={form.email} onChange={e => update('email', e.target.value)} required />

            {/* Password with show/hide toggle */}
            <div style={{ position: 'relative' }}>
              <input id="login-password" className="input-field"
                type={showPassword ? 'text' : 'password'}
                placeholder={mode === 'register' ? 'Create a password' : 'Your password'}
                style={{ padding: '13px 16px', paddingRight: 46, fontSize: 15, width: '100%', boxSizing: 'border-box' }}
                value={form.password} onChange={e => update('password', e.target.value)} required />
              <button
                type="button"
                onClick={() => setShowPassword(p => !p)}
                title={showPassword ? 'Hide password' : 'Show password'}
                style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', padding: 4, cursor: 'pointer',
                  color: 'var(--text-3)', display: 'flex', alignItems: 'center', lineHeight: 1,
                  transition: 'color 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>

            {/* Agree checkbox (register) */}
            {mode === 'register' && (
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)}
                  style={{ width: 18, height: 18, accentColor: 'var(--accent)', cursor: 'pointer' }} />
                <span style={{ fontSize: 13, color: 'var(--text-3)' }}>
                  I agree to the{' '}
                  <span style={{ color: 'var(--accent)', cursor: 'pointer' }}>Terms &amp; Conditions</span>
                </span>
              </label>
            )}

            {/* Error */}
            {error && (
              <div style={{
                background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                borderRadius: 8, padding: '10px 14px', color: '#ef4444', fontSize: 14,
              }}>
                {error}
              </div>
            )}

            {/* Submit */}
            <button id="login-submit" className="btn btn-primary btn-lg"
              type="submit" disabled={loading}
              style={{ width: '100%', marginTop: 4, padding: '14px 28px', fontSize: 16 }}>
              {loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, margin: '24px 0' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <span style={{ fontSize: 13, color: 'var(--text-3)', whiteSpace: 'nowrap' }}>or continue with</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>

          {/* Social buttons */}
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn btn-secondary" style={{ flex: 1, gap: 8, fontSize: 14, padding: '12px 20px', position: 'relative' }}
              title="Google OAuth requires domain setup — not available for local apps"
              onClick={() => alert('Google Sign In requires OAuth configuration.\nFor a local app, please use email/password.')}>
              <svg width="17" height="17" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const linkBtn = {
  background: 'none', border: 'none', padding: 0,
  color: 'var(--accent)', fontWeight: 600, fontSize: 14,
  cursor: 'pointer', fontFamily: 'var(--font-sans)',
  textDecoration: 'underline',
}
