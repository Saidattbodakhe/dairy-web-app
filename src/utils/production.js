// Demo milk production log, stored in localStorage.
const PRODUCTION_STORAGE_KEY = 'dairy_milk_production'

const seedEntries = [
  { id: 'PROD-0001', date: '2026-08-17', morning: 52, evening: 46, wastage: 2, notes: '', total: 98 },
  { id: 'PROD-0002', date: '2026-08-18', morning: 54, evening: 44, wastage: 1, notes: '', total: 98 },
  {
    id: 'PROD-0003',
    date: '2026-08-19',
    morning: 55,
    evening: 45,
    wastage: 2,
    notes: 'Slightly lower evening yield',
    total: 100,
  },
]

function loadEntries() {
  try {
    const raw = localStorage.getItem(PRODUCTION_STORAGE_KEY)
    if (raw) return JSON.parse(raw)
    saveEntries(seedEntries)
    return seedEntries
  } catch {
    return seedEntries
  }
}

function saveEntries(entries) {
  localStorage.setItem(PRODUCTION_STORAGE_KEY, JSON.stringify(entries))
}

export function getProductionEntries() {
  return loadEntries().sort((a, b) => new Date(b.date) - new Date(a.date))
}

export function addProductionEntry({ date, morning, evening, wastage, notes }) {
  const entries = loadEntries()
  const entry = {
    id: `PROD-${String(entries.length + 1).padStart(4, '0')}`,
    date,
    morning,
    evening,
    wastage,
    notes,
    total: morning + evening,
  }

  const updated = [...entries, entry]
  saveEntries(updated)
  return getProductionEntries()
}
