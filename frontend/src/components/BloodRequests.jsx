import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FaSearch,
  FaTimes,
  FaCheckCircle,
  FaExclamationTriangle,
  FaClipboardList,
  FaEye,
  FaPhoneAlt,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaUser,
  FaHospital,
  FaChevronLeft,
  FaChevronRight,
  FaClipboardCheck,
} from 'react-icons/fa'
import {
  fetchBloodBankRequests,
  fetchBloodBankRequestDetails,
  acceptBloodRequest,
  rejectBloodRequest,
  completeBloodRequest,
  fetchBloodBankInventory,
  BLOOD_GROUPS,
} from '../services/bloodBankService'
import './BloodRequests.css'

const STATUS_META = {
  submitted: { label: 'Submitted', className: 'bloodreq-status--submitted' },
  notified: { label: 'Donors Notified', className: 'bloodreq-status--notified' },
  searching_donors: { label: 'Searching', className: 'bloodreq-status--searching' },
  accepted: { label: 'Donor Accepted', className: 'bloodreq-status--accepted' },
  approved: { label: 'Approved', className: 'bloodreq-status--approved' },
  rejected: { label: 'Rejected', className: 'bloodreq-status--rejected' },
  completed: { label: 'Completed', className: 'bloodreq-status--completed' },
  cancelled: { label: 'Cancelled', className: 'bloodreq-status--cancelled' },
  fulfilled: { label: 'Fulfilled', className: 'bloodreq-status--fulfilled' },
}

const PRIORITY_META = {
  critical: { label: 'Critical', className: 'bloodreq-priority--critical' },
  urgent: { label: 'Urgent', className: 'bloodreq-priority--urgent' },
  standard: { label: 'Standard', className: 'bloodreq-priority--standard' },
}

const STATUS_TABS = [
  { value: 'all', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'completed', label: 'Completed' },
]

const ACTIONS = {
  ACCEPTED: { label: 'Accepted', className: 'bloodreq-action--accepted' },
  REJECTED: { label: 'Rejected', className: 'bloodreq-action--rejected' },
  COMPLETED: { label: 'Completed', className: 'bloodreq-action--completed' },
}

const isOpenStatus = (status) =>
  ['submitted', 'notified', 'searching_donors', 'accepted'].includes(status)

const formatDate = (value) => {
  if (!value) return '—'
  return new Date(value).toLocaleDateString()
}

const formatDateTime = (value) => {
  if (!value) return '—'
  return new Date(value).toLocaleString()
}

const BloodRequests = ({ onInventoryChanged }) => {
  const navigate = useNavigate()

  const [requests, setRequests] = useState([])
  const [stats, setStats] = useState({ open: 0, approved: 0, rejected: 0, completed: 0, total: 0 })
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [inventoryByGroup, setInventoryByGroup] = useState({})

  const [status, setStatus] = useState('open')
  const [bloodGroup, setBloodGroup] = useState('')
  const [priority, setPriority] = useState('')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  const [detail, setDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailActions, setDetailActions] = useState([])
  const [acceptTarget, setAcceptTarget] = useState(null)
  const [rejectTarget, setRejectTarget] = useState(null)
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [modalError, setModalError] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 350)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    let active = true

    const load = async () => {
      try {
        const data = await fetchBloodBankRequests({
          status,
          bloodGroup,
          priority,
          search: debouncedSearch,
          page,
          limit,
        })
        if (!active) return
        setRequests(data.requests || [])
        setStats(data.stats || { open: 0, approved: 0, rejected: 0, completed: 0, total: 0 })
        setTotal(data.total || 0)
      } catch (err) {
        if (!active) return
        if (err.status === 401) {
          navigate('/blood-bank/login', { replace: true })
          return
        }
        setError(err.message || 'Unable to load blood requests.')
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [navigate, reloadKey, status, bloodGroup, priority, debouncedSearch, page, limit])

  useEffect(() => {
    let active = true

    const loadInventory = async () => {
      try {
        const { inventory } = await fetchBloodBankInventory()
        if (!active) return
        const byGroup = Object.fromEntries(inventory.map((item) => [item.bloodGroup, item.unitsAvailable]))
        setInventoryByGroup(byGroup)
      } catch {
        if (active) setInventoryByGroup({})
      }
    }

    loadInventory()
    return () => {
      active = false
    }
  }, [reloadKey])

  const statsCards = useMemo(
    () => [
      { key: 'open', label: 'Open Requests', value: stats.open, className: 'bloodreq-stat--open' },
      { key: 'approved', label: 'Approved', value: stats.approved, className: 'bloodreq-stat--approved' },
      { key: 'rejected', label: 'Rejected', value: stats.rejected, className: 'bloodreq-stat--rejected' },
      { key: 'completed', label: 'Completed', value: stats.completed, className: 'bloodreq-stat--completed' },
    ],
    [stats]
  )

  const retry = () => {
    setLoading(true)
    setError('')
    setSuccess('')
    setReloadKey((key) => key + 1)
  }

  const totalPages = Math.max(1, Math.ceil(total / limit))

  const openDetail = async (id) => {
    setDetailLoading(true)
    setDetail(null)
    setError('')
    try {
      const data = await fetchBloodBankRequestDetails(id)
      setDetail(data.request)
      setDetailActions(data.actions || [])
    } catch (err) {
      setError(err.message || 'Unable to load request details.')
    } finally {
      setDetailLoading(false)
    }
  }

  const openAccept = (request) => {
    setAcceptTarget(request)
    setModalError('')
  }

  const openReject = (request) => {
    setRejectTarget(request)
    setReason('')
    setModalError('')
  }

  const closeModals = () => {
    if (submitting) return
    setAcceptTarget(null)
    setRejectTarget(null)
  }

  const handleAccept = async () => {
    if (!acceptTarget) return
    setSubmitting(true)
    setModalError('')
    try {
      await acceptBloodRequest(acceptTarget.id)
      setSuccess(`${acceptTarget.patientName} (${acceptTarget.bloodGroup}) request accepted. Stock deducted.`)
      setAcceptTarget(null)
      setReloadKey((key) => key + 1)
      if (onInventoryChanged) onInventoryChanged()
    } catch (err) {
      setModalError(err.message || 'Unable to accept this request.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleReject = async () => {
    if (!rejectTarget) return
    const trimmed = reason.trim()
    if (trimmed.length < 3) {
      setModalError('Please provide a reason (at least 3 characters).')
      return
    }
    setSubmitting(true)
    setModalError('')
    try {
      await rejectBloodRequest(rejectTarget.id, { reason: trimmed })
      setSuccess(`${rejectTarget.patientName} (${rejectTarget.bloodGroup}) request rejected.`)
      setRejectTarget(null)
      setReloadKey((key) => key + 1)
    } catch (err) {
      setModalError(err.message || 'Unable to reject this request.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleComplete = async (request) => {
    setSubmitting(true)
    setModalError('')
    try {
      await completeBloodRequest(request.id)
      setSuccess(`${request.patientName} (${request.bloodGroup}) request marked as completed.`)
      setReloadKey((key) => key + 1)
    } catch (err) {
      setError(err.message || 'Unable to complete this request.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <section className="bloodreq">
        <div className="bloodreq-loading">
          <div className="bloodbank-dash-spinner" />
          <p>Loading blood requests...</p>
        </div>
      </section>
    )
  }

  if (error && requests.length === 0 && !detailLoading) {
    return (
      <section className="bloodreq">
        <div className="bloodreq-error">
          <FaExclamationTriangle />
          <div>
            <h3>Unable to Load Requests</h3>
            <p>{error}</p>
          </div>
          <button type="button" className="bloodreq-retry" onClick={retry}>Retry</button>
        </div>
      </section>
    )
  }

  return (
    <section className="bloodreq" id="requests">
      <div className="bloodreq-head">
        <div>
          <span className="bloodbank-dash-eyebrow">Blood Request Management</span>
          <h2>Blood Requests</h2>
          <p>Real requests from the platform. Accepting deducts stock from your inventory atomically.</p>
        </div>
        <div className="bloodreq-head-total">
          <div className="bloodreq-head-total-icon"><FaClipboardList /></div>
          <div>
            <span>Total Requests</span>
            <strong>{stats.total}</strong>
          </div>
        </div>
      </div>

      <div className="bloodreq-stats">
        {statsCards.map(({ key, label, value, className }) => (
          <div className={`bloodreq-stat ${className}`} key={key}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>

      <div className="bloodreq-filters">
        <div className="bloodreq-tabs">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              className={status === tab.value ? 'bloodreq-tab bloodreq-tab--active' : 'bloodreq-tab'}
              onClick={() => { setStatus(tab.value); setPage(1) }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="bloodreq-filter-controls">
          <div className="bloodreq-search">
            <FaSearch />
            <input
              type="search"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search patient, hospital, city..."
              aria-label="Search requests"
            />
          </div>
          <select value={bloodGroup} onChange={(e) => { setBloodGroup(e.target.value); setPage(1) }} aria-label="Filter by blood group">
            <option value="">All blood groups</option>
            {BLOOD_GROUPS.map((group) => <option key={group} value={group}>{group}</option>)}
          </select>
          <select value={priority} onChange={(e) => { setPriority(e.target.value); setPage(1) }} aria-label="Filter by priority">
            <option value="">All priorities</option>
            <option value="critical">Critical</option>
            <option value="urgent">Urgent</option>
            <option value="standard">Standard</option>
          </select>
        </div>
      </div>

      {success && (
        <div className="bloodreq-success">
          <FaCheckCircle /> {success}
        </div>
      )}

      {requests.length === 0 ? (
        <div className="bloodreq-empty">
          <FaClipboardList />
          <p>No blood requests match these filters.</p>
        </div>
      ) : (
        <>
          <div className="bloodreq-grid">
            {requests.map((req) => {
              const statusMeta = STATUS_META[req.status] || STATUS_META.submitted
              const priorityMeta = PRIORITY_META[req.priority] || PRIORITY_META.standard
              const open = isOpenStatus(req.status)
              return (
                <article className="bloodreq-card" key={req.id}>
                  <div className="bloodreq-card-top">
                    <div className="bloodreq-card-patient">
                      <div className="bloodreq-avatar"><FaUser /></div>
                      <div>
                        <h3>{req.patientName}</h3>
                        <span>{req.patientAge} yrs · {req.patientGender}</span>
                      </div>
                    </div>
                    <span className={`bloodreq-status ${statusMeta.className}`}>{statusMeta.label}</span>
                  </div>

                  <div className="bloodreq-card-body">
                    <div className="bloodreq-group-row">
                      <span className="bloodreq-group">{req.bloodGroup}</span>
                      <span className="bloodreq-units">{req.units} unit{req.units > 1 ? 's' : ''}</span>
                      <span className={`bloodreq-priority ${priorityMeta.className}`}>{priorityMeta.label}</span>
                    </div>

                    <div className="bloodreq-meta">
                      <span><FaHospital /> {req.hospitalName}</span>
                      <span><FaMapMarkerAlt /> {req.city}</span>
                      <span><FaCalendarAlt /> {formatDate(req.requiredBy)}</span>
                      {req.distanceKm != null && <span className="bloodreq-distance">{req.distanceKm} km away</span>}
                    </div>
                  </div>

                  <div className="bloodreq-card-actions">
                    <button type="button" className="bloodreq-btn bloodreq-btn--ghost" onClick={() => openDetail(req.id)}>
                      <FaEye /> Details
                    </button>
                    {open && (
                      <>
                        <button type="button" className="bloodreq-btn bloodreq-btn--accept" onClick={() => openAccept(req)}>
                          <FaCheckCircle /> Accept
                        </button>
                        <button type="button" className="bloodreq-btn bloodreq-btn--reject" onClick={() => openReject(req)}>
                          <FaTimes /> Reject
                        </button>
                      </>
                    )}
                    {req.status === 'approved' && (
                      <button
                        type="button"
                        className="bloodreq-btn bloodreq-btn--complete"
                        onClick={() => handleComplete(req)}
                        disabled={submitting}
                      >
                        <FaClipboardCheck /> Mark Completed
                      </button>
                    )}
                  </div>
                </article>
              )
            })}
          </div>

          {totalPages > 1 && (
            <div className="bloodreq-pagination">
              <button
                type="button"
                className="bloodreq-page-btn"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <FaChevronLeft /> Prev
              </button>
              <span>Page {page} of {totalPages} · {total} requests</span>
              <button
                type="button"
                className="bloodreq-page-btn"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next <FaChevronRight />
              </button>
            </div>
          )}
        </>
      )}

      {detailLoading && (
        <div className="bloodreq-modal-overlay">
          <div className="bloodreq-modal">
            <div className="bloodreq-loading"><div className="bloodbank-dash-spinner" /><p>Loading details...</p></div>
          </div>
        </div>
      )}

      {detail && (
        <div className="bloodreq-modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) setDetail(null) }}>
          <div className="bloodreq-modal bloodreq-modal--wide" role="dialog" aria-modal="true">
            <div className="bloodreq-modal-head">
              <h3>Request Details</h3>
              <button type="button" className="bloodreq-modal-close" onClick={() => setDetail(null)} aria-label="Close"><FaTimes /></button>
            </div>

            <div className="bloodreq-detail-top">
              <span className="bloodreq-detail-group">{detail.bloodGroup}</span>
              <div>
                <h4>{detail.patientName}</h4>
                <p>{detail.patientAge} yrs · {detail.patientGender}</p>
              </div>
              <span className={`bloodreq-status ${(STATUS_META[detail.status] || STATUS_META.submitted).className}`}>
                {(STATUS_META[detail.status] || STATUS_META.submitted).label}
              </span>
            </div>

            <dl className="bloodreq-detail-list">
              <div><dt>Units Required</dt><dd>{detail.units}</dd></div>
              <div><dt>Priority</dt><dd>{(PRIORITY_META[detail.priority] || PRIORITY_META.standard).label}</dd></div>
              <div><dt>Hospital</dt><dd><FaHospital /> {detail.hospitalName}</dd></div>
              <div><dt>City</dt><dd><FaMapMarkerAlt /> {detail.city}</dd></div>
              <div><dt>Address</dt><dd>{detail.address || '—'}</dd></div>
              <div><dt>Required By</dt><dd><FaCalendarAlt /> {formatDate(detail.requiredBy)}</dd></div>
              <div><dt>Contact</dt><dd><FaUser /> {detail.contactName}</dd></div>
              <div><dt>Phone</dt><dd><FaPhoneAlt /> {detail.contactPhone}</dd></div>
              {detail.contactEmail && <div><dt>Email</dt><dd>{detail.contactEmail}</dd></div>}
              {detail.notes && <div><dt>Notes</dt><dd>{detail.notes}</dd></div>}
              <div><dt>Requested On</dt><dd>{formatDateTime(detail.createdAt)}</dd></div>
              {detail.rejectionReason && <div><dt>Rejection Reason</dt><dd>{detail.rejectionReason}</dd></div>}
            </dl>

            {detailActions.length > 0 && (
              <div className="bloodreq-detail-actions">
                <div className="bloodbank-dash-card-title"><FaClipboardCheck /> Bank Action Trail</div>
                <ul>
                  {detailActions.map((action) => (
                    <li key={action.id}>
                      <span className={`bloodreq-action ${ACTIONS[action.action]?.className || ''}`}>
                        {ACTIONS[action.action]?.label || action.action}
                      </span>
                      {action.units != null && <strong>{action.units} unit(s)</strong>}
                      {action.reason && <span>{action.reason}</span>}
                      <time>{formatDateTime(action.createdAt)}</time>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="bloodreq-modal-actions">
              <button type="button" className="bloodreq-cancel" onClick={() => setDetail(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {acceptTarget && (
        <div className="bloodreq-modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) closeModals() }}>
          <div className="bloodreq-modal" role="dialog" aria-modal="true">
            <div className="bloodreq-modal-head">
              <h3>Accept Blood Request</h3>
              <button type="button" className="bloodreq-modal-close" onClick={closeModals} aria-label="Close"><FaTimes /></button>
            </div>

            <div className="bloodreq-accept-info">
              <span className="bloodreq-group">{acceptTarget.bloodGroup}</span>
              <p>
                This will deduct <strong>{acceptTarget.units} unit{acceptTarget.units > 1 ? 's' : ''}</strong> of{' '}
                <strong>{acceptTarget.bloodGroup}</strong> from your inventory for patient{' '}
                <strong>{acceptTarget.patientName}</strong>.
              </p>
            </div>

            <div className="bloodreq-stock-check">
              <span>Current {acceptTarget.bloodGroup} stock</span>
              <strong className={(inventoryByGroup[acceptTarget.bloodGroup] ?? 0) >= acceptTarget.units ? 'bloodreq-stock-ok' : 'bloodreq-stock-low'}>
                {inventoryByGroup[acceptTarget.bloodGroup] ?? 0} units
              </strong>
            </div>

            {(inventoryByGroup[acceptTarget.bloodGroup] ?? 0) < acceptTarget.units && (
              <div className="bloodreq-form-error">
                <FaExclamationTriangle /> Not enough stock for this request. Add units first.
              </div>
            )}

            {modalError && (
              <div className="bloodreq-form-error">
                <FaExclamationTriangle /> {modalError}
              </div>
            )}

            <div className="bloodreq-modal-actions">
              <button type="button" className="bloodreq-cancel" onClick={closeModals}>Cancel</button>
              <button
                type="button"
                className="bloodreq-submit"
                onClick={handleAccept}
                disabled={submitting}
              >
                {submitting ? 'Accepting...' : 'Accept Request'}
              </button>
            </div>
          </div>
        </div>
      )}

      {rejectTarget && (
        <div className="bloodreq-modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) closeModals() }}>
          <div className="bloodreq-modal" role="dialog" aria-modal="true">
            <div className="bloodreq-modal-head">
              <h3>Reject Blood Request</h3>
              <button type="button" className="bloodreq-modal-close" onClick={closeModals} aria-label="Close"><FaTimes /></button>
            </div>

            <p className="bloodreq-reject-intro">
              Rejecting the request for <strong>{rejectTarget.patientName}</strong> ({rejectTarget.bloodGroup}) will
              notify the requester. No stock is changed.
            </p>

            <div className="bloodreq-modal-field">
              <label htmlFor="reject-reason">Reason for rejection</label>
              <textarea
                id="reject-reason"
                rows="4"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Insufficient stock for this group, expired units, out of service area..."
                required
              />
            </div>

            {modalError && (
              <div className="bloodreq-form-error">
                <FaExclamationTriangle /> {modalError}
              </div>
            )}

            <div className="bloodreq-modal-actions">
              <button type="button" className="bloodreq-cancel" onClick={closeModals}>Cancel</button>
              <button
                type="button"
                className="bloodreq-submit bloodreq-submit--reject"
                onClick={handleReject}
                disabled={submitting}
              >
                {submitting ? 'Rejecting...' : 'Reject Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default BloodRequests
