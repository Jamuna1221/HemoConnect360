import { FaUsers, FaHeartbeat, FaHospital, FaTint, FaCheckCircle } from 'react-icons/fa'
import StateMessage from './common/StateMessage'

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const fmtDate = (value) => {
  if (!value) return null
  const d = new Date(value)
  return isNaN(d.getTime()) ? null : d
}

const countByMonth = (items, key = 'createdAt') => {
  const map = {}
  items.forEach((item) => {
    const date = fmtDate(item[key])
    if (!date) return
    const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    map[month] = (map[month] || 0) + 1
  })
  return map
}

const lastSixMonths = () => {
  const result = []
  const now = new Date()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    result.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  return result
}

const ReportsAnalytics = ({ data, loading, error, onRetry }) => {
  if (loading) {
    return <StateMessage type="loading" message="Loading analytics..." />
  }

  if (error || !data) {
    return <StateMessage type="error" message={error || 'No analytics data available'} onRetry={onRetry} />
  }

  const { donors, requesters, requests, bloodBanks, inventorySummary, totalAvailableUnits } = data

  const requestStatusCounts = {}
  requests.forEach((r) => {
    requestStatusCounts[r.status] = (requestStatusCounts[r.status] || 0) + 1
  })
  const requestStatusTotal = requests.length || 1

  const donorVerified = donors.filter((d) => d.verificationStatus === 'verified').length
  const donorPending = donors.filter((d) => d.verificationStatus !== 'verified').length

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
  const maxStock = Math.max(1, ...Object.values(inventorySummary).map(Number))

  const donorMonths = countByMonth(donors)
  const requesterMonths = countByMonth(requesters)
  const bankMonths = countByMonth(bloodBanks)
  const monthKeys = lastSixMonths()

  const registrations = monthKeys.map((key) => ({
    label: MONTH_NAMES[Number(key.split('-')[1]) - 1],
    total: (donorMonths[key] || 0) + (requesterMonths[key] || 0) + (bankMonths[key] || 0),
  }))
  const maxRegistration = Math.max(1, ...registrations.map((r) => r.total))

  const priorityCounts = { urgent: 0, critical: 0 }
  requests.forEach((r) => {
    if (r.priority === 'urgent' || r.priority === 'critical') priorityCounts[r.priority]++
  })

  return (
    <div className="tab-panel">
      <p className="tab-info-text">Platform activity analytics and success metrics computed live from verified records.</p>

      <section className="admin-stats-grid">
        <div className="stat-card">
          <div className="stat-icon stat-icon--red"><FaUsers /></div>
          <div className="stat-info"><h3>{donors.length}</h3><p>Total Donors</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon--blue"><FaUsers /></div>
          <div className="stat-info"><h3>{requesters.length}</h3><p>Total Requesters</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon--blue"><FaHeartbeat /></div>
          <div className="stat-info"><h3>{requests.length}</h3><p>Blood Requests</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon--red"><FaHospital /></div>
          <div className="stat-info"><h3>{bloodBanks.length}</h3><p>Blood Banks</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon--red"><FaTint /></div>
          <div className="stat-info"><h3>{totalAvailableUnits}</h3><p>Available Units</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon--blue"><FaCheckCircle /></div>
          <div className="stat-info"><h3>{donorVerified}</h3><p>Verified Donors</p></div>
        </div>
      </section>

      <section className="reports-analytics-grid">
        <div className="report-card">
          <h3>Blood Group Inventory</h3>
          <div className="mock-bar-chart reports-bar-chart">
            {bloodGroups.map((group) => {
              const qty = Number(inventorySummary[group] || 0)
              const height = qty === 0 ? 2 : Math.max(6, Math.round((qty / maxStock) * 100))
              return (
                <div key={group} className="mock-bar" style={{ height: `${height}%` }}>
                  <span>{group}</span>
                  <div className="bar-value-tip">{qty}</div>
                </div>
              )
            })}
          </div>
          <p>{totalAvailableUnits} total units available across all blood banks.</p>
        </div>

        <div className="report-card">
          <h3>Monthly Registrations (6 Months)</h3>
          <div className="mock-bar-chart reports-bar-chart">
            {registrations.map((r) => {
              const height = r.total === 0 ? 2 : Math.max(6, Math.round((r.total / maxRegistration) * 100))
              return (
                <div key={r.label} className="mock-bar mock-bar--blue" style={{ height: `${height}%` }}>
                  <span>{r.label}</span>
                  <div className="bar-value-tip">{r.total}</div>
                </div>
              )
            })}
          </div>
          <p>Combined donor, requester and blood bank registrations per month.</p>
        </div>
      </section>

      <section className="reports-analytics-grid" style={{ marginTop: '25px' }}>
        <div className="report-card report-card--wide">
          <h3>Request Status Distribution</h3>
          <div className="status-distribution-list">
            {Object.entries(requestStatusCounts).map(([status, count]) => {
              const pct = Math.round((count / requestStatusTotal) * 100)
              return (
                <div className="distribution-row" key={status}>
                  <span className="group-label">{status.replace(/_/g, ' ')}</span>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: `${pct}%`, background: '#E53935' }} />
                  </div>
                  <span className="percent-val">{count} ({pct}%)</span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="report-card report-card--wide">
          <h3>Verification Summary</h3>
          <div className="status-distribution-list">
            <div className="distribution-row">
              <span className="group-label">Donors Verified</span>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: `${donors.length ? (donorVerified / donors.length) * 100 : 0}%`, background: '#16a34a' }} />
              </div>
              <span className="percent-val">{donorVerified} / {donors.length}</span>
            </div>
            <div className="distribution-row">
              <span className="group-label">Donors Pending</span>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: `${donors.length ? (donorPending / donors.length) * 100 : 0}%`, background: '#d97706' }} />
              </div>
              <span className="percent-val">{donorPending} / {donors.length}</span>
            </div>
            <div className="distribution-row">
              <span className="group-label">Urgent Requests</span>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: `${requests.length ? ((priorityCounts.urgent + priorityCounts.critical) / requests.length) * 100 : 0}%`, background: '#dc2626' }} />
              </div>
              <span className="percent-val">{priorityCounts.urgent + priorityCounts.critical} / {requests.length}</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default ReportsAnalytics
