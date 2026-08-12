import {
  FaUsers,
  FaHeartbeat,
  FaHospital,
  FaClock,
  FaCheckCircle,
  FaTint
} from 'react-icons/fa'

const DashboardOverview = ({
  donors,
  requesters,
  requests,
  bloodBanks,
  auditLogs,
  onNavigateTab
}) => {
  // Stats calculations
  const totalDonors = donors.length
  const totalRequesters = requesters.length
  const totalRequests = requests.length
  const totalBanks = bloodBanks.length
  const pendingRequests = requests.filter(r => r.status === 'searching' || r.status === 'submitted' || r.status === 'notified').length
  const completedRequests = requests.filter(r => r.status === 'completed').length

  // Calculate available blood units from bloodBanks stock matrices
  const totalBloodUnits = bloodBanks.reduce((acc, bank) => {
    if (!bank.stock) return acc
    const sum = bank.stock.reduce((s, curr) => s + (curr.available || 0), 0)
    return acc + sum
  }, 0)

  // Filter urgent requests (priority === critical or urgent)
  const urgentRequests = requests.filter(r => r.priority === 'critical' || r.priority === 'urgent')

  // Stock Summary (Sum per blood group across all banks)
  const groupStockSummary = bloodBanks.reduce((acc, bank) => {
    if (!bank.stock) return acc
    bank.stock.forEach(s => {
      acc[s.group] = (acc[s.group] || 0) + (s.available || 0)
    })
    return acc
  }, {})

  // 1. Blood Request Overview Chart (Trend data based on real dates)
  // Let's divide the last 4 weeks. If no requests, we show a flat line.
  const getOverviewTrendPath = () => {
    if (requests.length === 0) return { path: "M10,80 L300,80", points: [] }
    const now = new Date()
    const weeksData = [0, 0, 0, 0] // [Week 4 ago, Week 3 ago, Week 2 ago, Week 1 ago]
    requests.forEach(r => {
      if (!r.createdAt) return
      const diffMs = now - new Date(r.createdAt)
      const diffDays = diffMs / (1000 * 60 * 60 * 24)
      if (diffDays <= 7) weeksData[3]++
      else if (diffDays <= 14) weeksData[2]++
      else if (diffDays <= 21) weeksData[1]++
      else if (diffDays <= 28) weeksData[0]++
    })

    const maxCount = Math.max(...weeksData, 1)
    // Map to SVG coordinates: width=300, height=100. padding left=10, right=10, top=10, bottom=20
    const points = weeksData.map((val, idx) => {
      const x = 10 + idx * 93.33
      const y = 80 - (val / maxCount) * 60
      return { x, y, val }
    })

    const pathD = `M${points[0].x},${points[0].y} ` + points.slice(1).map(p => `L${p.x},${p.y}`).join(' ')
    const areaD = `${pathD} L300,100 L10,100 Z`

    return { pathD, areaD, points, totalLastMonth: weeksData.reduce((a, b) => a + b, 0) }
  }

  const trendData = getOverviewTrendPath()

  // 2. Blood Group Demand Chart (Calculated from real requests blood group demand)
  const groupDemand = requests.reduce((acc, r) => {
    if (r.bloodGroup) {
      acc[r.bloodGroup] = (acc[r.bloodGroup] || 0) + 1
    }
    return acc
  }, {})
  const sortedDemand = Object.entries(groupDemand)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3) // Show top 3 demanded groups

  const totalDemandCount = Object.values(groupDemand).reduce((a, b) => a + b, 0) || 1

  // 3. Request Status Chart Distribution
  const statusCounts = requests.reduce((acc, r) => {
    const s = r.status || 'submitted'
    acc[s] = (acc[s] || 0) + 1
    return acc
  }, {})

  const getConicGradient = () => {
    const total = requests.length || 1
    let accumulatedPercent = 0
    const parts = []
    
    // Statuses colors
    const colors = {
      completed: '#2563eb', // blue
      cancelled: '#94a3b8', // gray
      rejected: '#ef4444', // red
      default: '#e53935' // deep red
    }

    Object.entries(statusCounts).forEach(([status, count]) => {
      const pct = Math.round((count / total) * 100)
      const color = colors[status] || colors.default
      parts.push(`${color} ${accumulatedPercent}% ${accumulatedPercent + pct}%`)
      accumulatedPercent += pct
    })

    if (parts.length === 0) return 'conic-gradient(#e2e8f0 0% 100%)'
    return `conic-gradient(${parts.join(', ')}, #e2e8f0 ${accumulatedPercent}% 100%)`
  }

  return (
    <div className="tab-panel">
      {/* ─── 1. STATS GRID ─── */}
      <section className="admin-stats-grid">
        <div className="stat-card" onClick={() => onNavigateTab('donors')}>
          <div className="stat-icon stat-icon--red"><FaUsers /></div>
          <div className="stat-info">
            <h3>{totalDonors}</h3>
            <p>Total Donors</p>
          </div>
        </div>

        <div className="stat-card" onClick={() => onNavigateTab('requesters')}>
          <div className="stat-icon stat-icon--blue"><FaUsers /></div>
          <div className="stat-info">
            <h3>{totalRequesters}</h3>
            <p>Total Requesters</p>
          </div>
        </div>

        <div className="stat-card" onClick={() => onNavigateTab('requests')}>
          <div className="stat-icon stat-icon--blue"><FaHeartbeat /></div>
          <div className="stat-info">
            <h3>{totalRequests}</h3>
            <p>Total Blood Requests</p>
          </div>
        </div>

        <div className="stat-card" onClick={() => onNavigateTab('banks')}>
          <div className="stat-icon stat-icon--red"><FaHospital /></div>
          <div className="stat-info">
            <h3>{totalBanks}</h3>
            <p>Blood Banks</p>
          </div>
        </div>

        <div className="stat-card" onClick={() => onNavigateTab('requests')}>
          <div className="stat-icon stat-icon--blue"><FaClock /></div>
          <div className="stat-info">
            <h3>{pendingRequests}</h3>
            <p>Pending Requests</p>
          </div>
        </div>

        <div className="stat-card" onClick={() => onNavigateTab('requests')}>
          <div className="stat-icon stat-icon--red"><FaCheckCircle /></div>
          <div className="stat-info">
            <h3>{completedRequests}</h3>
            <p>Completed Requests</p>
          </div>
        </div>

        <div className="stat-card" onClick={() => onNavigateTab('stock')}>
          <div className="stat-icon stat-icon--red"><FaTint /></div>
          <div className="stat-info">
            <h3>{totalBloodUnits}</h3>
            <p>Available Units</p>
          </div>
        </div>
      </section>

      {/* ─── 2. CHARTS SECTION ─── */}
      <section className="dashboard-charts-section">


        {/* Blood Group Demand Chart */}
        <div className="chart-card">
          <h4>Blood Group Demand</h4>
          <div className="demand-chart-mock">
            {sortedDemand.map(([group, val]) => {
              const percentage = Math.round((val / totalDemandCount) * 100)
              return (
                <div key={group} className="demand-bar-row">
                  <span className="group-label">{group}</span>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: `${percentage}%`, background: '#E53935' }}></div>
                  </div>
                  <span className="percent-val">{percentage}%</span>
                </div>
              )
            })}
            {sortedDemand.length === 0 && <p className="empty-text">No request data found.</p>}
          </div>
          <p className="chart-footer-desc">
            {sortedDemand.length > 0 ? `${sortedDemand[0][0]} remains the most demanded group.` : 'No active demands.'}
          </p>
        </div>

        {/* Request Status Chart */}
        <div className="chart-card">
          <h4>Request Status</h4>
          <div className="progress-radial-mock">
            <div className="radial-bar" style={{ background: getConicGradient() }}>
              <div className="radial-center" style={{ fontSize: '0.8rem', textAlign: 'center', lineHeight: '1.2' }}>
                {requests.length} Total<br/>Requests
              </div>
            </div>
          </div>
          <div className="status-legend-grid">
            {Object.entries(statusCounts).map(([status, count]) => {
              const pct = Math.round((count / (requests.length || 1)) * 100)
              const dotClass = status === 'completed' ? 'legend-dot--blue' : status === 'cancelled' ? 'legend-dot--gray' : 'legend-dot--red'
              return (
                <div key={status} style={{ textTransform: 'capitalize' }}>
                  <span className={`legend-dot ${dotClass}`}></span>
                  {status.replace('_', ' ')} ({pct}%)
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ─── 3. LOWER CONTENT GRID ─── */}
      <section className="dashboard-lower-grid">
        {/* Blood Stock Summary */}
        <div className="dashboard-sub-card">
          <h2>Blood Stock Summary</h2>
          <div className="stock-summary-grid">
            {Object.entries(groupStockSummary).map(([group, qty]) => (
              <div key={group} className="stock-summary-pill">
                <span className="stock-group-badge">{group}</span>
                <span className={`stock-qty ${qty < 10 ? 'stock-qty--low' : ''}`}>{qty} Units</span>
              </div>
            ))}
          </div>
        </div>

        {/* Urgent Blood Requests */}
        <div className="dashboard-sub-card">
          <h2>Urgent Blood Requests</h2>
          <div className="mini-list">
            {urgentRequests.map(r => (
              <div key={r.id} className="mini-list-item mini-list-item--urgent">
                <div className="item-main">
                  <strong>{r.patientName} ({r.bloodGroup})</strong>
                  <span>{r.hospitalName}, {r.city}</span>
                </div>
                <span className="urgency-tag">CRITICAL</span>
              </div>
            ))}
            {urgentRequests.length === 0 && <p className="empty-text">No urgent requests at the moment.</p>}
          </div>
        </div>

        {/* Recent Blood Requests */}
        <div className="dashboard-sub-card">
          <h2>Recent Blood Requests</h2>
          <div className="mini-list">
            {requests.slice(0, 10).map(r => (
              <div key={r.id} className="mini-list-item">
                <div className="item-main">
                  <strong>{r.patientName} ({r.bloodGroup})</strong>
                  <span>{r.hospitalName}, {r.city}</span>
                </div>
                <span className={`status-text status-text--${r.status}`}>{r.status}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="dashboard-sub-card">
          <h2>Recent Activity</h2>
          <div className="mini-log-list">
            {auditLogs.slice(0, 10).map(log => (
              <div className="mini-log-row" key={log.id}>
                <span className="log-action">{log.action}</span>
                <span className="log-time">{log.createdAt ? new Date(log.createdAt).toLocaleString() : ''}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

export default DashboardOverview
