import { useState } from 'react'
import { FaSearch, FaFilter, FaEye, FaHeartbeat } from 'react-icons/fa'
import AdminModal from './common/AdminModal'

const BloodRequests = ({ requests, searchQuery, setSearchQuery, bloodFilter, setBloodFilter, onUpdateStatus }) => {
  const [selectedRequest, setSelectedRequest] = useState(null)

  const filteredRequests = requests.filter(r => {
    const matchesSearch = r.patientName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          r.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          r.hospitalName.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesBlood = bloodFilter === 'all' || r.bloodGroup === bloodFilter
    return matchesSearch && matchesBlood
  })

  const handleStatusChange = async (newStatus) => {
    if (onUpdateStatus && selectedRequest) {
      const success = await onUpdateStatus(selectedRequest.id, newStatus)
      if (success !== false) {
        setSelectedRequest(prev => prev ? { ...prev, status: newStatus } : null)
      }
    }
  }

  return (
    <div className="tab-panel">
      <div className="data-toolbar">
        <div className="search-wrap">
          <FaSearch />
          <input
            type="text"
            placeholder="Search requests by patient, hospital..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="filter-wrap">
          <FaFilter />
          <select value={bloodFilter} onChange={(e) => setBloodFilter(e.target.value)}>
            <option value="all">All Groups</option>
            <option value="A+">A+</option>
            <option value="A-">A-</option>
            <option value="B+">B+</option>
            <option value="B-">B-</option>
            <option value="AB+">AB+</option>
            <option value="AB-">AB-</option>
            <option value="O+">O+</option>
            <option value="O-">O-</option>
          </select>
        </div>
      </div>

      <div className="table-responsive">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Patient Name</th>
              <th>Hospital</th>
              <th>Blood Info</th>
              <th>Urgency</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRequests.map(r => (
              <tr key={r.id}>
                <td className="font-semibold">{r.patientName}</td>
                <td>
                  <div>{r.hospitalName}</div>
                  <div className="phone-sub">{r.city}</div>
                </td>
                <td><span className="blood-badge">{r.bloodGroup}</span> ({r.units} Units)</td>
                <td><span className={`urgency-badge urgency-badge--${r.priority}`}>{r.priority}</span></td>
                <td><span className={`status-badge status-badge--${r.status}`}>{r.status}</span></td>
                <td>
                  <button 
                    className="action-btn-status action-btn-status--view" 
                    onClick={() => setSelectedRequest(r)}
                  >
                    <FaEye /> View
                  </button>
                </td>
              </tr>
            ))}
            {filteredRequests.length === 0 && (
              <tr>
                <td colSpan="6" className="table-empty">No blood requests matched criteria.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedRequest && (
        <AdminModal
          title="Blood Request Details"
          icon={<FaHeartbeat style={{ color: '#E53935' }} />}
          onClose={() => setSelectedRequest(null)}
          width="500px"
        >
          <div className="modal-details-grid">
            <div className="detail-item">
              <span className="detail-label">Request ID</span>
              <span className="detail-value">{selectedRequest.id}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Patient Name</span>
              <span className="detail-value font-semibold">{selectedRequest.patientName}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Blood Group Needed</span>
              <span className="detail-value"><span className="blood-badge">{selectedRequest.bloodGroup}</span></span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Units Required</span>
              <span className="detail-value">{selectedRequest.units} Units</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Hospital / Location</span>
              <span className="detail-value">{selectedRequest.hospitalName}, {selectedRequest.city}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Urgency Level</span>
              <span className="detail-value">
                <span className={`urgency-badge urgency-badge--${selectedRequest.priority}`}>{selectedRequest.priority}</span>
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Current Status</span>
              <span className="detail-value">
                <span className={`status-badge status-badge--${selectedRequest.status}`}>{selectedRequest.status}</span>
              </span>
            </div>
            <div className="detail-item" style={{ gridColumn: 'span 2', marginTop: '1rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
              <span className="detail-label font-semibold" style={{ marginBottom: '0.5rem', display: 'block' }}>Update Request Status (Admin Control)</span>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {['submitted', 'searching_donors', 'notified', 'accepted', 'approved', 'completed', 'cancelled', 'rejected'].map(st => (
                  <button
                    key={st}
                    onClick={() => handleStatusChange(st)}
                    className={`status-badge status-badge--${st}`}
                    style={{ cursor: 'pointer', border: selectedRequest.status === st ? '2px solid #000' : '1px solid transparent', opacity: selectedRequest.status === st ? 1 : 0.6, transition: 'all 0.2s' }}
                  >
                    {st.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </AdminModal>
      )}
    </div>
  )
}

export default BloodRequests
