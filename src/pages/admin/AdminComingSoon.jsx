import { getComingSoonLeads } from '../../utils/comingSoon'

function AdminComingSoon() {
  const leads = getComingSoonLeads()

  const areaCounts = new Map()
  leads.forEach((lead) => {
    const key = `${lead.area} — ${lead.pincode}`
    areaCounts.set(key, (areaCounts.get(key) || 0) + 1)
  })

  const areaSummary = Array.from(areaCounts.entries())
    .map(([area, count]) => ({ area, count }))
    .sort((a, b) => b.count - a.count)

  return (
    <div>
      <h1 className="mb-4">Coming Soon</h1>

      {leads.length === 0 ? (
        <div className="text-center text-muted py-5">
          <i className="bi bi-signpost-split fs-1 d-block mb-2"></i>
          No interested customers yet.
        </div>
      ) : (
        <>
          <div className="card-plain p-4 mb-4">
            <h2 className="h5 mb-3">Interest by Area</h2>
            <div className="row g-3">
              {areaSummary.map((item) => (
                <div className="col-6 col-md-3" key={item.area}>
                  <div className="border rounded-3 p-3 text-center">
                    <div className="fw-bold fs-5">{item.count}</div>
                    <div className="text-muted small">{item.area}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <h2 className="h5 mb-3">Individual Records</h2>
          <div className="card-plain p-0">
            <div className="table-responsive">
              <table className="table align-middle mb-0">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Area</th>
                    <th>Pincode</th>
                    <th>Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead, index) => (
                    <tr key={`${lead.phone}-${index}`}>
                      <td>{lead.name || '—'}</td>
                      <td>{lead.phone}</td>
                      <td>{lead.area}</td>
                      <td>{lead.pincode}</td>
                      <td className="text-muted small">
                        {new Date(lead.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default AdminComingSoon
