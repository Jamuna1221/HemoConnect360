import { useMemo, useState } from 'react'
import {
  FaSearch,
  FaFilter,
  FaEye,
  FaFileAlt,
  FaCheck,
  FaTimes,
  FaRedo,
  FaUserCheck,
  FaFilePdf,
  FaFileImage,
  FaFile,
  FaUserCog,
} from 'react-icons/fa'
import StatCard from './common/StatCard'
import AdminModal from './common/AdminModal'
import ConfirmModal from './common/ConfirmModal'
import StateMessage from './common/StateMessage'
import { getDocumentUrl } from '../../../services/adminService'

const VERIFY_TABS = [
  { key: 'donor', label: 'Donor Verification' },
  { key: 'requester', label: 'Requester Verification' },
  { key: 'bloodBank', label: 'Blood Bank Verification' },
  { key: 'documents', label: 'Document Verification' },
]

const REVERIFY_REASONS = [
  'Document unclear',
  'Document expired',
  'Information mismatch',
  'Missing document',
  'Incorrect document',
]

const normalizeStatus = (status) => {
  if (!status) return 'pending'
  const map = {
    PENDING_VERIFICATION: 'pending',
    APPROVED: 'verified',
    VERIFIED: 'verified',
    REJECTED: 'rejected',
  }
  return map[status] || String(status).toLowerCase()
}

const statusClass = (normalized) => {
  const map = {
    pending: 'pending',
    under_review: 'under_review',
    verified: 'verified',
    rejected: 'rejected',
    reverification_required: 'reverify',
  }
  return map[normalized] || 'pending'
}

const StatusBadge = ({ status }) => {
  const normalized = normalizeStatus(status)
  const label = normalized === 'reverification_required' ? 'Re-verification Required' : normalized.replace('_', ' ')
  return <span className={`status-badge status-badge--${statusClass(normalized)}`}>{label}</span>
}

const DocPreview = ({ doc }) => {
  if (!doc || !doc.url) {
    return (
      <div className="doc-preview-state">
        <FaFile className="doc-preview-state-icon" />
        <p>Document preview is not available.</p>
      </div>
    )
  }

  const isImage = /\.(png|jpe?g|gif|webp|bmp)(\?|$)/i.test(doc.url)
  const isPdf = /\.pdf(\?|$)/i.test(doc.url) || doc.type === 'application/pdf'

  if (isImage) {
    return (
      <div className="doc-preview-image-wrap">
        <img src={doc.url} alt="Document preview" className="doc-preview-image" />
      </div>
    )
  }

  if (isPdf) {
    return (
      <div className="doc-preview-pdf">
        <FaFilePdf className="doc-preview-state-icon" />
        <p>This document is a PDF and cannot be rendered inline.</p>
        <a className="doc-preview-open-btn" href={doc.url} target="_blank" rel="noreferrer">
          <FaFileAlt /> Open Document
        </a>
      </div>
    )
  }

  return (
    <div className="doc-preview-state">
      <FaFileImage className="doc-preview-state-icon" />
      <p>This document type cannot be previewed.</p>
      <a className="doc-preview-open-btn" href={doc.url} target="_blank" rel="noreferrer">
        <FaFileAlt /> Open Document
      </a>
    </div>
  )
}

const VerificationCenter = ({
  data,
  loading,
  error,
  onRetry,
  onApprove,
  onReject,
  onReverify,
}) => {
  const [tab, setTab] = useState('donor')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selected, setSelected] = useState(null)
  const [previewDoc, setPreviewDoc] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const [rejecting, setRejecting] = useState(null)
  const [reverifyTarget, setReverifyTarget] = useState(null)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)

  const allRecords = useMemo(() => {
    const donors = (data?.donors || []).map((r) => ({ ...r, type: 'donor', name: r.donorName }))
    const requesters = (data?.requesters || []).map((r) => ({ ...r, type: 'requester', name: r.requesterName }))
    const banks = (data?.bloodBanks || []).map((r) => ({ ...r, type: 'bloodBank', name: r.bankName }))
    return [...donors, ...requesters, ...banks]
  }, [data])

  const summary = useMemo(() => {
    const isToday = (ts) => {
      if (!ts) return false
      return new Date(ts).toDateString() === new Date().toDateString()
    }
    return {
      pending: allRecords.filter((r) => normalizeStatus(r.status) === 'pending').length,
      underReview: allRecords.filter((r) => normalizeStatus(r.status) === 'under_review').length,
      verifiedToday: allRecords.filter((r) => ['verified', 'rejected'].includes(normalizeStatus(r.status)) && isToday(r.verifiedAt)).length,
      rejected: allRecords.filter((r) => normalizeStatus(r.status) === 'rejected').length,
      reverify: allRecords.filter((r) => normalizeStatus(r.status) === 'reverification_required').length,
    }
  }, [allRecords])

  const filtered = useMemo(() => {
    const list = tab === 'documents' ? (data?.documents || []) : allRecords.filter((r) => r.type === tab)
    const term = search.toLowerCase()
    return list.filter((r) => {
      const matchesSearch =
        !term ||
        [r.name, r.email, r.location, r.bloodGroup, r.registrationNumber, r.documentType, r.owner]
          .filter(Boolean)
          .some((field) => String(field).toLowerCase().includes(term))
      const status = normalizeStatus(r.status)
      const matchesStatus = statusFilter === 'all' || status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [tab, search, statusFilter, data, allRecords])

  const openReject = (record) => {
    setReason('')
    setRejecting(record)
  }

  const openReverify = (record) => {
    setReason('')
    setReverifyTarget(record)
  }

  const confirmApprove = async () => {
    if (!confirm) return
    setBusy(true)
    try {
      await onApprove(confirm.type, confirm.id)
      setConfirm(null)
    } finally {
      setBusy(false)
    }
  }

  const submitReject = async () => {
    if (!rejecting) return
    if (!reason.trim()) return
    setBusy(true)
    try {
      await onReject(rejecting.type, rejecting.id, reason.trim())
      setRejecting(null)
    } finally {
      setBusy(false)
    }
  }

  const submitReverify = async () => {
    if (!reverifyTarget) return
    if (!reason.trim()) return
    setBusy(true)
    try {
      await onReverify(reverifyTarget.type, reverifyTarget.id, reason.trim())
      setReverifyTarget(null)
    } finally {
      setBusy(false)
    }
  }

  const openPreview = (record) => {
    const url = getDocumentUrl(record.bucket, record.documentPath || record.documentUrl)
    setPreviewDoc({ url, type: record.documentType, name: record.name })
  }

  if (loading) {
    return <StateMessage type="loading" message="Loading verification records..." />
  }

  if (error) {
    return <StateMessage type="error" message="Unable to load verification records." onRetry={onRetry} />
  }

  return (
    <div className="tab-panel">
      <p className="tab-info-text">Review and verify submitted identity and registration documents.</p>

      <section className="admin-stats-grid">
        <StatCard icon={<FaUserCheck />} label="Pending Verification" value={summary.pending} tone="red" />
        <StatCard icon={<FaEye />} label="Under Review" value={summary.underReview} tone="blue" />
        <StatCard icon={<FaCheck />} label="Verified Today" value={summary.verifiedToday} tone="red" />
        <StatCard icon={<FaTimes />} label="Rejected" value={summary.rejected} tone="blue" />
        <StatCard icon={<FaRedo />} label="Re-verification Required" value={summary.reverify} tone="red" />
      </section>

      <div className="verify-tabs">
        {VERIFY_TABS.map((t) => (
          <button
            key={t.key}
            className={`verify-tab ${tab === t.key ? 'verify-tab--active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="data-toolbar">
        <div className="search-wrap">
          <FaSearch />
          <input
            type="text"
            placeholder="Search by name, email, location, document..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="filter-wrap">
          <FaFilter />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="under_review">Under Review</option>
            <option value="verified">Verified</option>
            <option value="rejected">Rejected</option>
            <option value="reverification_required">Re-verification Required</option>
          </select>
        </div>
      </div>

      <div className="table-responsive">
        <table className="admin-table">
          <thead>
            <tr>
              {tab === 'donor' && (
                <>
                  <th>Donor Name</th>
                  <th>Email</th>
                  <th>Blood Group</th>
                  <th>Location</th>
                  <th>Registration Date</th>
                  <th>Document Type</th>
                  <th>Verification Status</th>
                  <th>Submitted Date</th>
                  <th>Actions</th>
                </>
              )}
              {tab === 'requester' && (
                <>
                  <th>Requester Name</th>
                  <th>Email</th>
                  <th>Location</th>
                  <th>Organization / Hospital</th>
                  <th>Registration Date</th>
                  <th>Verification Status</th>
                  <th>Submitted Date</th>
                  <th>Actions</th>
                </>
              )}
              {tab === 'bloodBank' && (
                <>
                  <th>Blood Bank Name</th>
                  <th>Location</th>
                  <th>Contact</th>
                  <th>Email</th>
                  <th>Registration / License</th>
                  <th>Verification Status</th>
                  <th>Submitted Date</th>
                  <th>Actions</th>
                </>
              )}
              {tab === 'documents' && (
                <>
                  <th>Owner</th>
                  <th>Owner Type</th>
                  <th>Document Type</th>
                  <th>Submitted Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {tab === 'donor' &&
              filtered.map((r) => (
                <tr key={r.id}>
                  <td className="font-semibold">{r.donorName}</td>
                  <td>{r.email || '—'}</td>
                  <td><span className="blood-badge">{r.bloodGroup}</span></td>
                  <td>{r.location}</td>
                  <td>{r.registrationDate || '—'}</td>
                  <td>{r.documentType}</td>
                  <td><StatusBadge status={r.status} /></td>
                  <td>{r.submittedDate || '—'}</td>
                  <td><RecordActions record={r} onView={() => setSelected(r)} onPreview={r.documentUrl ? () => openPreview(r) : null} onApprove={() => setConfirm({ type: 'donor', id: r.id, name: r.donorName })} onReject={() => openReject({ ...r, type: 'donor' })} onReverify={() => openReverify({ ...r, type: 'donor' })} /></td>
                </tr>
              ))}
            {tab === 'requester' &&
              filtered.map((r) => (
                <tr key={r.id}>
                  <td className="font-semibold">{r.requesterName}</td>
                  <td>{r.email || '—'}</td>
                  <td>{r.location}</td>
                  <td>{r.organization || '—'}</td>
                  <td>{r.registrationDate || '—'}</td>
                  <td><StatusBadge status={r.status} /></td>
                  <td>{r.submittedDate || '—'}</td>
                  <td><RecordActions record={r} onView={() => setSelected(r)} onPreview={null} onApprove={() => setConfirm({ type: 'requester', id: r.id, name: r.requesterName })} onReject={() => openReject({ ...r, type: 'requester' })} onReverify={() => openReverify({ ...r, type: 'requester' })} /></td>
                </tr>
              ))}
            {tab === 'bloodBank' &&
              filtered.map((r) => (
                <tr key={r.id}>
                  <td className="font-semibold">{r.bankName}</td>
                  <td>{r.location}</td>
                  <td>{r.contact}</td>
                  <td>{r.email}</td>
                  <td>{r.registrationNumber || '—'}</td>
                  <td><StatusBadge status={r.status} /></td>
                  <td>{r.submittedDate || '—'}</td>
                  <td><RecordActions record={r} onView={() => setSelected(r)} onPreview={(r.licenseDocPath || r.authorizationDocPath) ? () => openPreview({ ...r, bucket: 'blood-bank-docs', documentPath: r.licenseDocPath || r.authorizationDocPath }) : null} onApprove={() => setConfirm({ type: 'blood_bank', id: r.id, name: r.bankName })} onReject={() => openReject({ ...r, type: 'blood_bank' })} onReverify={() => openReverify({ ...r, type: 'blood_bank' })} /></td>
                </tr>
              ))}
            {tab === 'documents' &&
              filtered.map((r) => (
                <tr key={r.id}>
                  <td className="font-semibold">{r.owner}</td>
                  <td>{r.ownerType}</td>
                  <td>{r.documentType}</td>
                  <td>{r.submittedAt || '—'}</td>
                  <td><StatusBadge status={r.status} /></td>
                  <td>
                    <button className="action-btn-status action-btn-status--view" onClick={() => openPreview(r)}>
                      <FaEye /> Preview
                    </button>
                  </td>
                </tr>
              ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan="9" className="table-empty">No records matched the current criteria.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Detail modal */}
      {selected && (
        <AdminModal
          icon={<FaUserCog className="modal-icon" />}
          title={`Verification Details - ${selected.name}`}
          onClose={() => setSelected(null)}
          footer={<button className="modal-action-close" onClick={() => setSelected(null)}>Close</button>}
        >
          <div className="detail-row"><span>Name:</span><strong>{selected.name}</strong></div>
          <div className="detail-row"><span>Email:</span><strong>{selected.email || '—'}</strong></div>
          {selected.bloodGroup && <div className="detail-row"><span>Blood Group:</span><strong>{selected.bloodGroup}</strong></div>}
          <div className="detail-row"><span>Location:</span><strong>{selected.location || '—'}</strong></div>
          {selected.registrationNumber && <div className="detail-row"><span>Registration / License:</span><strong>{selected.registrationNumber}</strong></div>}
          {selected.organization && <div className="detail-row"><span>Organization / Hospital:</span><strong>{selected.organization}</strong></div>}
          <div className="detail-row"><span>Registration Date:</span><strong>{selected.registrationDate || '—'}</strong></div>
          <div className="detail-row"><span>Submitted Date:</span><strong>{selected.submittedDate || '—'}</strong></div>
          {selected.documentType && <div className="detail-row"><span>Document Type:</span><strong>{selected.documentType}</strong></div>}
          <div className="detail-row"><span>Verification Status:</span><StatusBadge status={selected.status} /></div>
          {selected.notes && <div className="detail-row"><span>Admin Notes:</span><strong>{selected.notes}</strong></div>}
        </AdminModal>
      )}

      {/* Approve confirmation */}
      {confirm && (
        <ConfirmModal
          title="Confirm Approval"
          message={`Are you sure you want to approve this verification? (${confirm.name})`}
          confirmLabel="Approve"
          danger={false}
          busy={busy}
          onConfirm={confirmApprove}
          onCancel={() => setConfirm(null)}
        />
      )}

      {/* Reject with required reason */}
      {rejecting && (
        <AdminModal
          icon={<FaTimes className="modal-icon" />}
          title={`Reject Verification - ${rejecting.name}`}
          onClose={() => setRejecting(null)}
          footer={
            <>
              <button className="modal-action-close" onClick={() => setRejecting(null)}>Cancel</button>
              <button className="confirm-action-btn confirm-action-btn--danger" onClick={submitReject} disabled={busy || !reason.trim()}>
                {busy ? 'Rejecting...' : 'Reject'}
              </button>
            </>
          }
        >
          <p className="confirm-modal-message">Rejection reason is required. This will be recorded in the audit log.</p>
          <div className="form-group">
            <label htmlFor="rejectReason">Rejection Reason</label>
            <textarea
              id="rejectReason"
              placeholder="e.g. Document unclear, information mismatch..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
        </AdminModal>
      )}

      {/* Re-verification with required reason */}
      {reverifyTarget && (
        <AdminModal
          icon={<FaRedo className="modal-icon" />}
          title={`Request Re-verification - ${reverifyTarget.name}`}
          onClose={() => setReverifyTarget(null)}
          footer={
            <>
              <button className="modal-action-close" onClick={() => setReverifyTarget(null)}>Cancel</button>
              <button className="confirm-action-btn confirm-action-btn--primary" onClick={submitReverify} disabled={busy || !reason.trim()}>
                {busy ? 'Requesting...' : 'Request Re-verification'}
              </button>
            </>
          }
        >
          <p className="confirm-modal-message">Explain the required correction. The status will be updated to Re-verification Required.</p>
          <div className="reverify-quick-reasons">
            {REVERIFY_REASONS.map((r) => (
              <button
                key={r}
                type="button"
                className={`reverify-quick-reason ${reason === r ? 'reverify-quick-reason--active' : ''}`}
                onClick={() => setReason(r)}
              >
                {r}
              </button>
            ))}
          </div>
          <div className="form-group">
            <label htmlFor="reverifyReason">Reason / Required Correction</label>
            <textarea
              id="reverifyReason"
              placeholder="Describe the required correction..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
        </AdminModal>
      )}

      {/* Document preview */}
      {previewDoc && (
        <AdminModal
          icon={<FaFileAlt className="modal-icon" />}
          title={`Document Preview - ${previewDoc.name || previewDoc.type}`}
          onClose={() => setPreviewDoc(null)}
          width="680px"
          footer={<button className="modal-action-close" onClick={() => setPreviewDoc(null)}>Close</button>}
        >
          <DocPreview doc={previewDoc} />
        </AdminModal>
      )}
    </div>
  )
}

const RecordActions = ({ onView, onPreview, onApprove, onReject, onReverify }) => (
  <div className="verification-actions">
    <button className="action-btn-status action-btn-status--view" onClick={onView} title="View Details">
      <FaEye /> View
    </button>
    {onPreview && (
      <button className="action-btn-status action-btn-status--view" onClick={onPreview} title="Preview Document">
        <FaFileAlt /> Preview
      </button>
    )}
    <button className="action-btn-status action-btn-status--activate" onClick={onApprove} title="Approve">
      <FaCheck /> Approve
    </button>
    <button className="action-btn-status action-btn-status--suspend" onClick={onReject} title="Reject">
      <FaTimes /> Reject
    </button>
    <button className="action-btn-status action-btn-status--reverify" onClick={onReverify} title="Request Re-verification">
      <FaRedo /> Re-verify
    </button>
  </div>
)

export default VerificationCenter
