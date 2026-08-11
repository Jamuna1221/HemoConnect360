import { useState } from 'react'
import { FaSearch, FaMapMarkerAlt, FaEye, FaCheck, FaTimes, FaBan, FaRegBuilding } from 'react-icons/fa'

const BloodBankManagement = ({ bloodBanks, searchQuery, setSearchQuery, onVerify, onToggleStatus }) => {
  const [selectedBank, setSelectedBank] = useState(null)

  const filteredBloodBanks = bloodBanks.filter(b => {
    const matchesSearch = b.name.toLowerCase().includes(searchQuery.toLowerCase()) || b.city.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  return (
    <div className="tab-panel">
      <div className="data-toolbar">
        <div className="search-wrap">
          <FaSearch />
          <input
            type="text"
            placeholder="Search blood banks by name, city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="table-responsive">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Blood Bank Name</th>
              <th>Location</th>
              <th>Contact Details</th>
              <th>Verification</th>
              <th>Available Stock</th>
              <th>Account Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredBloodBanks.map(b => (
              <tr key={b.id}>
                <td className="font-semibold">{b.name}</td>
                <td><FaMapMarkerAlt className="icon-sub" /> {b.city}</td>
                <td>
                  <div>{b.phone}</div>
                  <div className="phone-sub">{b.email}</div>
                </td>
                <td>
                  <span className={`status-badge status-badge--${b.verificationStatus === 'verified' ? 'completed' : b.verificationStatus === 'rejected' ? 'suspended' : 'searching'}`}>
                    {b.verificationStatus}
                  </span>
                </td>
                <td><span className="blood-badge">{b.availableUnits} Units</span></td>
                <td>
                  <span className={`status-badge status-badge--${b.accountStatus === 'active' ? 'completed' : 'suspended'}`}>
                    {b.accountStatus}
                  </span>
                </td>
                <td>
                  <div className="blood-bank-actions">
                    <button className="action-btn-status action-btn-status--view" onClick={() => setSelectedBank(b)} title="View Bank Info">
                      <FaEye /> View
                    </button>

                    {b.verificationStatus === 'pending' && (
                      <>
                        <button className="action-btn-status action-btn-status--activate" onClick={() => onVerify(b.id, 'verified')} title="Approve Verification">
                          <FaCheck /> Approve
                        </button>
                        <button className="action-btn-status action-btn-status--suspend" onClick={() => onVerify(b.id, 'rejected')} title="Reject Verification">
                          <FaTimes /> Reject
                        </button>
                      </>
                    )}

                    {b.verificationStatus !== 'pending' && (
                      <button
                        className={`action-btn-status ${b.accountStatus === 'active' ? 'action-btn-status--suspend' : 'action-btn-status--activate'}`}
                        onClick={() => onToggleStatus(b.id)}
                        title={b.accountStatus === 'active' ? 'Deactivate Account' : 'Activate Account'}
                      >
                        {b.accountStatus === 'active' ? <FaBan /> : <FaCheck />} {b.accountStatus === 'active' ? 'Deactivate' : 'Activate'}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filteredBloodBanks.length === 0 && (
              <tr>
                <td colSpan="7" className="table-empty">No blood banks matched criteria.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Detail Modal Component */}
      {selectedBank && (
        <div className="admin-modal-overlay" onClick={() => setSelectedBank(null)}>
          <div className="admin-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <FaRegBuilding className="modal-icon" />
              <h3>Blood Bank Details</h3>
              <button className="modal-close-btn" onClick={() => setSelectedBank(null)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="detail-row"><span>Bank ID:</span><strong>{selectedBank.id}</strong></div>
              <div className="detail-row"><span>Name:</span><strong>{selectedBank.name}</strong></div>
              <div className="detail-row"><span>City/Location:</span><strong>{selectedBank.city}</strong></div>
              <div className="detail-row"><span>Phone Number:</span><strong>{selectedBank.phone}</strong></div>
              <div className="detail-row"><span>Email Address:</span><strong>{selectedBank.email}</strong></div>
              <div className="detail-row"><span>Verification Status:</span><strong>{selectedBank.verificationStatus}</strong></div>
              <div className="detail-row"><span>Available Stock Level:</span><strong>{selectedBank.availableUnits} Units</strong></div>
              <div className="detail-row"><span>Account Status:</span><strong>{selectedBank.accountStatus}</strong></div>
            </div>
            <div className="modal-footer">
              <button className="modal-action-close" onClick={() => setSelectedBank(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default BloodBankManagement
