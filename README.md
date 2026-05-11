# 🏭 Dock Master — IB Freight Planner

A shift planning tool for IB freight operations. Upload your Dock Master CSV export and instantly get carton goals broken down by Pallet vs Fluid freight with show rate applied.

---

## 🚀 Setup in Cursor

1. Open this folder in Cursor
2. Open the terminal (`Ctrl+`` ` or `Cmd+`` `)
3. Run:

```bash
npm install
npm run dev
```

4. Open your browser to `http://localhost:5173`

---

## 📋 How to Use

### Day Shift
1. Select **Day Shift** on the home screen
2. Upload your CSV export from Dock Master
3. Adjust the **Show Rate %** if needed (default 75%)
4. Toggle **Small Parcel** on/off (UPS, FedEx, USPS, DHL)
5. Read your results:
   - **Section 1** — Currently Workable (Arrived + Checked In, any time)
   - **Section 2** — Scheduled × Show Rate (05:00–16:45 same day only)
   - **Section 3** — Shift Carton Goal (grand total)

### Night Shift
1. Select **Night Shift** on the home screen
2. Upload **First Half** file (16:45–00:00)
3. Upload **Second Half** file (00:01–05:00)
4. Adjust Show Rate and Small Parcel toggle
5. Read your results:
   - Each half shown side-by-side with its own breakdown
   - **Full Night Shift Goal** combines both halves at the bottom
   - Arrived + Checked In is counted once (shared), not doubled

---

## 🔴 Alerts
- Any trailer with **2000+ cartons** is highlighted in red — double-check those rows in the source file

## 📁 CSV Format Expected

| Column | Description |
|---|---|
| Appointment Id | Unique ID |
| Carrier | Carrier code + name |
| Expected Arrival Date | Date/time (e.g. `2026/05/11 09:00 PDT`) |
| Status | `ARRIVAL_SCHEDULED`, `CHECKED_IN`, or `ARRIVED` |
| Pallets | Number of pallets |
| Cartons | Number of cartons |
| Units | Number of units |
| Load Type | `IS_PALLETIZED` for pallet loads, empty for fluid |

---

## 🧮 Logic Summary

- **Pallet load**: `Load Type` contains `IS_PALLETIZED` AND Pallets > 0
- **Fluid load**: Everything else (Pallets = 0, no IS_PALLETIZED)
- **Small parcel**: Carrier code contains UPSN, FDEG, USPS, DHL, FXFE, FXNL, UPSG, FDXG
- **Active**: Status = `ARRIVED` or `CHECKED_IN` (all times, always included)
- **Scheduled**: Status = `ARRIVAL_SCHEDULED`, filtered to the shift window × show rate
