import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FaMapMarkerAlt,
  FaHospital,
  FaCalendarAlt,
  FaUser,
  FaEye,
  FaCheckCircle,
  FaTimes,
  FaClipboardCheck,
  FaChevronLeft,
  FaChevronRight,
  FaExclamationTriangle,
  FaPhoneAlt,
} from 'react-icons/fa'
import {
  BLOOD_GROUPS,
  fetchNearbyBloodRequests,
  fetchBloodBankRequestDetails,
  acceptBloodRequest,
  rejectBloodRequest,
  completeBloodRequest,
  fetchBloodBankInventory,
} from '../../services/bloodBankService'
import './BloodBankDashboard.css'
import './NearbyRequests.css'

const STATUS_META = {
  submitted: { label: 'Submitted', className: 'nearby-status--submitted' },
  notified: { label: 'Donors Notified', className: 'nearby-status--notified' },
  searching_donors: { label: 'Searching', className: 'nearby-status--searching' },
  accepted: { label: 'Donor Accepted', className: 'nearby-status--accepted' },
  approved: { label: 'Approved', className: 'nearby-status--approved' },
  rejected: { label: 'Rejected', className: 'nearby-status--rejected' },
  completed: { label: 'Completed', className: 'nearby-status--completed' },
  cancelled: { label: 'Cancelled', className: 'nearby-status--cancelled' },
  fulfilled: { label: 'Fulfilled', className: 'nearby-status--fulfilled' },
}

const PRIORITY_META = {
  critical: { label: 'Critical', className: 'nearby-priority--critical' },
  urgent: { label: 'Urgent', className: 'nearby-priority--urgent' },
  standard: { label: 'Standard', className: 'nearby-priority--standard' },
}

const ACTIONS = {
  ACCEPTED: { label: 'Accepted', className: 'nearby-action--accepted' },
  REJECTED: { label: 'Rejected', className: 'nearby-action--rejected' },
  COMPLETED: { label: 'Completed', className: 'nearby-action--completed' },
}

const STATUS_OPTIONS = [
  { value: 'open', label: 'Open requests' },
  { value: 'decided', label: 'Decided requests' },
  { value: 'all', label: 'All requests' },
]

const RADIUS_OPTIONS = [10, 25, 50, 100]

const SORT_OPTIONS = [
  { value: 'nearest', label: 'Nearest first' },
  { value: 'urgent', label: 'Most urgent' },
  { value: 'newest', label: 'Newest first' },
]

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

const NearbyRequests = () => {
  const navigate = useNavigate()

  const [bloodGroup, setBloodGroup] = useState('')
  const [priority, setPriority] = useState('')
  const [status, setStatus] = useState('open')
  const [radiusKm, setRadiusKm] = useState(25)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [sort, setSort] = useState('nearest')

  const [requests, setRequests] = useState([])
  const [total, setTotal] = useState(0)
  const [needsLocation, setNeedsLocation] = useState(false)
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [inventoryByGroup, setInventoryByGroup] = useState({})

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
    let active = true

    const load = async () => {
      try {
        const data = await fetchNearbyBloodRequests({
          bloodGroup,
          priority,
          status,
          radiusKm,
          from,
          to,
          sort,
          page,
          limit,
        })
        if (!active) return
        setRequests(data.requests || [])
        setTotal(data.total || 0)
        setNeedsLocation(Boolean(data.needsLocation))
        setError('')
      } catch (err) {
        if (!active) return
        if (err.status === 401) {
          navigate('/blood-bank/login', { replace: true })
          return
        }
        setError(err.message || 'Unable to load nearby blood requests.')
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [navigate, reloadKey, bloodGroup, priority, status, radiusKm, from, to, sort, page, limit])

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

  const retry = () => {
    setLoading(true)
    setError('')
    setSuccess('')
    setReloadKey((key) => key + 1)
  }

  const changeFilter = (setter) => (e) => {
    setter(e.target.value)
    setPage(1)
  }

  const resetFilters = () => {
    setBloodGroup('')
    setPriority('')
    setStatus('open')
    setRadiusKm(25)
    setFrom('')
    setTo('')
    setSort('nearest')
    setPage(1)
  }

  const goPrev = () => setPage((p) => Math.max(1, p - 1))
  const goNext = () => setPage((p) => Math.min(totalPages, p + 1))

  const totalPages = Math.max(1, Math.ceil(total / limit))
  const hasFilters = Boolean(bloodGroup || priority || from || to || radiusKm !== 25 || sort !== 'nearest')

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

  return (
    <section className="nearby">
      <div className="nearby-head">
        <div>
          <span className="bloodbank-dash-eyebrow">Geographic Request Search</span>
          <h2>Nearby Blood Requests</h2>
          <p>
            Real requests near your blood bank, ordered by actual distance. Accepting deducts stock
            from your inventory atomically.
          </p>
        </div>
        <div className="nearby-head-total">
          <div className="nearby-head-total-icon"><FaMapMarkerAlt /></div>
          <div>
            <span>Requests in {radiusKm} km</span>
            <strong>{total}</strong>
          </div>
        </div>
      </div>

      <div className="nearby-filters">
        <div className="nearby-filter">
          <label htmlFor="nearby-group">Blood Group</label>
          <select id="nearby-group" value={bloodGroup} onChange={changeFilter(setBloodGroup)}>
            <option value="">All groups</option>
            {BLOOD_GROUPS.map((group) => <option key={group} value={group}>{group}</option>)}
          </select>
        </div>
        <div className="nearby-filter">
          <label htmlFor="nearby-priority">Urgency</label>
          <select id="nearby-priority" value={priority} onChange={changeFilter(setPriority)}>
            <option value="">All priorities</option>
            <option value="critical">Critical</option>
            <option value="urgent">Urgent</option>
            <option value="standard">Standard</option>
          </select>
        </div>
        <div className="nearby-filter">
          <label htmlFor="nearby-status">Status</label>
          <select id="nearby-status" value={status} onChange={changeFilter(setStatus)}>
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
        <div className="nearby-filter">
          <label htmlFor="nearby-radius">Radius</label>
          <select id="nearby-radius" value={radiusKm} onChange={changeFilter(setRadiusKm)}>
            {RADIUS_OPTIONS.map((radius) => (
              <option key={radius} value={radius}>{radius} km</option>
            ))}
          </select>
        </div>
        <div className="nearby-filter">
          <label htmlFor="nearby-sort">Sort By</label>
          <select id="nearby-sort" value={sort} onChange={changeFilter(setSort)}>
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
        <div className="nearby-filter">
          <label htmlFor="nearby-from">Needed From</label>
          <input
            id="nearby-from"
            type="date"
            value={from}
            max={to || undefined}
            onChange={changeFilter(setFrom)}
          />
        </div>
        <div className="nearby-filter">
          <label htmlFor="nearby-to">Needed By</label>
          <input
            id="nearby-to"
            type="date"
            value={to}
            min={from || undefined}
            onChange={changeFilter(setTo)}
          />
        </div>
        <button type="button" className="nearby-reset" onClick={resetFilters} disabled={!hasFilters}>
          Reset Filters
        </button>
      </div>

      {success && (
        <div className="nearby-success">
          <FaCheckCircle /> {success}
        </div>
      )}

      {loading ? (
        <div className="nearby-loading">
          <div className="bloodbank-dash-spinner" />
          <p>Loading nearby blood requests...</p>
        </div>
      ) : error && requests.length === 0 && !detailLoading ? (
        <div className="nearby-error">
          <FaExclamationTriangle />
          <div>
            <h3>Unable to Load Nearby Requests</h3>
            <p>{error}</p>
          </div>
          <button type="button" className="nearby-retry" onClick={retry}>Retry</button>
        </div>
      ) : (
        <>
          {error && (
            <div className="nearby-inline-error">
              <FaExclamationTriangle /> {error}
              <button type="button" className="nearby-retry" onClick={retry}>Retry</button>
            </div>
          )}

          {needsLocation ? (
            <div className="nearby-empty nearby-empty--location">
              <FaMapMarkerAlt />
              <h3>No Location Set</h3>
              <p>
                Your blood bank profile has no coordinates yet, so nearby distances cannot be computed.
                Add your latitude and longitude to your profile to see nearby requests.
              </p>
            </div>
          ) : requests.length === 0 ? (
            <div className="nearby-empty">
              <FaMapMarkerAlt />
              <p>
                {hasFilters || status !== 'open' || sort !== 'nearest'
                  ? 'No nearby blood requests match these filters.'
                  : 'No open blood requests are within the selected radius yet.'}
              </p>
            </div>
          ) : (
            <>
              <div className="nearby-grid">
                {requests.map((req) => {
                  const statusMeta = STATUS_META[req.status] || STATUS_META.submitted
                  const priorityMeta = PRIORITY_META[req.priority] || PRIORITY_META.standard
                  const open = isOpenStatus(req.status)
                  return (
                    <article className="nearby-card" key={req.id}>
                      <div className="nearby-card-top">
                        <div className="nearby-distance">
                          <FaMapMarkerAlt />
                          <strong>{req.distanceKm != null ? req.distanceKm : '—'}</strong>
                          <span>km away</span>
                        </div>
                        <div className="nearby-card-patient">
                          <div className="nearby-avatar"><FaUser /></div>
                          <div>
                            <h3>{req.patientName}</h3>
                            <span>{req.patientAge} yrs · {req.patientGender}</span>
                          </div>
                        </div>
                        <span className={`nearby-status ${statusMeta.className}`}>{statusMeta.label}</span>
                      </div>

                      <div className="nearby-card-body">
                        <div className="nearby-group-row">
                          <span className="nearby-group">{req.bloodGroup}</span>
                          <span className="nearby-units">{req.units} unit{req.units > 1 ? 's' : ''}</span>
                          <span className={`nearby-priority ${priorityMeta.className}`}>{priorityMeta.label}</span>
                        </div>

                        <div className="nearby-meta">
                          <span><FaHospital /> {req.hospitalName}</span>
                          <span><FaMapMarkerAlt /> {req.city}</span>
                          <span><FaCalendarAlt /> Needed {formatDate(req.requiredBy)}</span>
                        </div>
                      </div>

                      <div className="nearby-card-actions">
                        <button type="button" className="nearby-btn nearby-btn--ghost" onClick={() => openDetail(req.id)}>
                          <FaEye /> Details
                        </button>
                        {open && (
                          <>
                            <button type="button" className="nearby-btn nearby-btn--accept" onClick={() => openAccept(req)}>
                              <FaCheckCircle /> Accept
                            </button>
                            <button type="button" className="nearby-btn nearby-btn--reject" onClick={() => openReject(req)}>
                              <FaTimes /> Reject
                            </button>
                          </>
                        )}
                        {req.status === 'approved' && (
                          <button
                            type="button"
                            className="nearby-btn nearby-btn--complete"
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
                <div className="nearby-pagination">
                  <button type="button" className="nearby-page-btn" disabled={page <= 1} onClick={goPrev}>
                    <FaChevronLeft /> Prev
                  </button>
                  <span>
                    Page {page} of {totalPages} · {total} request{total === 1 ? '' : 's'}
                  </span>
                  <button type="button" className="nearby-page-btn" disabled={page >= totalPages} onClick={goNext}>
                    Next <FaChevronRight />
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}

      {detailLoading && (
        <div className="nearby-modal-overlay">
          <div className="nearby-modal">
            <div className="nearby-loading"><div className="bloodbank-dash-spinner" /><p>Loading details...</p></div>
          </div>
        </div>
      )}

      {detail && (
        <div className="nearby-modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) setDetail(null) }}>
          <div className="nearby-modal nearby-modal--wide" role="dialog" aria-modal="true">
            <div className="nearby-modal-head">
              <h3>Request Details</h3>
              <button type="button" className="nearby-modal-close" onClick={() => setDetail(null)} aria-label="Close"><FaTimes /></button>
            </div>

            <div className="nearby-detail-top">
              <span className="nearby-detail-group">{detail.bloodGroup}</span>
              <div>
                <h4>{detail.patientName}</h4>
                <p>{detail.patientAge} yrs · {detail.patientGender}</p>
              </div>
              <span className={`nearby-status ${(STATUS_META[detail.status] || STATUS_META.submitted).className}`}>
                {(STATUS_META[detail.status] || STATUS_META.submitted).label}
              </span>
            </div>

            <dl className="nearby-detail-list">
              <div><dt>Units Required</dt><dd>{detail.units}</dd></div>
              <div><dt>Priority</dt><dd>{(PRIORITY_META[detail.priority] || PRIORITY_META.standard).label}</dd></div>
              <div><dt>Distance</dt><dd><FaMapMarkerAlt /> {detail.distanceKm != null ? `${detail.distanceKm} km away` : '—'}</dd></div>
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
              <div className="nearby-detail-actions">
                <div className="bloodbank-dash-card-title"><FaClipboardCheck /> Bank Action Trail</div>
                <ul>
                  {detailActions.map((action) => (
                    <li key={action.id}>
                      <span className={`nearby-action ${ACTIONS[action.action]?.className || ''}`}>
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

            <div className="nearby-modal-actions">
              <button type="button" className="nearby-cancel" onClick={() => setDetail(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {acceptTarget && (
        <div className="nearby-modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) closeModals() }}>
          <div className="nearby-modal" role="dialog" aria-modal="true">
            <div className="nearby-modal-head">
              <h3>Accept Blood Request</h3>
              <button type="button" className="nearby-modal-close" onClick={closeModals} aria-label="Close"><FaTimes /></button>
            </div>

            <div className="nearby-accept-info">
              <span className="nearby-group">{acceptTarget.bloodGroup}</span>
              <p>
                This will deduct <strong>{acceptTarget.units} unit{acceptTarget.units > 1 ? 's' : ''}</strong> of{' '}
                <strong>{acceptTarget.bloodGroup}</strong> from your inventory for patient{' '}
                <strong>{acceptTarget.patientName}</strong>.
              </p>
            </div>

            <div className="nearby-stock-check">
              <span>Current {acceptTarget.bloodGroup} stock</span>
              <strong className={(inventoryByGroup[acceptTarget.bloodGroup] ?? 0) >= acceptTarget.units ? 'nearby-stock-ok' : 'nearby-stock-low'}>
                {inventoryByGroup[acceptTarget.bloodGroup] ?? 0} units
              </strong>
            </div>

            {(inventoryByGroup[acceptTarget.bloodGroup] ?? 0) < acceptTarget.units && (
              <div className="nearby-form-error">
                <FaExclamationTriangle /> Not enough stock for this request. Add units first.
              </div>
            )}

            {modalError && (
              <div className="nearby-form-error">
                <FaExclamationTriangle /> {modalError}
              </div>
            )}

            <div className="nearby-modal-actions">
              <button type="button" className="nearby-cancel" onClick={closeModals}>Cancel</button>
              <button
                type="button"
                className="nearby-submit"
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
        <div className="nearby-modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) closeModals() }}>
          <div className="nearby-modal" role="dialog" aria-modal="true">
            <div className="nearby-modal-head">
              <h3>Reject Blood Request</h3>
              <button type="button" className="nearby-modal-close" onClick={closeModals} aria-label="Close"><FaTimes /></button>
            </div>

            <p className="nearby-reject-intro">
              Rejecting the request for <strong>{rejectTarget.patientName}</strong> ({rejectTarget.bloodGroup}) will
              notify the requester. No stock is changed.
            </p>

            <div className="nearby-modal-field">
              <label htmlFor="nearby-reject-reason">Reason for rejection</label>
              <textarea
                id="nearby-reject-reason"
                rows="4"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Insufficient stock for this group, expired units, out of service area..."
                required
              />
            </div>

            {modalError && (
              <div className="nearby-form-error">
                <FaExclamationTriangle /> {modalError}
              </div>
            )}

            <div className="nearby-modal-actions">
              <button type="button" className="nearby-cancel" onClick={closeModals}>Cancel</button>
              <button
                type="button"
                className="nearby-submit nearby-submit--reject"
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

export default NearbyRequests
