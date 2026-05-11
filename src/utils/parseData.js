/**
 * Parse CSV text into array of objects
 */
export function parseCSV(text) {
  const lines = text.trim().split('\n')
  if (lines.length < 2) return []

  const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim())

  return lines.slice(1).map(line => {
    // Handle quoted fields with commas inside
    const values = []
    let current = ''
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') {
        inQuotes = !inQuotes
      } else if (ch === ',' && !inQuotes) {
        values.push(current.trim())
        current = ''
      } else {
        current += ch
      }
    }
    values.push(current.trim())

    const obj = {}
    headers.forEach((h, i) => {
      obj[h] = (values[i] || '').replace(/"/g, '').trim()
    })
    return obj
  }).filter(row => row['Appointment Id'])
}

/**
 * Normalize a row into a standard shape
 */
export function normalizeRow(row) {
  const arrivalRaw = row['Expected Arrival Date'] || ''
  const arrivalDate = arrivalRaw ? new Date(arrivalRaw) : null

  const pallets = parseInt(row['Pallets'] || '0', 10) || 0
  const cartons = parseInt(row['Cartons'] || '0', 10) || 0
  const loadType = row['Load Type'] || ''
  const status = row['Status'] || ''
  const carrier = row['Carrier'] || ''

  const isPalletized = loadType.includes('IS_PALLETIZED') && pallets > 0
  const isFluid = !isPalletized

  // Small parcel detection: carrier code contains known parcel carrier codes
  const parcelCodes = ['UPSN', 'FDEG', 'USPS', 'DHL', 'FXFE', 'FXNL', 'UPSG', 'FDXG']
  const carrierUpper = carrier.toUpperCase()
  const isParcel = parcelCodes.some(code => carrierUpper.includes(code))

  return {
    id: row['Appointment Id'],
    carrier,
    arrivalDate,
    arrivalRaw,
    status,
    pallets,
    cartons,
    loadType,
    isPalletized,
    isFluid,
    isParcel,
    raw: row,
  }
}

/**
 * Check if a row is "active" (ARRIVED or CHECKED_IN)
 */
export function isActive(row) {
  return row.status === 'ARRIVED' || row.status === 'CHECKED_IN'
}

/**
 * Check if a row is ARRIVAL_SCHEDULED
 */
export function isScheduled(row) {
  return row.status === 'ARRIVAL_SCHEDULED'
}

/**
 * Filter scheduled rows within a time window on a specific date
 * windowStart/windowEnd: { hour, minute } in 24h format
 * targetDate: JS Date to compare calendar day
 */
export function filterByTimeWindow(rows, targetDate, windowStart, windowEnd, crossMidnight = false) {
  return rows.filter(row => {
    if (!row.arrivalDate) return false
    const d = row.arrivalDate
    const rowDay = d.toDateString()
    const rowH = d.getHours()
    const rowM = d.getMinutes()
    const rowMins = rowH * 60 + rowM

    const startMins = windowStart.hour * 60 + windowStart.minute
    const endMins = windowEnd.hour * 60 + windowEnd.minute

    if (!crossMidnight) {
      // Same day, same calendar date
      if (d.toDateString() !== targetDate.toDateString()) return false
      return rowMins >= startMins && rowMins <= endMins
    } else {
      // Crosses midnight: first part is targetDate startMins to 23:59
      // second part is next day 00:00 to endMins
      const nextDay = new Date(targetDate)
      nextDay.setDate(nextDay.getDate() + 1)

      if (d.toDateString() === targetDate.toDateString()) {
        return rowMins >= startMins
      } else if (d.toDateString() === nextDay.toDateString()) {
        return rowMins <= endMins
      }
      return false
    }
  })
}

/**
 * Summarize a set of rows into carton counts
 */
export function summarize(rows) {
  const palletRows = rows.filter(r => r.isPalletized)
  const fluidRows = rows.filter(r => r.isFluid)
  const palletCartons = palletRows.reduce((s, r) => s + r.cartons, 0)
  const fluidCartons = fluidRows.reduce((s, r) => s + r.cartons, 0)
  const total = palletCartons + fluidCartons
  const palletPct = total > 0 ? ((palletCartons / total) * 100).toFixed(1) : '0.0'
  const fluidPct = total > 0 ? ((fluidCartons / total) * 100).toFixed(1) : '0.0'
  return { palletCartons, fluidCartons, total, palletPct, fluidPct, palletRows, fluidRows }
}
