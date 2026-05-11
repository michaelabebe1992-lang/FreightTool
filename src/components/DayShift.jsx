import React, { useState, useMemo } from 'react'
import { parseCSV, normalizeRow, isActive, isScheduled, filterByTimeWindow, summarize } from '../utils/parseData'
import { FileUpload, Toggle, StatCard, SplitBar, SectionHeader, AlertBanner, ResultsBlock } from './UI'

// Day shift window: 05:00 – 16:45
const DAY_START = { hour: 5, minute: 0 }
const DAY_END = { hour: 16, minute: 45 }

export default function DayShift() {
  const [csvText, setCsvText] = useState(null)
  const [fileName, setFileName] = useState('')
  const [showRate, setShowRate] = useState(75)
  const [showParcel, setShowParcel] = useState(true)

  const handleFile = (text, name) => {
    setCsvText(text)
    setFileName(name)
  }

  const parsed = useMemo(() => {
    if (!csvText) return null
    const rows = parseCSV(csvText).map(normalizeRow)

    // Determine target date from the file (most common date among scheduled rows)
    const scheduledRows = rows.filter(isScheduled)
    const dates = scheduledRows.map(r => r.arrivalDate?.toDateString()).filter(Boolean)
    const dateFreq = {}
    dates.forEach(d => { dateFreq[d] = (dateFreq[d] || 0) + 1 })
    const targetDateStr = Object.entries(dateFreq).sort((a, b) => b[1] - a[1])[0]?.[0]
    const targetDate = targetDateStr ? new Date(targetDateStr) : new Date()

    // Active rows (ARRIVED + CHECKED_IN) — any time
    const activeRows = rows.filter(isActive)

    // Scheduled rows for day window on target date
    const dayScheduled = filterByTimeWindow(scheduledRows, targetDate, DAY_START, DAY_END)

    // Flag 2000+ carton rows (active + scheduled)
    const flaggedRows = [...activeRows, ...dayScheduled].filter(r => r.cartons >= 2000)

    // Parcel rows scheduled (for show/hide toggle)
    const parcelScheduled = dayScheduled.filter(r => r.isParcel)
    const nonParcelScheduled = dayScheduled.filter(r => !r.isParcel)

    // Section 1 & 2: Active (arrived + checked in)
    const activeSummary = summarize(activeRows)

    // Section 4 & 5: Scheduled × show rate (excluding parcels if hidden)
    const scheduledBase = showParcel ? dayScheduled : nonParcelScheduled
    const rate = showRate / 100
    const scheduledSummary = summarize(scheduledBase)
    const scheduledApplied = {
      palletCartons: Math.round(scheduledSummary.palletCartons * rate),
      fluidCartons: Math.round(scheduledSummary.fluidCartons * rate),
      get total() { return this.palletCartons + this.fluidCartons },
      get palletPct() { return this.total > 0 ? ((this.palletCartons / this.total) * 100).toFixed(1) : '0.0' },
      get fluidPct() { return this.total > 0 ? ((this.fluidCartons / this.total) * 100).toFixed(1) : '0.0' },
    }

    // Parcel carton count (scheduled only, for toggle display)
    const parcelScheduledCartons = parcelScheduled.reduce((s, r) => s + r.cartons, 0)

    // Section 7: Grand total
    const grandTotal = {
      palletCartons: activeSummary.palletCartons + scheduledApplied.palletCartons,
      fluidCartons: activeSummary.fluidCartons + scheduledApplied.fluidCartons,
      get total() { return this.palletCartons + this.fluidCartons },
      get palletPct() { return this.total > 0 ? ((this.palletCartons / this.total) * 100).toFixed(1) : '0.0' },
      get fluidPct() { return this.total > 0 ? ((this.fluidCartons / this.total) * 100).toFixed(1) : '0.0' },
    }

    return {
      rows,
      targetDate,
      activeRows,
      dayScheduled,
      flaggedRows,
      activeSummary,
      scheduledApplied,
      grandTotal,
      parcelScheduledCartons,
    }
  }, [csvText, showRate, showParcel])

  const s = parsed

  return (
    <div>
      {/* File Upload + Controls */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        <div>
          <FileUpload label="Drop Day Shift CSV / Excel" onFile={handleFile} fileName={fileName} accent="var(--accent-blue)" />
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
              <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 4 }}>of scheduled will show</span>
            </div>
          </div>
          <Toggle label="Include Small Parcel (UPS/FedEx/USPS/DHL)" value={showParcel} onChange={setShowParcel} />
          {s && (
            <div style={{ fontFamily: 'Share Tech Mono', fontSize: 11, color: 'var(--text-muted)' }}>
              Target date: {s.targetDate.toDateString()} · Window: 05:00–16:45
            </div>
          )}
        </div>
      </div>

      {!s && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)', fontFamily: 'Barlow Condensed', fontSize: 16, letterSpacing: 2, textTransform: 'uppercase' }}>
          Upload a CSV file to begin analysis
        </div>
      )}

      {s && (
        <>
          <AlertBanner items={s.flaggedRows} />

          {/* SECTION 1-3: Active (Arrived + Checked In) */}
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 10, padding: 20, marginBottom: 20 }}>
            <SectionHeader icon="🟢" title="Currently Workable" badge={`${s.activeRows.length} trailers`} />
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14, fontFamily: 'Barlow Condensed', letterSpacing: 1 }}>
              ARRIVED + CHECKED IN — all times included
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 14 }}>
              <StatCard label="Pallet Cartons" value={s.activeSummary.palletCartons} accent="var(--pallet-color)" color="var(--pallet-color)" sub={`${s.activeSummary.palletRows.length} trailers`} />
              <StatCard label="Fluid Cartons" value={s.activeSummary.fluidCartons} accent="var(--fluid-color)" color="var(--fluid-color)" sub={`${s.activeSummary.fluidRows.length} trailers`} />
              <StatCard label="Total Cartons" value={s.activeSummary.total} accent="var(--accent-green)" color="var(--text-primary)" />
            </div>
            <SplitBar {...s.activeSummary} />
          </div>

          {/* SECTION 4-6: Scheduled × Show Rate */}
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 10, padding: 20, marginBottom: 20 }}>
            <SectionHeader icon="🕐" title="Arrival Scheduled × Show Rate" badge={`${s.dayScheduled.length} trailers · ×${showRate}%`} />
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14, fontFamily: 'Barlow Condensed', letterSpacing: 1 }}>
              SCHEDULED 05:00–16:45 · MULTIPLIED BY {showRate}% SHOW RATE
              {!showParcel && s.parcelScheduledCartons > 0 && (
                <span style={{ color: 'var(--parcel-color)', marginLeft: 12 }}>
                  · Small parcel hidden ({s.parcelScheduledCartons.toLocaleString()} ctns excluded)
                </span>
              )}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 14 }}>
              <StatCard label="Pallet Cartons" value={s.scheduledApplied.palletCartons} accent="var(--pallet-color)" color="var(--pallet-color)" />
              <StatCard label="Fluid Cartons" value={s.scheduledApplied.fluidCartons} accent="var(--fluid-color)" color="var(--fluid-color)" />
              <StatCard
                label="Total Cartons"
                value={s.scheduledApplied.total}
                accent="var(--accent-orange)"
                color="var(--text-primary)"
              />
            </div>
            <SplitBar palletCartons={s.scheduledApplied.palletCartons} fluidCartons={s.scheduledApplied.fluidCartons} palletPct={s.scheduledApplied.palletPct} fluidPct={s.scheduledApplied.fluidPct} />
          </div>

          {/* SECTION 7-8: Grand Total */}
          <div style={{ background: 'linear-gradient(135deg, #161920, #1a1f2e)', border: '2px solid var(--accent-yellow)', borderRadius: 10, padding: 20 }}>
            <SectionHeader icon="🎯" title="Shift Carton Goal" badge="ACTIVE + SCHEDULED" />
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14, fontFamily: 'Barlow Condensed', letterSpacing: 1 }}>
              (ARRIVED + CHECKED IN) + (SCHEDULED × {showRate}%)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 14 }}>
              <StatCard label="Pallet Cartons" value={s.grandTotal.palletCartons} accent="var(--pallet-color)" color="var(--pallet-color)" />
              <StatCard label="Fluid Cartons" value={s.grandTotal.fluidCartons} accent="var(--fluid-color)" color="var(--fluid-color)" />
              <StatCard
                label="🎯 Total Goal"
                value={s.grandTotal.total}
                accent="var(--accent-yellow)"
                color="var(--accent-yellow)"
              />
            </div>
            <SplitBar palletCartons={s.grandTotal.palletCartons} fluidCartons={s.grandTotal.fluidCartons} palletPct={s.grandTotal.palletPct} fluidPct={s.grandTotal.fluidPct} />
          </div>
        </>
      )}
    </div>
  )
}
