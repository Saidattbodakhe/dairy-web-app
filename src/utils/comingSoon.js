// Demo storage for "notify me" leads from areas we don't deliver to
// yet. Checkpoint 18's Admin Coming Soon page reads this same data.
const COMING_SOON_STORAGE_KEY = 'dairy_coming_soon_leads'

function loadLeads() {
  try {
    const raw = localStorage.getItem(COMING_SOON_STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveLeads(leads) {
  localStorage.setItem(COMING_SOON_STORAGE_KEY, JSON.stringify(leads))
}

export function getComingSoonLeads() {
  return loadLeads()
}

export function addComingSoonLead({ name, phone, area, pincode }) {
  const leads = loadLeads()
  const lead = { name, phone, area, pincode, createdAt: new Date().toISOString() }
  saveLeads([...leads, lead])
  return lead
}
