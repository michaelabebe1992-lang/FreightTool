import React, { useState, useMemo } from 'react'
import { parseCSV, normalizeRow, isActive, isScheduled, filterByTimeWindow, summarize } from '../utils/parseData'
import { FileUpload, Toggle, StatCard, SplitBar, SectionHeader, AlertBanner } from './UI'

// Night shift windows
// First half:  16:45 – 00:00 (same day → next day midnight)
// Second half: 00:01 – 05:00 (next day)
const NIGHT1_START = { hour: 16, minute: 45 }
const NIGHT1_END = { hour: 23, minute: 59 }
const NIGHT2_START = { hour: 0, minute: 1 }
const NIGHT2_END = { hour: 5, minute: 0 }

function analyzeHalf(csvText, showRate, showParcel, windowStart, windowEnd, label) {
  if (!csvText) return null
  const rows = parseCSV(csvText).map(normalizeRow)

  // Detect target date
  const scheduledRows = rows.filter(isScheduled)
  const dates = scheduledRows.map(r => r.arrivalDate?.toDateString()).filter(Boolean)
  const dateFreq = {}
  dates.forEach(d => { dateFreq[d] = (dateFreq[d] || 0) + 1 })
  const targetDateStr = Object.entries(dateFreq).sort((a, b) => b[1] - a[1])[0]?.[0]
  const targetDate = targetDateStr ? new Date(targetDateStr) : new Date()

  const activeRows = rows.filter(isActive)
  const windowScheduled = filterByTimeWindow(scheduledRows, targetDate, windowStart, windowEnd)

  const parcelScheduled = windowScheduled.filter(r => r.isParcel)
  const nonParcelScheduled = windowScheduled.filter(r => !r.isParcel)

  const rate = showRate / 100
  const scheduledBase = showParcel ? windowScheduled : nonParcelScheduled
  const scheduledSummary = summarize(scheduledBase)
  const scheduledApplied = {
    palletCartons: Math.round(scheduledSummary.palletCartons * rate),
    fluidCartons: Math.round(scheduledSummary.fluidCartons * rate),
    get total() { return this.palletCartons + this.fluidCartons },
    get palletPct() { return this.total > 0 ? ((this.palletCartons / this.total) * 100).toFixed(1) : '0.0' },
    get fluidPct() { return this.total > 0 ? ((this.fluidCartons / this.total) * 100).toFixed(1) : '0.0' },
  }

  const activeSummary = summarize(activeRows)
  const parcelScheduledCartons = parcelScheduled.reduce((s, r) => s + r.cartons, 0)

  const grandTotal = {
    palletCartons: activeSummary.palletCartons + scheduledApplied.palletCartons,
    fluidCartons: activeSummary.fluidCartons + scheduledApplied.fluidCartons,
    get total() { return this.palletCartons + this.fluidCartons },
    get palletPct() { return this.total > 0 ? ((this.palletCartons / this.total) * 100).toFixed(1) : '0.0' },
    get fluidPct() { return this.total > 0 ? ((this.fluidCartons / this.total) * 100).toFixed(1) : '0.0' },
  }

  const flaggedRows = [...activeRows, ...windowScheduled].filter(r => r.cartons >= 2000)

  return { rows, targetDate, activeRows, windowScheduled, flaggedRows, activeSummary, scheduledApplied, grandTotal, parcelScheduledCartons, label }
}

/* ── Half Panel ────────────────────────────────────────────── */
function HalfPanel({ data, showRate, showParcel, accent, label, window }) {
  if (!data) return null
  const { activeRows, windowScheduled, flaggedRows, activeSummary, scheduledApplied, grandTotal, parcelScheduledCartons, targetDate } = data

  return (
    <div style={{ background: 'var(--bg-secondary)', border: `1px solid ${accent}44`, borderRadius: 10, padding: 20 }}>
      <div style={{ fontFamily: 'Barlow Condensed', fontSize: 16, fontWeight: 700, letterSpacing: 2, color: accent, textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
      <div style={{ fontFamily: 'Share Tech Mono', fontSize: 11, color: 'var(--text-muted)', marginBottom: 16 }}>{targetDate.toDateString()} · {window}</div>

      <AlertBanner items={flaggedRows} />

      {/* Active */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontFamily: 'Barlow Condensed', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>
          🟢 Arrived + Checked In ({activeRows.length} trailers)
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          <StatCard label="Pallet" value={activeSummary.palletCartons} accent="var(--pallet-color)" color="var(--pallet-color)" />
          <StatCard label="Fluid" value={activeSummary.fluidCartons} accent="var(--fluid-color)" color="var(--fluid-color)" />
          <StatCard label="Total" value={activeSummary.total} accent={accent} color="var(--text-primary)" />
        </div>
        <div style={{ marginTop: 8 }}><SplitBar {...activeSummary} /></div>
      </div>

      {/* Scheduled */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontFamily: 'Barlow Condensed', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>
          🕐 Scheduled × {showRate}% ({windowScheduled.length} trailers · {window})
          {!showParcel && parcelScheduledCartons > 0 && (
            <span style={{ color: 'var(--parcel-color)', marginLeft: 8, textTransform: 'none' }}>
              · Small parcel hidden ({parcelScheduledCartons.toLocaleString()} ctns excluded)
            </span>
          )}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          <StatCard label="Pallet" value={scheduledApplied.palletCartons} accent="var(--pallet-color)" color="var(--pallet-color)" />
          <StatCard label="Fluid" value={scheduledApplied.fluidCartons} accent="var(--fluid-color)" color="var(--fluid-color)" />
          <StatCard
            label="Total"
            value={scheduledApplied.total}
            accent={accent} color="var(--text-primary)"
          />
        </div>
        <div style={{ marginTop: 8 }}>
          <SplitBar palletCartons={scheduledApplied.palletCartons} fluidCartons={scheduledApplied.fluidCartons} palletPct={scheduledApplied.palletPct} fluidPct={scheduledApplied.fluidPct} />
        </div>
      </div>

      {/* Half Goal */}
      <div style={{ background: `${accent}11`, border: `1px solid ${accent}44`, borderRadius: 8, padding: 14 }}>
        <div style={{ fontFamily: 'Barlow Condensed', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: accent, marginBottom: 8 }}>
          🎯 {label} Goal
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          <StatCard label="Pallet" value={grandTotal.palletCartons} accent="var(--pallet-color)" color="var(--pallet-color)" />
          <StatCard label="Fluid" value={grandTotal.fluidCartons} accent="var(--fluid-color)" color="var(--fluid-color)" />
          <StatCard
            label="Total Goal"
            value={grandTotal.total}
            accent={accent} color={accent}
          />
        </div>
        <div style={{ marginTop: 8 }}>
          <SplitBar palletCartons={grandTotal.palletCartons} fluidCartons={grandTotal.fluidCartons} palletPct={grandTotal.palletPct} fluidPct={grandTotal.fluidPct} />
        </div>
      </div>
    </div>
  )
}

export default function NightShift() {
  const [csv1, setCsv1] = useState(null)
  const [fileName1, setFileName1] = useState('')
  const [csv2, setCsv2] = useState(null)
  const [fileName2, setFileName2] = useState('')
  const [showRate, setShowRate] = useState(75)
  const [showParcel, setShowParcel] = useState(true)

  const half1 = useMemo(() => analyzeHalf(csv1, showRate, showParcel, NIGHT1_START, NIGHT1_END, 'First Half'), [csv1, showRate, showParcel])
  const half2 = useMemo(() => analyzeHalf(csv2, showRate, showParcel, NIGHT2_START, NIGHT2_END, 'Second Half'), [csv2, showRate, showParcel])

  // Combined totals (Arrived+CheckedIn counted ONCE from first half file if available, else second)
  const combined = useMemo(() => {
    if (!half1 && !half2) return null
    const activeSource = half1 || half2
    const activeSummary = activeSource.activeSummary

    const sched1 = half1?.scheduledApplied || { palletCartons: 0, fluidCartons: 0, total: 0 }
    const sched2 = half2?.scheduledApplied || { palletCartons: 0, fluidCartons: 0, total: 0 }
    const parcel1 = half1?.parcelScheduledCartons || 0
    const parcel2 = half2?.parcelScheduledCartons || 0

    const palletCartons = activeSummary.palletCartons + sched1.palletCartons + sched2.palletCartons
    const fluidCartons = activeSummary.fluidCartons + sched1.fluidCartons + sched2.fluidCartons
    const total = palletCartons + fluidCartons
    const palletPct = total > 0 ? ((palletCartons / total) * 100).toFixed(1) : '0.0'
    const fluidPct = total > 0 ? ((fluidCartons / total) * 100).toFixed(1) : '0.0'
    const parcelTotal = parcel1 + parcel2

    return { palletCartons, fluidCartons, total, palletPct, fluidPct, parcelTotal }
  }, [half1, half2])

  return (
    <div>
      {/* Upload + Controls */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 24 }}>
        <div>
          <div style={{ fontFamily: 'Barlow Condensed', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--accent-purple)', marginBottom: 8 }}>
            First Half · 4:45 PM – 12:00 AM
          </div>
          <FileUpload label="Upload First Half CSV" onFile={(t, n) => { setCsv1(t); setFileName1(n) }} fileName={fileName1} accent="var(--accent-purple)" />
        </div>
        <div>
          <div style={{ fontFamily: 'Barlow Condensed', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--accent-blue)', marginBottom: 8 }}>
            Second Half · 12:01 AM – 5:00 AM
          </div>
          <FileUpload label="Upload Second Half CSV" onFile={(t, n) => { setCsv2(t); setFileName2(n) }} fileName={fileName2} accent="var(--accent-blue)" />
        </div>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontFamily: 'Barlow Condensed', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Show Rate (%)</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                type="number" min="0" max="100" value={showRate}
                onChange={e => setShowRate(Number(e.target.value))}
                style={{
                  width: 80, background: 'var(--bg-elevated)', border: '1px solid var(--border-bright)',
                  color: 'var(--accent-yellow)', fontFamily: 'Share Tech Mono', fontSize: 22,
                  padding: '6px 10px', borderRadius: 6, outline: 'none', textAlign: 'center'
                }}
              />
              <span style={{ fontFamily: 'Share Tech Mono', fontSize: 18, color: 'var(--text-secondary)' }}>%</span>
            </div>
          </div>
          <Toggle label="Include Small Parcel" value={showParcel} onChange={setShowParcel} />
        </div>
      </div>

      {!half1 && !half2 && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)', fontFamily: 'Barlow Condensed', fontSize: 16, letterSpacing: 2, textTransform: 'uppercase' }}>
          Upload one or both half files to begin
        </div>
      )}

      {/* Two halves side by side */}
      <div style={{ display: 'grid', gridTemplateColumns: half1 && half2 ? '1fr 1fr' : '1fr', gap: 16, marginBottom: 20 }}>
        {half1 && <HalfPanel data={half1} showRate={showRate} showParcel={showParcel} accent="var(--accent-purple)" label="First Half" window="16:45–00:00" />}
        {half2 && <HalfPanel data={half2} showRate={showRate} showParcel={showParcel} accent="var(--accent-blue)" label="Second Half" window="00:01–05:00" />}
      </div>

      {/* Combined total */}
      {combined && half1 && half2 && (
        <div style={{ background: 'linear-gradient(135deg, #161920, #1a1f2e)', border: '2px solid var(--accent-yellow)', borderRadius: 10, padding: 20 }}>
          <SectionHeader icon="🌙" title="Full Night Shift Goal" badge="BOTH HALVES COMBINED" />
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14, fontFamily: 'Barlow Condensed', letterSpacing: 1 }}>
            Arrived+Checked In (shared) + First Half Scheduled + Second Half Scheduled
            {!showParcel && combined.parcelTotal > 0 && (
              <span style={{ color: 'var(--parcel-color)', marginLeft: 12 }}>
                · Small parcel hidden ({combined.parcelTotal.toLocaleString()} ctns excluded)
              </span>
            )}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 14 }}>
            <StatCard label="Pallet Cartons" value={combined.palletCartons} accent="var(--pallet-color)" color="var(--pallet-color)" />
            <StatCard label="Fluid Cartons" value={combined.fluidCartons} accent="var(--fluid-color)" color="var(--fluid-color)" />
            <StatCard
              label="🎯 Total Goal"
              value={combined.total}
              accent="var(--accent-yellow)" color="var(--accent-yellow)"
            />
          </div>
          <SplitBar palletCartons={combined.palletCartons} fluidCartons={combined.fluidCartons} palletPct={combined.palletPct} fluidPct={combined.fluidPct} />
        </div>
      )}
    </div>
  )
}
