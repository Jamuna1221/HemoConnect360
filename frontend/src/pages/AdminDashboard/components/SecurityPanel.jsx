import { useMemo, useState } from 'react'
import {
  FaSearch,
  FaFilter,
  FaEye,
  FaExclamationTriangle,
  FaExclamationCircle,
  FaShieldAlt,
  FaUserLock,
  FaCheckCircle,
} from 'react-icons/fa'
import StatCard from './common/StatCard'
import AdminModal from './common/AdminModal'
import ConfirmModal from './common/ConfirmModal'
import StateMessage from './common/StateMessage'

const SEVERITY_ORDER = { critical: 4, high: 3, medium: 2, low: 1 }
const SEVERITY_CLASS = {
  critical: 'risk-badge--critical',
  high: 'risk-badge--high',
  medium: 'risk-badge--medium',
  low: 'risk-badge--low',
}

const normalizeSeverity = (s) => {
  const map = { CRITICAL: 'critical', HIGH: 'high', MEDIUM: 'medium', LOW: 'low' }
  return map[s] || String(s || 'medium').toLowerCase()
}

const normalizeFlagStatus = (s) => {
  const map = { FLAGGED: 'pending', PENDING: 'pending', REVIEWED: 'reviewed', UNDER_REVIEW: 'reviewed', ACTION_TAKEN: 'action_taken', RESOLVED: 'resolved', DISMISSED: 'dismissed' }
  return map[s] || String(s || 'pending').toLowerCase()
}

const severityLabel = (s) => s.charAt(0).toUpperCase() + s.slice(1)

const field = (obj, ...keys) => {
  for (const key of keys) {
    if (obj?.[key] != null && obj[key] !== '') return obj[key]
  }
  return null
}

const SecurityPanel = ({ data, loading, error, onRetry, onAction }) => {
  const [search, setSearch] = useState('')
  const [severityFilter, setSeverityFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [selected, setSelected] = useState(null)
  const [confirmAction, setConfirmAction] = useState(null)
  const [busy, setBusy] = useState(false)

  const flags = useMemo(() => data?.flags || [], [data])

  const summary = useMemo(() => ({
    critical: flags.filter((f) => normalizeSeverity(field(f, 'severity', 'riskLevel')) === 'critical').length,
    high: flags.filter((f) => normalizeSeverity(field(f, 'severity', 'riskLevel')) === 'high').length,
    medium: flags.filter((f) => normalizeSeverity(field(f, 'severity', 'riskLevel')) === 'medium').length,
    low: flags.filter((f) => normalizeSeverity(field(f, 'severity', 'riskLevel')) === 'low').length,
    actionsTaken: flags.filter((f) => normalizeFlagStatus(field(f, 'status')) === 'action_taken').length,
  }), [flags])

  const filtered = useMemo(() => {
    const term = search.toLowerCase()
    return flags
      .filter((f) => {
        const userName = field(f, 'userName', 'user')
        const email = field(f, 'email')
        const matchesSearch =
          !term || [userName, email].filter(Boolean).some((value) => String(value).toLowerCase().includes(term))
        const matchesSeverity = severityFilter === 'all' || normalizeSeverity(field(f, 'severity', 'riskLevel')) === severityFilter
        const matchesType = typeFilter === 'all' || field(f, 'userType', 'user_type') === typeFilter
        return matchesSearch && matchesSeverity && matchesType
      })
      .sort((a, b) => (SEVERITY_ORDER[normalizeSeverity(field(b, 'severity', 'riskLevel'))] || 0) - (SEVERITY_ORDER[normalizeSeverity(field(a, 'severity', 'riskLevel'))] || 0))
  }, [flags, search, severityFilter, typeFilter])

  const runAction = async () => {
    if (!confirmAction) return
    setBusy(true)
    try {
      await onAction(confirmAction.type, confirmAction.id, confirmAction.action)
      setConfirmAction(null)
    } finally {
      setBusy(false)
    }
  }

  const actionMeta = confirmAction
    ? {
        warn: { label: 'Send Warning', cls: 'confirm-action-btn--warning', desc: 'Send a warning to this account. A record will be kept in the audit log.' },
        suspend: { label: 'Suspend Account', cls: 'confirm-action-btn--warning', desc: 'Temporarily suspend this account. The user will not be able to log in.' },
        block: { label: 'Block Account', cls: 'confirm-action-btn--danger', desc: 'Permanently block this account. This action is irreversible.' },
        dismiss: { label: 'Dismiss Flag', cls: 'confirm-action-btn--neutral', desc: 'Dismiss this flag as false positive. It will be removed from active review.' },
        resolve: { label: 'Resolve Flag', cls: 'confirm-action-btn--primary', desc: 'Mark this flag as resolved after action has been taken.' },
      }[confirmAction.action] || null
    : null

  if (loading) {
    return <StateMessage type="loading" message="Loading security flags..." />
  }

  if (error) {
    return <StateMessage type="error" message="Unable to load security flags." onRetry={onRetry} />
  }

  return (
    <div className="tab-panel">
      <p className="tab-info-text">Monitor suspicious activity and take action on flagged accounts.</p>

      <section className="admin-stats-grid">
        <StatCard icon={<FaExclamationCircle />} label="Critical Flags" value={summary.critical} tone="red" />
        <StatCard icon={<FaExclamationTriangle />} label="High Risk" value={summary.high} tone="blue" />
        <StatCard icon={<FaShieldAlt />} label="Medium Risk" value={summary.medium} tone="blue" />
        <StatCard icon={<FaShieldAlt />} label="Low Risk" value={summary.low} tone="blue" />
        <StatCard icon={<FaCheckCircle />} label="Actions Taken" value={summary.actionsTaken} tone="red" />
      </section>

      <div className="data-toolbar">
        <div className="search-wrap">
          <FaSearch />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="filter-wrap">
          <FaFilter />
          <select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)}>
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
        <div className="filter-wrap">
          <FaUserLock />
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="all">All Account Types</option>
            <option value="donor">Donor</option>
            <option value="requester">Requester</option>
            <option value="blood_bank">Blood Bank</option>
          </select>
        </div>
      </div>

      <div className="table-responsive">
        <table className="admin-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Account Type</th>
              <th>Email</th>
              <th>Severity</th>
              <th>Reason</th>
              <th>Detected At</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((f) => {
              const severity = normalizeSeverity(field(f, 'severity', 'riskLevel'))
              const flagStatus = normalizeFlagStatus(field(f, 'status'))
              const userType = field(f, 'userType', 'user_type') || 'donor'
              return (
                <tr key={f.id}>
                  <td className="font-semibold">{field(f, 'userName', 'user')}</td>
                  <td>{String(userType).replace('_', ' ')}</td>
                  <td>{field(f, 'email') || '—'}</td>
                  <td>
                    <span className={`risk-badge ${SEVERITY_CLASS[severity]}`}>{severityLabel(severity)}</span>
                  </td>
                  <td className="security-reason-cell">{field(f, 'reason', 'reasonFlagged') || '—'}</td>
                  <td>{field(f, 'detectedAt', 'createdAt') || '—'}</td>
                  <td>
                    <span className={`status-badge status-badge--${flagStatus === 'action_taken' ? 'verified' : flagStatus === 'pending' ? 'pending' : flagStatus === 'reviewed' || flagStatus === 'resolved' ? 'under_review' : 'rejected'}`}>
                      {flagStatus.replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    <div className="verification-actions">
                      <button className="action-btn-status action-btn-status--view" onClick={() => setSelected(f)} title="Review Details">
                        <FaEye /> Review
                      </button>
                      {flagStatus === 'pending' && (
                        <>
                          <button className="action-btn-status action-btn-status--reverify" onClick={() => setConfirmAction({ type: userType, id: f.id, action: 'warn' })}>
                            Warn
                          </button>
                          <button className="action-btn-status action-btn-status--suspend" onClick={() => setConfirmAction({ type: userType, id: f.id, action: 'suspend' })}>
                            Suspend
                          </button>
                          <button className="action-btn-status action-btn-status--suspend" onClick={() => setConfirmAction({ type: userType, id: f.id, action: 'block' })}>
                            Block
                          </button>
                          <button className="action-btn-status action-btn-status--view" onClick={() => setConfirmAction({ type: userType, id: f.id, action: 'dismiss' })}>
                            Dismiss
                          </button>
                        </>
                      )}
                      {flagStatus === 'reviewed' && (
                        <>
                          <button className="action-btn-status action-btn-status--suspend" onClick={() => setConfirmAction({ type: userType, id: f.id, action: 'suspend' })}>
                            Suspend
                          </button>
                          <button className="action-btn-status action-btn-status--suspend" onClick={() => setConfirmAction({ type: userType, id: f.id, action: 'block' })}>
                            Block
                          </button>
                          <button className="action-btn-status action-btn-status--activate" onClick={() => setConfirmAction({ type: userType, id: f.id, action: 'resolve' })}>
                            Resolve
                          </button>
                        </>
                      )}
                      {flagStatus === 'action_taken' && (
                        <button className="action-btn-status action-btn-status--activate" onClick={() => setConfirmAction({ type: userType, id: f.id, action: 'resolve' })}>
                          Resolve
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan="8" className="table-empty">
                  {flags.length === 0 ? 'No suspicious activity has been flagged.' : 'No security flags matched the current criteria.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Review details modal */}
      {selected && (
        <AdminModal
          icon={<FaShieldAlt className="modal-icon" />}
          title="Security Flag Details"
          onClose={() => setSelected(null)}
          footer={<button className="modal-action-close" onClick={() => setSelected(null)}>Close</button>}
        >
          <div className="detail-row"><span>User:</span><strong>{field(selected, 'userName', 'user')}</strong></div>
          <div className="detail-row"><span>Account Type:</span><strong>{String(field(selected, 'userType', 'user_type') || 'donor').replace('_', ' ')}</strong></div>
          <div className="detail-row"><span>Email:</span><strong>{field(selected, 'email') || '—'}</strong></div>
          <div className="detail-row">
            <span>Severity:</span>
            <span className={`risk-badge ${SEVERITY_CLASS[normalizeSeverity(field(selected, 'severity', 'riskLevel'))]}`}>{severityLabel(normalizeSeverity(field(selected, 'severity', 'riskLevel')))}</span>
          </div>
          <div className="detail-row"><span>Reason:</span><strong>{field(selected, 'reason', 'reasonFlagged') || '—'}</strong></div>
          <div className="detail-row"><span>Details:</span><strong>{field(selected, 'details') || '—'}</strong></div>
          <div className="detail-row"><span>Detected At:</span><strong>{field(selected, 'detectedAt', 'createdAt') || '—'}</strong></div>
          <div className="detail-row"><span>Status:</span><strong>{normalizeFlagStatus(field(selected, 'status')).replace('_', ' ')}</strong></div>
        </AdminModal>
      )}

      {/* Confirm action modal */}
      {confirmAction && actionMeta && (
        <ConfirmModal
          title={actionMeta.label}
          message={actionMeta.desc}
          confirmLabel={actionMeta.label}
          danger={confirmAction.action === 'block'}
          busy={busy}
          onConfirm={runAction}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </div>
  )
}

export default SecurityPanel
