import { FaExclamationTriangle, FaCheckCircle } from 'react-icons/fa'

const SecurityPanel = ({ alerts, onResolve }) => {
  return (
    <div className="tab-panel">
      <p className="tab-info-text">Security triggers identifying potential duplicate requests or abnormal platform interactions.</p>
      <div className="table-responsive">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Threat/Alert Type</th>
              <th>Target User</th>
              <th>Description details</th>
              <th>Risk Factor</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {alerts.map(s => (
              <tr key={s.id}>
                <td className="font-semibold text-danger"><FaExclamationTriangle /> {s.type}</td>
                <td>{s.user}</td>
                <td>{s.detail}</td>
                <td><span className={`risk-badge risk-badge--${s.riskScore.toLowerCase()}`}>{s.riskScore}</span></td>
                <td>
                  {s.status === 'unresolved' ? (
                    <button className="action-btn-resolve" onClick={() => onResolve(s.id)}>Resolve Alert</button>
                  ) : (
                    <span className="text-resolved"><FaCheckCircle /> Resolved</span>
                  )}
                </td>
              </tr>
            ))}
            {alerts.length === 0 && (
              <tr>
                <td colSpan="5" className="table-empty">No security alerts logged.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default SecurityPanel
