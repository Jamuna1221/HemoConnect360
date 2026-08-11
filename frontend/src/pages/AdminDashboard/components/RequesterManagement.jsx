import { useState } from 'react'
import { FaSearch, FaMapMarkerAlt, FaBan, FaCheck, FaUsers, FaUserSlash, FaHeartbeat, FaEye, FaCalendarAlt, FaHospital, FaTint } from 'react-icons/fa'

const RequesterManagement = ({ requesters, requests = [], searchQuery, setSearchQuery, onToggleStatus }) => {
  const [statusFilter, setStatusFilter] = useState('all') // 'all', 'active', 'flagged'
  const [selectedRequester, setSelectedRequester] = useState(null)

  // Quick stats calculations
  const totalRequesters = requesters.length
  const activeCount = requesters.filter(r => r.status === 'active').length
  const flaggedCount = requesters.filter(r => r.status === 'flagged').length
  const totalActiveRequests = requesters.reduce((sum, r) => sum + (r.activeRequests || 0), 0)

  const filteredRequesters = requesters.filter(r => {
    const matchesSearch = r.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          r.city.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          r.phone.includes(searchQuery) ||
                          r.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Get requests for selected requester
  const requesterRequests = selectedRequester 
    ? requests.filter(req => req.requesterId === selectedRequester.id)
    : []

  return (
    <div className="tab-panel">
      {/* ─── QUICK STATS CARDS ─── */}
      <div className="admin-stats-grid" style={{ marginBottom: '24px' }}>
        <div className="stat-card" onClick={() => setStatusFilter('all')}>
          <div className="stat-icon stat-icon--blue">
            <FaUsers />
          </div>
          <div className="stat-info">
            <h3>{totalRequesters}</h3>
            <p>Total Requesters</p>
          </div>
        </div>

        <div className="stat-card" onClick={() => setStatusFilter('active')} style={{ borderLeft: '4px solid #16a34a' }}>
          <div className="stat-icon" style={{ background: '#dcfce7', color: '#16a34a', border: '1px solid #bbf7d0' }}>
            <FaUsers />
          </div>
          <div className="stat-info">
            <h3>{activeCount}</h3>
            <p>Active Accounts</p>
          </div>
        </div>

        <div className="stat-card" onClick={() => setStatusFilter('flagged')} style={{ borderLeft: '4px solid #dc2626' }}>
          <div className="stat-icon" style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca' }}>
            <FaUserSlash />
          </div>
          <div className="stat-info">
            <h3>{flaggedCount}</h3>
            <p>Flagged Accounts</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' }}>
            <FaHeartbeat />
          </div>
          <div className="stat-info">
            <h3>{totalActiveRequests}</h3>
            <p>Active Requests</p>
          </div>
        </div>
      </div>

      {/* ─── TOOLBAR & FILTERS ─── */}
      <div className="data-toolbar" style={{ justifyContent: 'space-between', marginBottom: '20px', gap: '15px', flexWrap: 'wrap' }}>
        <div className="search-wrap" style={{ flexGrow: 1, maxWidth: '400px' }}>
          <FaSearch />
          <input
            type="text"
            placeholder="Search requesters by name, email, phone, city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            className={`action-btn-status ${statusFilter === 'all' ? 'action-btn-status--view' : ''}`}
            onClick={() => setStatusFilter('all')}
            style={{ background: statusFilter === 'all' ? '#eff6ff' : '#f1f5f9', color: statusFilter === 'all' ? '#2563eb' : '#475569', border: '1px solid #cbd5e1' }}
          >
            All
          </button>
          <button 
            className={`action-btn-status ${statusFilter === 'active' ? 'action-btn-status--activate' : ''}`}
            onClick={() => setStatusFilter('active')}
            style={{ background: statusFilter === 'active' ? '#dcfce7' : '#f1f5f9', color: statusFilter === 'active' ? '#15803d' : '#475569', border: '1px solid #cbd5e1' }}
          >
            Active ({activeCount})
          </button>
          <button 
            className={`action-btn-status ${statusFilter === 'flagged' ? 'action-btn-status--suspend' : ''}`}
            onClick={() => setStatusFilter('flagged')}
            style={{ background: statusFilter === 'flagged' ? '#fee2e2' : '#f1f5f9', color: statusFilter === 'flagged' ? '#b91c1c' : '#475569', border: '1px solid #cbd5e1' }}
          >
            Flagged ({flaggedCount})
          </button>
        </div>
      </div>

      {/* ─── TABLE VIEW ─── */}
      <div className="table-responsive">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Requester Name</th>
              <th>Email / Phone</th>
              <th>City</th>
              <th>Active Requests</th>
              <th>Status</th>
              <th>View Requests</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredRequesters.map(r => (
              <tr key={r.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: r.status === 'flagged' ? '#fee2e2' : '#eff6ff',
                      color: r.status === 'flagged' ? '#dc2626' : '#2563eb',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      fontSize: '0.9rem'
                    }}>
                      {r.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold">{r.fullName}</div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>ID: {r.id.substring(0, 8)}...</div>
                    </div>
                  </div>
                </td>
                <td>
                  <div>{r.email}</div>
                  <div className="phone-sub">{r.phone}</div>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FaMapMarkerAlt className="icon-sub" style={{ color: '#ef4444' }} /> 
                    <span>{r.city}</span>
                  </div>
                </td>
                <td>
                  <span style={{ 
                    fontWeight: 600, 
                    color: r.activeRequests > 0 ? '#b91c1c' : '#475569',
                    background: r.activeRequests > 0 ? '#fff1f1' : '#f1f5f9',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '0.8rem'
                  }}>
                    {r.activeRequests} Active
                  </span>
                </td>
                <td>
                  <span className={`status-badge status-badge--${r.status === 'active' ? 'completed' : 'flagged'}`}>
                    {r.status === 'active' ? 'Active' : 'Flagged'}
                  </span>
                </td>
                <td>
                  <button
                    className="action-btn-status action-btn-status--view"
                    onClick={() => setSelectedRequester(r)}
                    style={{ width: '130px', justifyContent: 'center' }}
                  >
                    <FaEye /> View Requests
                  </button>
                </td>
                <td>
                  <button
                    className={`action-btn-status ${r.status === 'active' ? 'action-btn-status--suspend' : 'action-btn-status--activate'}`}
                    onClick={() => onToggleStatus(r.id)}
                    style={{ width: '130px', justifyContent: 'center' }}
                  >
                    {r.status === 'active' ? <FaBan /> : <FaCheck />} {r.status === 'active' ? 'Flag Account' : 'Clear Account'}
                  </button>
                </td>
              </tr>
            ))}
            {filteredRequesters.length === 0 && (
              <tr>
                <td colSpan="7">
                  <div className="empty-text" style={{ padding: '40px', color: '#64748b' }}>
                    No requesters matched your criteria.
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ─── REQUESTS DETAIL MODAL ─── */}
      {selectedRequester && (
        <div className="admin-modal-overlay" onClick={() => setSelectedRequester(null)}>
          <div className="admin-modal-card" style={{ maxWidth: '600px', width: '95%' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <FaHeartbeat className="modal-icon" />
              <div>
                <h3 style={{ margin: 0 }}>Blood Requests</h3>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Submitted by <strong>{selectedRequester.fullName}</strong></span>
              </div>
              <button className="modal-close-btn" onClick={() => setSelectedRequester(null)}>&times;</button>
            </div>
            
            <div className="modal-body" style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '4px' }}>
              {requesterRequests.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {requesterRequests.map(req => (
                    <div key={req.id} style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      padding: '14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className="blood-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <FaTint /> {req.bloodGroup} ({req.units} Units Required)
                        </span>
                        <span className={`status-badge status-badge--${
                          req.status === 'completed' ? 'completed' : 
                          req.status === 'cancelled' ? 'suspended' : 'searching'
                        }`}>
                          {req.status}
                        </span>
                      </div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.85rem' }}>
                        <div>
                          <span style={{ color: '#64748b', display: 'block' }}>Patient Name</span>
                          <strong>{req.patientName}</strong>
                        </div>
                        <div>
                          <span style={{ color: '#64748b', display: 'block' }}>Hospital & Location</span>
                          <strong>{req.hospitalName}, {req.city}</strong>
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '8px', marginTop: '4px', fontSize: '0.8rem' }}>
                        <span className={`urgency-badge urgency-badge--${req.priority}`}>
                          Priority: {req.priority}
                        </span>
                        <span style={{ color: '#94a3b8' }}>ID: {req.id}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-text" style={{ padding: '30px', textAlign: 'center' }}>
                  No requests found for this requester.
                </div>
              )}
            </div>
            
            <div className="modal-footer" style={{ marginTop: '20px' }}>
              <button className="modal-action-close" onClick={() => setSelectedRequester(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default RequesterManagement
