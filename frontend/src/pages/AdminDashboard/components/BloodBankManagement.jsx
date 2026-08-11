import { useState } from 'react'
import { createPortal } from 'react-dom'
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
      {selectedBank && createPortal(
        <div className="admin-modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99999, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)' }} onClick={() => setSelectedBank(null)}>
          <div className="admin-modal-card" style={{ maxWidth: '600px', width: '95%', maxHeight: '85vh', display: 'flex', flexDirection: 'column', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', margin: 0, background: '#ffffff', borderRadius: '20px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <FaRegBuilding className="modal-icon" />
              <h3>Blood Bank Details</h3>
              <button className="modal-close-btn" onClick={() => setSelectedBank(null)}>&times;</button>
            </div>
            <div className="modal-body" style={{ flex: 1, overflowY: 'auto', paddingRight: '6px' }}>
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#e53935', fontSize: '0.95rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '4px' }}>General Information</h4>
                <div className="detail-row"><span>Bank ID:</span><strong>{selectedBank.id}</strong></div>
                <div className="detail-row"><span>Name:</span><strong>{selectedBank.name}</strong></div>
                <div className="detail-row"><span>Registration No:</span><strong>{selectedBank.registration_number || 'N/A'}</strong></div>
                <div className="detail-row"><span>Type:</span><strong>{selectedBank.blood_bank_type || 'N/A'}</strong></div>
                <div className="detail-row"><span>Established:</span><strong>{selectedBank.established_year || 'N/A'}</strong></div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#e53935', fontSize: '0.95rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '4px' }}>Contact Information</h4>
                <div className="detail-row"><span>Official Email:</span><strong>{selectedBank.email}</strong></div>
                <div className="detail-row"><span>Primary Phone:</span><strong>{selectedBank.phone}</strong></div>
                <div className="detail-row"><span>Alternate Phone:</span><strong>{selectedBank.alternate_phone || 'N/A'}</strong></div>
                <div className="detail-row"><span>Address:</span><strong>{selectedBank.address_line || 'N/A'}</strong></div>
                <div className="detail-row"><span>City:</span><strong>{selectedBank.city}</strong></div>
                <div className="detail-row"><span>State/Pincode:</span><strong>{selectedBank.state || 'N/A'} - {selectedBank.pincode || 'N/A'}</strong></div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#e53935', fontSize: '0.95rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '4px' }}>Authorized Representative</h4>
                <div className="detail-row"><span>Name:</span><strong>{selectedBank.authorized_person_name || 'N/A'}</strong></div>
                <div className="detail-row"><span>Designation:</span><strong>{selectedBank.designation || 'N/A'}</strong></div>
                <div className="detail-row"><span>Contact Phone:</span><strong>{selectedBank.authorized_person_phone || 'N/A'}</strong></div>
                <div className="detail-row"><span>Contact Email:</span><strong>{selectedBank.authorized_person_email || 'N/A'}</strong></div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#e53935', fontSize: '0.95rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '4px' }}>Status & Inventory</h4>
                <div className="detail-row"><span>Verification Status:</span><strong>{selectedBank.verificationStatus}</strong></div>
                <div className="detail-row"><span>Account Status:</span><strong>{selectedBank.accountStatus}</strong></div>
                <div className="detail-row"><span>Total Stock:</span><strong>{selectedBank.availableUnits} Units</strong></div>
              </div>

              <div>
                <h4 style={{ margin: '0 0 8px 0', color: '#e53935', fontSize: '0.95rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '4px' }}>Documents</h4>
                <div className="detail-row">
                  <span>License Certificate:</span>
                  <strong>
                    {selectedBank.licenseUrl ? (
                      <a href={selectedBank.licenseUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', textDecoration: 'underline' }}>View License Document</a>
                    ) : 'Not Provided'}
                  </strong>
                </div>
                <div className="detail-row">
                  <span>Partner Authorization:</span>
                  <strong>
                    {selectedBank.authorizationUrl ? (
                      <a href={selectedBank.authorizationUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', textDecoration: 'underline' }}>View Authorization Document</a>
                    ) : 'Not Provided'}
                  </strong>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="modal-action-close" onClick={() => setSelectedBank(null)}>Close</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

export default BloodBankManagement
