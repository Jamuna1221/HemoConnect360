import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FaUsers,
  FaTint,
  FaClipboardList,
  FaHeartbeat,
  FaUserPlus,
  FaSearch,
  FaTimes,
  FaCheckCircle,
  FaExclamationTriangle,
  FaEye,
  FaPhoneAlt,
  FaMapMarkerAlt,
  FaCalendarAlt,
} from 'react-icons/fa'
import {
  BLOOD_GROUPS,
  fetchBloodBankCollectionDonors,
  fetchBloodBankDonorByPhone,
  fetchBloodBankCollectionHistory,
  recordBloodBankCollection,
} from '../services/bloodBankService'
import './BloodCollections.css'

const TAB_DONORS = 'donors'
const TAB_HISTORY = 'history'
const UNITS_OPTIONS = [1, 2, 3, 4, 5]

const todayString = () => {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

const formatDate = (value) => {
  if (!value) return '—'
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-')
    return new Date(year, month - 1, day).toLocaleDateString()
  }
  return new Date(value).toLocaleDateString()
}

const initials = (name) =>
  (name || '?')
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

const BloodCollections = ({ onInventoryChanged }) => {
  const navigate = useNavigate()

  const [tab, setTab] = useState(TAB_DONORS)
  const [donors, setDonors] = useState([])
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  const [donorSearch, setDonorSearch] = useState('')
  const [donorGroup, setDonorGroup] = useState('')
  const [eligibleOnly, setEligibleOnly] = useState(false)

  const [historySearch, setHistorySearch] = useState('')
  const [historyGroup, setHistoryGroup] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  const [detailDonor, setDetailDonor] = useState(null)

  const [recordOpen, setRecordOpen] = useState(false)
  const [phone, setPhone] = useState('')
  const [foundDonor, setFoundDonor] = useState(null)
  const [lookupLoading, setLookupLoading] = useState(false)
  const [donationDate, setDonationDate] = useState(todayString())
  const [units, setUnits] = useState(1)
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [modalError, setModalError] = useState('')

  useEffect(() => {
    let active = true

    const load = async () => {
      try {
        const [donorRows, historyRows] = await Promise.all([
          fetchBloodBankCollectionDonors(),
          fetchBloodBankCollectionHistory(),
        ])
        if (!active) return
        setDonors(donorRows)
        setHistory(historyRows)
        setError('')
      } catch (err) {
        if (!active) return
        if (err.status === 401) {
          navigate('/blood-bank/login', { replace: true })
          return
        }
        setError(err.message || 'Unable to load donor and collection records.')
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [navigate, reloadKey])

  const stats = useMemo(() => {
    const eligible = donors.filter((d) => d.eligible).length
    const unitsCollected = history.reduce((sum, c) => sum + (Number(c.units) || 0), 0)
    return {
      registered: donors.length,
      eligible,
      collections: history.length,
      units: unitsCollected,
    }
  }, [donors, history])

  const filteredDonors = useMemo(() => {
    const query = donorSearch.trim().toLowerCase()
    return donors.filter((donor) => {
      if (donorGroup && donor.bloodGroup !== donorGroup) return false
      if (eligibleOnly && !donor.eligible) return false
      if (query) {
        const haystack = `${donor.fullName} ${donor.phone} ${donor.city}`.toLowerCase()
        if (!haystack.includes(query)) return false
      }
      return true
    })
  }, [donors, donorSearch, donorGroup, eligibleOnly])

  const filteredHistory = useMemo(() => {
    const query = historySearch.trim().toLowerCase()
    return history.filter((collection) => {
      if (historyGroup && collection.bloodGroup !== historyGroup) return false
      if (fromDate && collection.donationDate < fromDate) return false
      if (toDate && collection.donationDate > toDate) return false
      if (query) {
        const haystack = `${collection.donorName} ${collection.donorPhone} ${collection.city}`.toLowerCase()
        if (!haystack.includes(query)) return false
      }
      return true
    })
  }, [history, historySearch, historyGroup, fromDate, toDate])

  const dateEligible = useMemo(() => {
    if (!foundDonor) return true
    if (!foundDonor.lastDonation || !donationDate) return true
    return donationDate >= foundDonor.nextEligible
  }, [foundDonor, donationDate])

  const retry = () => {
    setLoading(true)
    setError('')
    setSuccess('')
    setReloadKey((key) => key + 1)
  }

  const openRecord = (donor) => {
    setPhone(donor ? donor.phone : '')
    setFoundDonor(donor || null)
    setDonationDate(todayString())
    setUnits(1)
    setNotes('')
    setModalError('')
    setRecordOpen(true)
  }

  const closeRecord = () => {
    if (submitting) return
    setRecordOpen(false)
    setFoundDonor(null)
    setPhone('')
    setModalError('')
  }

  const handleLookup = async () => {
    const cleaned = phone.replace(/\D/g, '')
    if (!/^\d{10}$/.test(cleaned)) {
      setModalError('Enter a valid 10-digit donor phone number.')
      return
    }
    setLookupLoading(true)
    setModalError('')
    setFoundDonor(null)
    try {
      const donor = await fetchBloodBankDonorByPhone(cleaned)
      setFoundDonor(donor)
    } catch (err) {
      if (err.status === 401) {
        navigate('/blood-bank/login', { replace: true })
        return
      }
      setModalError(err.message || 'Unable to find this donor.')
    } finally {
      setLookupLoading(false)
    }
  }

  const handleRecord = async (e) => {
    e.preventDefault()
    if (!foundDonor) return
    setSubmitting(true)
    setModalError('')
    try {
      const { donation } = await recordBloodBankCollection({
        donorPhone: foundDonor.phone,
        bloodGroup: foundDonor.bloodGroup,
        donationDate,
        units,
        notes,
      })
      setSuccess(
        `${donation?.donorName || foundDonor.fullName} — ${units} unit${units > 1 ? 's' : ''} of ${foundDonor.bloodGroup} collected. Inventory updated.`
      )
      setRecordOpen(false)
      setFoundDonor(null)
      setPhone('')
      setReloadKey((key) => key + 1)
      if (onInventoryChanged) onInventoryChanged()
    } catch (err) {
      if (err.status === 401) {
        navigate('/blood-bank/login', { replace: true })
        return
      }
      setModalError(err.message || 'Unable to record this collection.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <section className="bloodcol">
        <div className="bloodcol-loading">
          <div className="bloodbank-dash-spinner" />
          <p>Loading donor and collection records...</p>
        </div>
      </section>
    )
  }

  if (error && donors.length === 0 && history.length === 0) {
    return (
      <section className="bloodcol">
        <div className="bloodcol-error">
          <FaExclamationTriangle />
          <div>
            <h3>Unable to Load Records</h3>
            <p>{error}</p>
          </div>
          <button type="button" className="bloodcol-retry" onClick={retry}>Retry</button>
        </div>
      </section>
    )
  }

  return (
    <section className="bloodcol" id="collections">
      <div className="bloodcol-head">
        <div>
          <span className="bloodbank-dash-eyebrow">Donor &amp; Collection Records</span>
          <h2>Blood Collections</h2>
          <p>Registered donors visible to your bank. Recording a collection adds units to your inventory atomically.</p>
        </div>
        <div className="bloodcol-head-total">
          <div className="bloodcol-head-total-icon"><FaUsers /></div>
          <div>
            <span>Registered Donors</span>
            <strong>{stats.registered}</strong>
          </div>
        </div>
      </div>

      <div className="bloodcol-stats">
        <div className="bloodcol-stat bloodcol-stat--eligible">
          <FaHeartbeat />
          <span>Eligible Now</span>
          <strong>{stats.eligible}</strong>
        </div>
        <div className="bloodcol-stat bloodcol-stat--collections">
          <FaClipboardList />
          <span>Collections</span>
          <strong>{stats.collections}</strong>
        </div>
        <div className="bloodcol-stat bloodcol-stat--units">
          <FaTint />
          <span>Units Collected</span>
          <strong>{stats.units}</strong>
        </div>
      </div>

      <div className="bloodcol-tabs">
        <button
          type="button"
          className={tab === TAB_DONORS ? 'bloodcol-tab bloodcol-tab--active' : 'bloodcol-tab'}
          onClick={() => setTab(TAB_DONORS)}
        >
          Available Donors
        </button>
        <button
          type="button"
          className={tab === TAB_HISTORY ? 'bloodcol-tab bloodcol-tab--active' : 'bloodcol-tab'}
          onClick={() => setTab(TAB_HISTORY)}
        >
          Collection History
        </button>
      </div>

      {success && (
        <div className="bloodcol-success">
          <FaCheckCircle /> {success}
        </div>
      )}

      {error && (
        <div className="bloodcol-inline-error">
          <FaExclamationTriangle /> {error}
          <button type="button" className="bloodcol-retry" onClick={retry}>Retry</button>
        </div>
      )}

      {tab === TAB_DONORS ? (
        <>
          <div className="bloodcol-filters">
            <div className="bloodcol-search">
              <FaSearch />
              <input
                type="search"
                value={donorSearch}
                onChange={(e) => setDonorSearch(e.target.value)}
                placeholder="Search name, phone, city..."
                aria-label="Search donors"
              />
            </div>
            <select value={donorGroup} onChange={(e) => setDonorGroup(e.target.value)} aria-label="Filter donors by blood group">
              <option value="">All blood groups</option>
              {BLOOD_GROUPS.map((group) => <option key={group} value={group}>{group}</option>)}
            </select>
            <label className="bloodcol-toggle">
              <input
                type="checkbox"
                checked={eligibleOnly}
                onChange={(e) => setEligibleOnly(e.target.checked)}
              />
              Eligible only
            </label>
          </div>

          {filteredDonors.length === 0 ? (
            <div className="bloodcol-empty">
              <FaUsers />
              <p>No donors match these filters.</p>
            </div>
          ) : (
            <div className="bloodcol-grid">
              {filteredDonors.map((donor) => (
                <article className="bloodcol-card" key={donor.id}>
                  <div className="bloodcol-card-top">
                    <div className="bloodcol-card-donor">
                      <div className="bloodcol-avatar">{initials(donor.fullName)}</div>
                      <div>
                        <h3>{donor.fullName}</h3>
                        <span className={donor.eligible ? 'bloodcol-elig bloodcol-elig--ok' : 'bloodcol-elig bloodcol-elig--no'}>
                          {donor.eligible ? 'Eligible to donate' : 'Not yet eligible'}
                        </span>
                      </div>
                    </div>
                    <span className="bloodcol-group">{donor.bloodGroup}</span>
                  </div>

                  <div className="bloodcol-meta">
                    <span><FaPhoneAlt /> {donor.phone}</span>
                    <span><FaMapMarkerAlt /> {donor.city || '—'}</span>
                  </div>

                  <div className="bloodcol-card-actions">
                    <button type="button" className="bloodcol-btn bloodcol-btn--ghost" onClick={() => setDetailDonor(donor)}>
                      <FaEye /> Details
                    </button>
                    <button
                      type="button"
                      className="bloodcol-btn bloodcol-btn--record"
                      onClick={() => openRecord(donor)}
                      disabled={!donor.eligible}
                    >
                      <FaUserPlus /> Record Collection
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <div className="bloodcol-filters">
            <div className="bloodcol-search">
              <FaSearch />
              <input
                type="search"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="Search donor, phone, city..."
                aria-label="Search collection history"
              />
            </div>
            <select value={historyGroup} onChange={(e) => setHistoryGroup(e.target.value)} aria-label="Filter history by blood group">
              <option value="">All blood groups</option>
              {BLOOD_GROUPS.map((group) => <option key={group} value={group}>{group}</option>)}
            </select>
            <input
              type="date"
              value={fromDate}
              max={toDate || undefined}
              onChange={(e) => setFromDate(e.target.value)}
              aria-label="From date"
            />
            <input
              type="date"
              value={toDate}
              min={fromDate || undefined}
              onChange={(e) => setToDate(e.target.value)}
              aria-label="To date"
            />
          </div>

          {filteredHistory.length === 0 ? (
            <div className="bloodcol-empty">
              <FaClipboardList />
              <p>No collections match these filters.</p>
            </div>
          ) : (
            <div className="bloodcol-table">
              <div className="bloodcol-table-head">
                <span>Donor</span>
                <span>Group</span>
                <span>Units</span>
                <span>Date</span>
                <span>City</span>
              </div>
              {filteredHistory.map((collection) => (
                <div className="bloodcol-row" key={collection.id}>
                  <div className="bloodcol-row-donor">
                    <div className="bloodcol-avatar bloodcol-avatar--sm">{initials(collection.donorName)}</div>
                    <div>
                      <strong>{collection.donorName}</strong>
                      <span>{collection.donorPhone}</span>
                    </div>
                  </div>
                  <span className="bloodcol-group">{collection.bloodGroup}</span>
                  <div className="bloodcol-row-units">
                    <strong>{collection.units}</strong>
                    <span>unit{collection.units > 1 ? 's' : ''}</span>
                  </div>
                  <span className="bloodcol-row-date"><FaCalendarAlt /> {formatDate(collection.donationDate)}</span>
                  <span className="bloodcol-row-city"><FaMapMarkerAlt /> {collection.city || '—'}</span>
                  {collection.notes && <p className="bloodcol-row-notes">{collection.notes}</p>}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {detailDonor && (
        <div className="bloodcol-modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) setDetailDonor(null) }}>
          <div className="bloodcol-modal" role="dialog" aria-modal="true">
            <div className="bloodcol-modal-head">
              <h3>Donor Details</h3>
              <button type="button" className="bloodcol-modal-close" onClick={() => setDetailDonor(null)} aria-label="Close"><FaTimes /></button>
            </div>

            <div className="bloodcol-detail-top">
              <div className="bloodcol-avatar bloodcol-avatar--lg">{initials(detailDonor.fullName)}</div>
              <div>
                <h4>{detailDonor.fullName}</h4>
                <p><FaMapMarkerAlt /> {detailDonor.city || '—'}</p>
              </div>
              <span className="bloodcol-group">{detailDonor.bloodGroup}</span>
            </div>

            <dl className="bloodcol-detail-list">
              <div><dt>Phone</dt><dd><FaPhoneAlt /> {detailDonor.phone}</dd></div>
              <div><dt>Gender</dt><dd>{detailDonor.gender || '—'}</dd></div>
              <div><dt>Date of Birth</dt><dd>{formatDate(detailDonor.dob)}</dd></div>
              <div><dt>Weight</dt><dd>{detailDonor.weight != null ? `${detailDonor.weight} kg` : '—'}</dd></div>
              <div><dt>Hemoglobin</dt><dd>{detailDonor.hemoglobin != null ? `${detailDonor.hemoglobin} g/dL` : '—'}</dd></div>
              <div><dt>Last Donation</dt><dd>{detailDonor.lastDonation ? formatDate(detailDonor.lastDonation) : 'Never'}</dd></div>
              <div><dt>Next Eligible</dt><dd>{detailDonor.nextEligible ? formatDate(detailDonor.nextEligible) : '—'}</dd></div>
              <div>
                <dt>Eligibility</dt>
                <dd>
                  <span className={detailDonor.eligible ? 'bloodcol-elig bloodcol-elig--ok' : 'bloodcol-elig bloodcol-elig--no'}>
                    {detailDonor.eligible ? 'Eligible to donate' : 'Not yet eligible'}
                  </span>
                </dd>
              </div>
            </dl>

            <div className="bloodcol-modal-actions">
              <button type="button" className="bloodcol-cancel" onClick={() => setDetailDonor(null)}>Close</button>
              <button
                type="button"
                className="bloodcol-submit"
                disabled={!detailDonor.eligible}
                onClick={() => { const donor = detailDonor; setDetailDonor(null); openRecord(donor) }}
              >
                <FaUserPlus /> Record Collection
              </button>
            </div>
          </div>
        </div>
      )}

      {recordOpen && (
        <div className="bloodcol-modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) closeRecord() }}>
          <div className="bloodcol-modal" role="dialog" aria-modal="true">
            <div className="bloodcol-modal-head">
              <h3>Record Blood Collection</h3>
              <button type="button" className="bloodcol-modal-close" onClick={closeRecord} aria-label="Close"><FaTimes /></button>
            </div>

            <form onSubmit={handleRecord}>
              {!foundDonor ? (
                <div className="bloodcol-modal-field">
                  <label htmlFor="col-phone">Donor phone number</label>
                  <div className="bloodcol-lookup">
                    <input
                      id="col-phone"
                      type="tel"
                      inputMode="numeric"
                      maxLength="10"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                      placeholder="10-digit phone number"
                      autoFocus
                    />
                    <button type="button" className="bloodcol-lookup-btn" onClick={handleLookup} disabled={lookupLoading}>
                      {lookupLoading ? 'Looking up...' : 'Look up donor'}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="bloodcol-found-donor">
                    <div className="bloodcol-avatar">{initials(foundDonor.fullName)}</div>
                    <div>
                      <h4>{foundDonor.fullName}</h4>
                      <span>{foundDonor.bloodGroup} · {foundDonor.city || '—'}</span>
                    </div>
                    <span className={foundDonor.eligible ? 'bloodcol-elig bloodcol-elig--ok' : 'bloodcol-elig bloodcol-elig--no'}>
                      {foundDonor.eligible ? 'Eligible today' : 'Not eligible today'}
                    </span>
                  </div>

                  <div className="bloodcol-modal-field">
                    <label htmlFor="col-group">Blood group</label>
                    <input
                      id="col-group"
                      className="bloodcol-readonly"
                      value={foundDonor.bloodGroup}
                      readOnly
                      aria-label="Donor blood group"
                    />
                  </div>

                  <div className="bloodcol-modal-row">
                    <div className="bloodcol-modal-field">
                      <label htmlFor="col-date">Donation date</label>
                      <input
                        id="col-date"
                        type="date"
                        max={todayString()}
                        value={donationDate}
                        onChange={(e) => setDonationDate(e.target.value)}
                        required
                      />
                    </div>
                    <div className="bloodcol-modal-field">
                      <label htmlFor="col-units">Units</label>
                      <select id="col-units" value={units} onChange={(e) => setUnits(Number(e.target.value))}>
                        {UNITS_OPTIONS.map((unit) => <option key={unit} value={unit}>{unit} unit{unit > 1 ? 's' : ''}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="bloodcol-modal-field">
                    <label htmlFor="col-notes">Notes (optional)</label>
                    <textarea
                      id="col-notes"
                      rows="3"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g. Donor deferred for travel, mild reaction..."
                    />
                  </div>

                  {!dateEligible && (
                    <div className="bloodcol-form-error">
                      <FaExclamationTriangle /> This donor is not yet eligible on the selected date. Next eligible: {formatDate(foundDonor.nextEligible)}.
                    </div>
                  )}
                </>
              )}

              {modalError && (
                <div className="bloodcol-form-error">
                  <FaExclamationTriangle /> {modalError}
                </div>
              )}

              <div className="bloodcol-modal-actions">
                <button type="button" className="bloodcol-cancel" onClick={closeRecord} disabled={submitting}>Cancel</button>
                {foundDonor && (
                  <button type="submit" className="bloodcol-submit" disabled={submitting || !dateEligible}>
                    {submitting ? 'Recording...' : 'Record Collection'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}

export default BloodCollections
