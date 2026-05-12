import React, { useState } from 'react'
import DayShift from './components/DayShift'
import NightShift from './components/NightShift'

export default function App() {
  const [shift, setShift] = useState(null) // null = not selected yet

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Header */}
      <div style={{
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border)',
        padding: '0 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 64,
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: 'var(--accent-yellow)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18,
          }}>🏭</div>
          <div>
            <div style={{ fontFamily: 'Barlow Condensed', fontSize: 20, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text-primary)', lineHeight: 1 }}>
              Dock Master
            </div>
            <div style={{ fontFamily: 'Share Tech Mono', fontSize: 10, color: 'var(--text-muted)', letterSpacing: 1 }}>
              IB FREIGHT PLANNER
            </div>
          </div>
        </div>

        {shift && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              fontFamily: 'Barlow Condensed', fontSize: 12, letterSpacing: 2, textTransform: 'uppercase',
              color: shift === 'day' ? 'var(--accent-yellow)' : 'var(--accent-purple)',
              background: shift === 'day' ? '#f5c51822' : '#8b5cf622',
              border: `1px solid ${shift === 'day' ? '#f5c51844' : '#8b5cf644'}`,
              borderRadius: 4, padding: '4px 10px',
            }}>
              {shift === 'day' ? '☀ Day Shift · 05:00–16:45' : '🌙 Night Shift · 16:45–05:00'}
            </div>
            <button
              onClick={() => setShift(null)}
              style={{
                background: 'var(--bg-elevated)', border: '1px solid var(--border-bright)',
                color: 'var(--text-secondary)', fontFamily: 'Barlow Condensed', fontSize: 12,
                letterSpacing: 1, textTransform: 'uppercase', padding: '5px 12px',
                borderRadius: 4, cursor: 'pointer',
              }}
            >
              Switch Shift
            </button>
          </div>
        )}
      </div>

      {/* Shift Selector */}
      {!shift && (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          minHeight: 'calc(100vh - 64px)', padding: 40,
        }}>
          <div style={{ fontFamily: 'Barlow Condensed', fontSize: 13, letterSpacing: 4, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 12 }}>
            Select Your Shift
          </div>
          <div style={{ fontFamily: 'Barlow Condensed', fontSize: 36, fontWeight: 900, letterSpacing: 2, color: 'var(--text-primary)', marginBottom: 48, textTransform: 'uppercase' }}>
            Which shift are you planning?
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, maxWidth: 700, width: '100%' }}>
            {/* Day */}
            <button
              onClick={() => setShift('day')}
              style={{
                background: 'var(--bg-card)', border: '2px solid var(--border)',
                borderRadius: 16, padding: '40px 32px', cursor: 'pointer',
                textAlign: 'left', transition: 'all 0.2s', color: 'inherit',
              }}
              onMouseEnter={e => { e.currentTarget.style.border = '2px solid var(--accent-yellow)'; e.currentTarget.style.background = '#f5c51808' }}
              onMouseLeave={e => { e.currentTarget.style.border = '2px solid var(--border)'; e.currentTarget.style.background = 'var(--bg-card)' }}
            >
              <div style={{ fontSize: 48, marginBottom: 16 }}>☀️</div>
              <div style={{ fontFamily: 'Barlow Condensed', fontSize: 28, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--accent-yellow)', marginBottom: 8 }}>
                Day Shift
              </div>
              <div style={{ fontFamily: 'Share Tech Mono', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
                05:00 AM – 04:45 PM
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                Upload one file. Analyzes arrivals scheduled 05:00–16:45 for the target day.
              </div>
            </button>

            {/* Night */}
            <button
              onClick={() => setShift('night')}
              style={{
                background: 'var(--bg-card)', border: '2px solid var(--border)',
                borderRadius: 16, padding: '40px 32px', cursor: 'pointer',
                textAlign: 'left', transition: 'all 0.2s', color: 'inherit',
              }}
              onMouseEnter={e => { e.currentTarget.style.border = '2px solid var(--accent-purple)'; e.currentTarget.style.background = '#8b5cf608' }}
              onMouseLeave={e => { e.currentTarget.style.border = '2px solid var(--border)'; e.currentTarget.style.background = 'var(--bg-card)' }}
            >
              <div style={{ fontSize: 48, marginBottom: 16 }}>🌙</div>
              <div style={{ fontFamily: 'Barlow Condensed', fontSize: 28, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--accent-purple)', marginBottom: 8 }}>
                Night Shift
              </div>
              <div style={{ fontFamily: 'Share Tech Mono', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
                04:45 PM – 05:00 AM
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                Upload two files. First half (16:45–23:59) + Second half (00:00–05:00). Shows each half and combined total.
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      {shift && (
        <div style={{ padding: '32px', maxWidth: 1400, margin: '0 auto' }}>
          {shift === 'day' ? <DayShift /> : <NightShift />}
        </div>
      )}
    </div>
  )
}
