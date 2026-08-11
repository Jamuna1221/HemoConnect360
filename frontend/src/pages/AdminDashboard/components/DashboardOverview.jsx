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
  const pendingRequests = requests.filter(r => r.status === 'searching' || r.status === 'submitted').length
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
        {/* Blood Request Overview Chart */}
        <div className="chart-card">
          <h4>Blood Request Overview</h4>
          <div className="overview-chart-mock">
            <div className="trend-line-container">
              <svg viewBox="0 0 300 100" className="trend-svg">
                <path d="M10,80 Q50,40 100,60 T200,30 T300,10" fill="none" stroke="#E53935" strokeWidth="3" />
                <circle cx="10" cy="80" r="4" fill="#E53935" />
                <circle cx="100" cy="60" r="4" fill="#E53935" />
                <circle cx="200" cy="30" r="4" fill="#E53935" />
                <circle cx="300" cy="10" r="4" fill="#E53935" />
              </svg>
            </div>
            <div className="chart-labels">
              <span>Week 1</span>
              <span>Week 2</span>
              <span>Week 3</span>
              <span>Week 4</span>
            </div>
          </div>
          <p className="chart-footer-desc">Blood requests matched growth of +15% over the last 30 days.</p>
        </div>

        {/* Blood Group Demand Chart */}
        <div className="chart-card">
          <h4>Blood Group Demand</h4>
          <div className="demand-chart-mock">
            <div className="demand-bar-row">
              <span className="group-label">O+</span>
              <div className="bar-track"><div className="bar-fill" style={{ width: '85%', background: '#E53935' }}></div></div>
              <span className="percent-val">85%</span>
            </div>
            <div className="demand-bar-row">
              <span className="group-label">B+</span>
              <div className="bar-track"><div className="bar-fill" style={{ width: '60%', background: '#EF5350' }}></div></div>
              <span className="percent-val">60%</span>
            </div>
            <div className="demand-bar-row">
              <span className="group-label">A-</span>
              <div className="bar-track"><div className="bar-fill" style={{ width: '40%', background: '#E53935' }}></div></div>
              <span className="percent-val">40%</span>
            </div>
          </div>
          <p className="chart-footer-desc">O+ remains the most demanded group this week.</p>
        </div>

        {/* Request Status Chart */}
        <div className="chart-card">
          <h4>Request Status</h4>
          <div className="progress-radial-mock">
            <div className="radial-bar" style={{ background: 'conic-gradient(#E53935 65%, #2563eb 20%, #e2e8f0 0)' }}>
              <div className="radial-center">65% Active</div>
            </div>
          </div>
          <div className="status-legend-grid">
            <div><span className="legend-dot legend-dot--red"></span>Searching (65%)</div>
            <div><span className="legend-dot legend-dot--blue"></span>Completed (20%)</div>
            <div><span className="legend-dot legend-dot--gray"></span>Cancelled (15%)</div>
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
            {requests.slice(0, 3).map(r => (
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
            {auditLogs.slice(0, 4).map(log => (
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
