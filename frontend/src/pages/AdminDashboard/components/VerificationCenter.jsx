import { FaCheck, FaTimes } from 'react-icons/fa'

const VerificationCenter = ({ verifications, onVerify }) => {
  return (
    <div className="tab-panel">
      <p className="tab-info-text">Review and verify identification proof documents submitted by registered donors.</p>
      <div className="table-responsive">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Donor Name</th>
              <th>Document Type</th>
              <th>Document Preview</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {verifications.map(v => (
              <tr key={v.id}>
                <td className="font-semibold">{v.donorName}</td>
                <td>{v.docType}</td>
                <td><a href={v.fileUrl} target="_blank" rel="noreferrer" className="doc-link-preview">View Document Link</a></td>
                <td>
                  <div className="verification-actions">
                    <button className="action-btn-verify action-btn-verify--approve" onClick={() => onVerify(v.id, true)}>
                      <FaCheck /> Approve
                    </button>
                    <button className="action-btn-verify action-btn-verify--reject" onClick={() => onVerify(v.id, false)}>
                      <FaTimes /> Reject
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {verifications.length === 0 && (
              <tr>
                <td colSpan="4" className="table-empty">All donor documents verified! No pending items.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default VerificationCenter
