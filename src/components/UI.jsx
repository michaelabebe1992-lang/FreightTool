import React from 'react'

/* ── Stat Card ───────────────────────────────────────────── */
export function StatCard({ label, value, sub, color = '#e8ecf4', accent }) {
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: `1px solid var(--border)`,
      borderTop: `3px solid ${accent || color}`,
      borderRadius: 8,
      padding: '16px 20px',
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
    }}>
      <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>{label}</span>
      <span style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: 32, fontWeight: 700, color, lineHeight: 1 }}>{value?.toLocaleString()}</span>
      {sub && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{sub}</span>}
    </div>
  )
}

/* ── Split Bar ───────────────────────────────────────────── */
export function SplitBar({ palletCartons, fluidCartons, palletPct, fluidPct }) {
  const total = palletCartons + fluidCartons
  if (total === 0) return null
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12 }}>
        <span style={{ color: 'var(--pallet-color)' }}>▪ PALLET {palletPct}% ({palletCartons.toLocaleString()} ctns)</span>
        <span style={{ color: 'var(--fluid-color)' }}>FLUID {fluidPct}% ({fluidCartons.toLocaleString()} ctns) ▪</span>
      </div>
      <div style={{ height: 10, borderRadius: 5, background: 'var(--bg-elevated)', overflow: 'hidden', display: 'flex' }}>
        <div style={{ width: `${palletPct}%`, background: 'var(--pallet-color)', transition: 'width 0.6s ease' }} />
        <div style={{ width: `${fluidPct}%`, background: 'var(--fluid-color)', transition: 'width 0.6s ease' }} />
      </div>
    </div>
  )
}

/* ── Section Header ──────────────────────────────────────── */
export function SectionHeader({ icon, title, badge }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
      <span style={{ fontSize: 18 }}>{icon}</span>
      <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 18, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--text-primary)' }}>{title}</span>
      {badge && (
        <span style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-bright)', borderRadius: 4, padding: '2px 8px', fontSize: 11, fontFamily: 'Share Tech Mono', color: 'var(--text-secondary)' }}>{badge}</span>
      )}
    </div>
  )
}

/* ── Toggle Switch ───────────────────────────────────────── */
export function Toggle({ label, value, onChange }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', userSelect: 'none' }}>
      <div
        onClick={() => onChange(!value)}
        style={{
          width: 44, height: 24, borderRadius: 12,
          background: value ? 'var(--accent-blue)' : 'var(--bg-elevated)',
          border: `1px solid ${value ? 'var(--accent-blue)' : 'var(--border-bright)'}`,
          position: 'relative', transition: 'all 0.2s', cursor: 'pointer',
        }}
      >
        <div style={{
          width: 18, height: 18, borderRadius: '50%',
          background: '#fff',
          position: 'absolute', top: 2, left: value ? 22 : 2,
          transition: 'left 0.2s',
          boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
        }} />
      </div>
      <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontFamily: 'Barlow Condensed', letterSpacing: 1, textTransform: 'uppercase' }}>{label}</span>
    </label>
  )
}

/* ── File Upload Zone ────────────────────────────────────── */
export function FileUpload({ label, onFile, fileName, accent = 'var(--accent-blue)' }) {
  const inputRef = React.useRef()
  const [drag, setDrag] = React.useState(false)

  const handle = (file) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = e => onFile(e.target.result, file.name)
    reader.readAsText(file)
  }

  return (
    <div
      onClick={() => inputRef.current.click()}
      onDragOver={e => { e.preventDefault(); setDrag(true) }}
      onDragLeave={() => setDrag(false)}
      onDrop={e => { e.preventDefault(); setDrag(false); handle(e.dataTransfer.files[0]) }}
      style={{
        border: `2px dashed ${drag ? accent : (fileName ? accent : 'var(--border-bright)')}`,
        borderRadius: 8,
        padding: '24px 20px',
        textAlign: 'center',
        cursor: 'pointer',
        background: drag ? `${accent}11` : (fileName ? `${accent}08` : 'var(--bg-elevated)'),
        transition: 'all 0.2s',
      }}
    >
      <input ref={inputRef} type="file" accept=".csv,.xlsx,.xls" style={{ display: 'none' }} onChange={e => handle(e.target.files[0])} />
      <div style={{ fontSize: 24, marginBottom: 8 }}>{fileName ? '✅' : '📂'}</div>
      <div style={{ fontFamily: 'Barlow Condensed', fontSize: 13, letterSpacing: 1, textTransform: 'uppercase', color: fileName ? accent : 'var(--text-muted)' }}>
        {fileName || label}
      </div>
      {fileName && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{fileName} — click to replace</div>}
    </div>
  )
}

/* ── Alert Banner ────────────────────────────────────────── */
export function AlertBanner({ items }) {
  if (!items || items.length === 0) return null
  return (
    <div style={{
      background: '#e74c3c18',
      border: '1px solid #e74c3c55',
      borderLeft: '4px solid var(--accent-red)',
      borderRadius: 6,
      padding: '12px 16px',
      marginBottom: 16,
    }}>
      <div style={{ fontFamily: 'Barlow Condensed', fontSize: 13, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--accent-red)', marginBottom: 6 }}>
        ⚠ {items.length} trailer{items.length > 1 ? 's' : ''} with 2000+ cartons — double-check file
      </div>
      {items.map((r, i) => (
        <div key={i} style={{ fontSize: 12, color: '#e8736a', fontFamily: 'Share Tech Mono', marginTop: 2 }}>
          {r.id} · {r.carrier} · {r.cartons.toLocaleString()} ctns · {r.status}
        </div>
      ))}
    </div>
  )
}

/* ── Carton Results Block ─────────────────────────────────── */
export function ResultsBlock({ title, data, showParcel, parcelCartons, accent }) {
  if (!data) return null
  const { palletCartons, fluidCartons, total, palletPct, fluidPct } = data
  const displayTotal = showParcel ? total + parcelCartons : total

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '20px', marginBottom: 16 }}>
      <div style={{ fontFamily: 'Barlow Condensed', fontSize: 14, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 12 }}>{title}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 14 }}>
        <StatCard label="Pallet Cartons" value={palletCartons} accent="var(--pallet-color)" color="var(--pallet-color)" />
        <StatCard label="Fluid Cartons" value={fluidCartons} accent="var(--fluid-color)" color="var(--fluid-color)" />
        <StatCard label="Total" value={displayTotal} accent={accent || 'var(--accent-green)'} color="var(--text-primary)"
          sub={showParcel && parcelCartons > 0 ? `incl. ${parcelCartons.toLocaleString()} parcel` : undefined} />
      </div>
      <SplitBar palletCartons={palletCartons} fluidCartons={fluidCartons} palletPct={palletPct} fluidPct={fluidPct} />
    </div>
  )
}
