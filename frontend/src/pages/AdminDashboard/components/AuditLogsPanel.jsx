import { useState } from 'react'
import { FaSearch, FaFilter, FaCalendarAlt, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa'

const AuditLogsPanel = ({ auditLogs }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [actionFilter, setActionFilter] = useState('all')

  // Extract unique action types for filter options
  const uniqueActions = ['all', ...new Set(auditLogs.map(log => log.action))]

  // Filter logs logic
  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch =
      log.admin.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.target.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.description.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesDate = !dateFilter || log.timestamp.includes(dateFilter)
    const matchesAction = actionFilter === 'all' || log.action === actionFilter

    return matchesSearch && matchesDate && matchesAction
  })

  return (
    <div className="tab-panel">
      <p className="tab-info-text">
        Complete timeline registry tracking administrative logs, security resolutions, status changes, and platform audit history.
      </p>

      {/* ─── 1. FILTERS & SEARCH TOOLBAR ─── */}
      <div className="data-toolbar" style={{ flexWrap: 'wrap', gap: '15px' }}>
        <div className="search-wrap" style={{ flexGrow: 2, maxWidth: 'none' }}>
          <FaSearch />
          <input
            type="text"
            placeholder="Search logs by admin, target, action, description details..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-wrap" style={{ minWidth: '180px' }}>
          <FaCalendarAlt />
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            style={{ border: 'none', background: 'none', color: '#334155', outline: 'none', fontSize: '0.85rem' }}
          />
        </div>

        <div className="filter-wrap" style={{ minWidth: '180px' }}>
          <FaFilter />
          <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}>
            <option value="all">All Actions</option>
            {uniqueActions.filter(act => act !== 'all').map(act => (
              <option key={act} value={act}>{act}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ─── 2. AUDIT LOGS TABLE ─── */}
      <div className="table-responsive">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Date / Time</th>
              <th>Admin Operator</th>
              <th>Action Type</th>
              <th>Target Scope</th>
              <th>Detailed Description</th>
              <th>Execution Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.map(log => (
              <tr key={log.id}>
                <td className="font-semibold" style={{ whiteSpace: 'nowrap' }}>
                  <FaCalendarAlt className="icon-sub" /> {log.timestamp}
                </td>
                <td>{log.admin}</td>
                <td>
                  <span className="blood-badge" style={{ background: '#eff6ff', color: '#1d4ed8', borderColor: '#bfdbfe' }}>
                    {log.action}
                  </span>
                </td>
                <td className="font-semibold">{log.target}</td>
                <td>{log.description}</td>
                <td>
                  <span className={`status-badge status-badge--${log.status === 'Success' ? 'completed' : 'suspended'}`}>
                    {log.status === 'Success' ? <FaCheckCircle style={{ marginRight: '4px' }} /> : <FaExclamationCircle style={{ marginRight: '4px' }} />}
                    {log.status}
                  </span>
                </td>
              </tr>
            ))}
            {filteredLogs.length === 0 && (
              <tr>
                <td colSpan="6" className="table-empty">No matching audit trail logs found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default AuditLogsPanel
