import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  FaArrowRight,
  FaBell,
  FaBoxes,
  FaCalendarCheck,
  FaCheckCircle,
  FaChevronRight,
  FaClipboardList,
  FaClock,
  FaExclamationTriangle,
  FaHandHoldingHeart,
  FaHeartbeat,
  FaHospital,
  FaMapMarkerAlt,
  FaPlus,
  FaShieldAlt,
  FaTint,
  FaUsers,
} from 'react-icons/fa'
import BloodBankStatCard from '../../components/BloodBank/BloodBankStatCard'
import {
  BLOOD_GROUPS,
  fetchBloodBankCollectionDonors,
  fetchBloodBankCollectionHistory,
  fetchBloodBankInventory,
  fetchBloodBankProfile,
  fetchBloodBankRequests,
} from '../../services/bloodBankService'
import './BloodBankDashboard.css'

const STATUS_META = {
  ACTIVE: { label: 'Active', icon: <FaCheckCircle />, className: 'bloodbank-dash-status--active' },
  PENDING_VERIFICATION: { label: 'Pending Verification', icon: <FaClock />, className: 'bloodbank-dash-status--pending' },
  SUSPENDED: { label: 'Suspended', icon: <FaExclamationTriangle />, className: 'bloodbank-dash-status--suspended' },
  REJECTED: { label: 'Rejected', icon: <FaExclamationTriangle />, className: 'bloodbank-dash-status--rejected' },
}

const INVENTORY_STATUS_META = {
  AVAILABLE: { label: 'Available', className: 'bloodbank-dash-inv-status--available' },
  LOW_STOCK: { label: 'Low Stock', className: 'bloodbank-dash-inv-status--low' },
  OUT_OF_STOCK: { label: 'Out of Stock', className: 'bloodbank-dash-inv-status--out' },
}

const REQUEST_STATUS_META = {
  submitted: { label: 'Submitted', className: 'bloodbank-dash-req-status--submitted' },
  notified: { label: 'Donors Notified', className: 'bloodbank-dash-req-status--notified' },
  searching_donors: { label: 'Searching', className: 'bloodbank-dash-req-status--searching' },
  accepted: { label: 'Donor Accepted', className: 'bloodbank-dash-req-status--accepted' },
  approved: { label: 'Approved', className: 'bloodbank-dash-req-status--approved' },
  rejected: { label: 'Rejected', className: 'bloodbank-dash-req-status--rejected' },
  completed: { label: 'Completed', className: 'bloodbank-dash-req-status--completed' },
  cancelled: { label: 'Cancelled', className: 'bloodbank-dash-req-status--cancelled' },
  fulfilled: { label: 'Fulfilled', className: 'bloodbank-dash-req-status--fulfilled' },
}

const PRIORITY_META = {
  critical: { label: 'Critical', className: 'bloodbank-dash-req-priority--critical' },
  urgent: { label: 'Urgent', className: 'bloodbank-dash-req-priority--urgent' },
  standard: { label: 'Standard', className: 'bloodbank-dash-req-priority--standard' },
}

const GROUP_COLORS = {
  'A+': '#7F1D1D',
  'A-': '#B91C1C',
  'B+': '#C62828',
  'B-': '#DC2626',
  'AB+': '#E53935',
  'AB-': '#EF5350',
  'O+': '#F27171',
  'O-': '#F9A8A8',
}

const QUICK_ACTIONS = [
  { label: 'Add Blood Units', description: 'Update your stock levels', to: '/blood-bank/inventory', icon: <FaPlus /> },
  { label: 'Process Requests', description: 'Accept or reject requests', to: '/blood-bank/requests', icon: <FaClipboardList /> },
  { label: 'Record Collection', description: 'Add a new donation', to: '/blood-bank/collections', icon: <FaHandHoldingHeart /> },
  { label: 'Nearby Requests', description: 'Hospitals near you', to: '/blood-bank/nearby-requests', icon: <FaMapMarkerAlt /> },
]

const EMPTY_STATS = { open: 0, approved: 0, rejected: 0, completed: 0, total: 0 }

const humanize = (value) =>
  String(value || '')
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase())

const getStatusMeta = (status) =>
  STATUS_META[status] || {
    label: humanize(status) || 'Unknown',
    icon: <FaClock />,
    className: 'bloodbank-dash-status--pending',
  }

const isCurrentMonth = (dateStr) => {
  if (!dateStr) return false
  const date = new Date(`${dateStr}T00:00:00`)
  const now = new Date()
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth()
}

const formatDate = (value) => {
  if (!value) return '—'
  return new Date(value).toLocaleDateString()
}

const loadTotalUnits = () => fetchBloodBankInventory().then((data) => data.totalUnits)

const loadPendingRequests = () =>
  fetchBloodBankRequests({ status: 'open', limit: 1 }).then((data) => data.total)

const loadActiveDonors = () =>
  fetchBloodBankCollectionDonors().then((donors) => donors.filter((donor) => donor.eligible).length)

const loadCollectionsThisMonth = () =>
  fetchBloodBankCollectionHistory().then((collections) =>
    collections.filter((collection) => isCurrentMonth(collection.donationDate)).length,
  )

const STAT_CARDS = [
  {
    icon: <FaBoxes />,
    title: 'Total Blood Units',
    description: 'Available units across all blood groups',
    loader: loadTotalUnits,
  },
  {
    icon: <FaHeartbeat />,
    title: 'Pending Blood Requests',
    description: 'Blood requests awaiting action',
    loader: loadPendingRequests,
  },
  {
    icon: <FaUsers />,
    title: 'Active Donors',
    description: 'Donors currently eligible to donate',
    loader: loadActiveDonors,
  },
  {
    icon: <FaCalendarCheck />,
    title: 'Collections This Month',
    description: 'Donations recorded this month',
    loader: loadCollectionsThisMonth,
  },
]

const toGroups = (inventory) => {
  const byGroup = Object.fromEntries(inventory.map((item) => [item.bloodGroup, item]))
  return BLOOD_GROUPS.map((bloodGroup) => ({
    bloodGroup,
    unitsAvailable: byGroup[bloodGroup]?.unitsAvailable ?? 0,
    lowStockThreshold: byGroup[bloodGroup]?.lowStockThreshold ?? 3,
    status: byGroup[bloodGroup]?.status ?? 'OUT_OF_STOCK',
  }))
}

const toDonut = (groups) => {
  const total = groups.reduce((sum, group) => sum + group.unitsAvailable, 0)
  if (total <= 0) return null

  let cursor = 0
  const segments = groups
    .filter((group) => group.unitsAvailable > 0)
    .map((group) => {
      const start = cursor
      cursor += group.unitsAvailable
      return {
        bloodGroup: group.bloodGroup,
        units: group.unitsAvailable,
        from: (start / total) * 360,
        to: (cursor / total) * 360,
      }
    })

  const background = `conic-gradient(${segments
    .map((segment) => `${GROUP_COLORS[segment.bloodGroup]} ${segment.from}deg ${segment.to}deg`)
    .join(', ')})`

  return { total, background }
}

const BloodBankDashboard = () => {
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  const [groups, setGroups] = useState([])
  const [totalUnits, setTotalUnits] = useState(0)
  const [recentRequests, setRecentRequests] = useState([])
  const [requestStats, setRequestStats] = useState(EMPTY_STATS)
  const [dataLoading, setDataLoading] = useState(true)
  const [dataError, setDataError] = useState('')
  const [dataReloadKey, setDataReloadKey] = useState(0)

  useEffect(() => {
    let active = true

    const load = async () => {
      try {
        const { bloodBank } = await fetchBloodBankProfile()
        if (!active) return
        setProfile(bloodBank)
      } catch (err) {
        if (!active) return
        if (err.status === 401) {
          navigate('/blood-bank/login', { replace: true })
          return
        }
        setError(err.message || 'Unable to load blood bank information.')
      } finally {
        if (active) setLoading(false)
      }
    }

    load()

    return () => {
      active = false
    }
  }, [navigate, reloadKey])

  useEffect(() => {
    let active = true

    const loadDashboardData = async () => {
      setDataLoading(true)
      setDataError('')

      const [inventoryResult, requestsResult] = await Promise.allSettled([
        fetchBloodBankInventory(),
        fetchBloodBankRequests({ limit: 5 }),
      ])

      if (!active) return

      if (inventoryResult.status === 'rejected' && inventoryResult.reason?.status === 401) {
        navigate('/blood-bank/login', { replace: true })
        return
      }
      if (requestsResult.status === 'rejected' && requestsResult.reason?.status === 401) {
        navigate('/blood-bank/login', { replace: true })
        return
      }

      const inventoryData =
        inventoryResult.status === 'fulfilled' ? inventoryResult.value : { inventory: [], totalUnits: 0 }
      const requestsData =
        requestsResult.status === 'fulfilled'
          ? requestsResult.value
          : { requests: [], total: 0, stats: EMPTY_STATS }

      setGroups(toGroups(inventoryData.inventory || []))
      setTotalUnits(inventoryData.totalUnits || 0)
      setRecentRequests(requestsData.requests || [])
      setRequestStats(requestsData.stats || EMPTY_STATS)

      const failed =
        inventoryResult.status === 'rejected' || requestsResult.status === 'rejected'
      if (failed) {
        setDataError('Some dashboard information could not be loaded right now. Showing available data.')
      }

      setDataLoading(false)
    }

    loadDashboardData()

    return () => {
      active = false
    }
  }, [navigate, dataReloadKey])

  const retry = () => {
    setError('')
    setLoading(true)
    setReloadKey((key) => key + 1)
  }

  const retryData = () => {
    setDataError('')
    setDataLoading(true)
    setDataReloadKey((key) => key + 1)
  }

  if (loading) {
    return (
      <div className="bloodbank-dash-page">
        <div className="bloodbank-dash-skeleton">
          <div className="bloodbank-dash-skeleton-line bloodbank-dash-skeleton-line--eyebrow" />
          <div className="bloodbank-dash-skeleton-line bloodbank-dash-skeleton-line--title" />
          <div className="bloodbank-dash-skeleton-line" />
          <div className="bloodbank-dash-grid">
            <div className="bloodbank-dash-card bloodbank-dash-card--wide bloodbank-dash-skeleton-card" />
            <div className="bloodbank-dash-card bloodbank-dash-skeleton-card" />
            <div className="bloodbank-dash-card bloodbank-dash-skeleton-card" />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bloodbank-dash-page">
        <div className="bloodbank-dash-restricted bloodbank-dash-restricted--rejected">
          <div className="bloodbank-dash-restricted-icon">
            <FaExclamationTriangle />
          </div>
          <h2>Unable to load blood bank information.</h2>
          <p>{error}</p>
          <button type="button" className="bloodbank-dash-retry-btn" onClick={retry}>
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="bloodbank-dash-page">
        <div className="bloodbank-dash-restricted bloodbank-dash-restricted--rejected">
          <div className="bloodbank-dash-restricted-icon">
            <FaHospital />
          </div>
          <h2>No Blood Bank Profile</h2>
          <p>No blood bank profile was found for this account. Please register your blood bank first.</p>
        </div>
      </div>
    )
  }

  const statusMeta = getStatusMeta(profile.verificationStatus)
  const donut = toDonut(groups)
  const maxUnits = Math.max(...groups.map((group) => group.unitsAvailable), 1)

  const lowStockGroups = groups.filter((group) => group.status !== 'AVAILABLE')

  const alerts = []
  if (requestStats.open > 0) {
    alerts.push({
      key: 'open-requests',
      icon: <FaHeartbeat />,
      tone: 'warn',
      title: `${requestStats.open} pending request${requestStats.open > 1 ? 's' : ''}`,
      text: 'Blood requests are waiting for your action.',
      to: '/blood-bank/requests',
    })
  }
  if (lowStockGroups.length > 0) {
    alerts.push({
      key: 'low-stock',
      icon: <FaBoxes />,
      tone: 'danger',
      title: `${lowStockGroups.length} blood group${lowStockGroups.length > 1 ? 's' : ''} low or out of stock`,
      text: lowStockGroups.map((group) => group.bloodGroup).join(', '),
      to: '/blood-bank/inventory',
    })
  }
  if (profile.verificationStatus === 'PENDING_VERIFICATION') {
    alerts.push({
      key: 'verification',
      icon: <FaShieldAlt />,
      tone: 'info',
      title: 'Profile pending verification',
      text: 'Your registration is awaiting admin review.',
      to: '/blood-bank/profile',
    })
  }
  if (profile.verificationStatus === 'SUSPENDED') {
    alerts.push({
      key: 'verification',
      icon: <FaShieldAlt />,
      tone: 'danger',
      title: 'Profile suspended',
      text: 'Your blood bank account has been suspended.',
      to: '/blood-bank/profile',
    })
  }
  if (profile.verificationStatus === 'REJECTED') {
    alerts.push({
      key: 'verification',
      icon: <FaShieldAlt />,
      tone: 'danger',
      title: 'Profile rejected',
      text: 'Your blood bank registration was not approved.',
      to: '/blood-bank/profile',
    })
  }
  if (requestStats.approved > 0) {
    alerts.push({
      key: 'approved',
      icon: <FaClipboardList />,
      tone: 'info',
      title: `${requestStats.approved} approved request${requestStats.approved > 1 ? 's' : ''}`,
      text: 'Mark approved requests as completed once fulfilled.',
      to: '/blood-bank/requests',
    })
  }

  return (
    <div className="bloodbank-dash-page">
      <section className="bloodbank-dash-hero">
        <div className="bloodbank-dash-hero-content">
          <span className="bloodbank-dash-eyebrow">Blood Bank Dashboard</span>
          <h1>Welcome, {profile.bloodBankName}!</h1>
          <p>Manage your blood inventory, requests, donors and collections from one place.</p>
          <div className="bloodbank-dash-hero-chips">
            <span className="bloodbank-dash-chip">
              <FaHospital /> {profile.bloodBankType || 'Blood Bank'}
            </span>
            <span className="bloodbank-dash-chip">
              <FaMapMarkerAlt /> {profile.city}
              {profile.district ? `, ${profile.district}` : ''}
              {profile.state ? `, ${profile.state}` : ''}
            </span>
            <span className={`bloodbank-dash-status ${statusMeta.className}`}>
              {statusMeta.icon} {statusMeta.label}
            </span>
          </div>
        </div>
        <div className="bloodbank-dash-hero-art" aria-hidden="true">
          <span className="bloodbank-dash-hero-drop"><FaHeartbeat /></span>
          <span className="bloodbank-dash-hero-total">
            <strong>{dataLoading ? '…' : totalUnits}</strong>
            <small>Total units</small>
          </span>
        </div>
      </section>

      {dataError && (
        <div className="bloodbank-dash-data-error">
          <FaExclamationTriangle /> {dataError}
          <button type="button" onClick={retryData}>Retry</button>
        </div>
      )}

      <div className="bloodbank-stats-grid">
        {STAT_CARDS.map((card) => (
          <BloodBankStatCard
            key={card.title}
            icon={card.icon}
            title={card.title}
            description={card.description}
            loader={card.loader}
          />
        ))}
      </div>

      <div className="bloodbank-dash-layout">
        <div className="bloodbank-dash-main-col">
          <section className="bloodbank-dash-panel">
            <div className="bloodbank-dash-panel-head">
              <div className="bloodbank-dash-panel-title"><FaBoxes /> Blood Inventory Status</div>
              <Link to="/blood-bank/inventory" className="bloodbank-dash-panel-link">
                View Inventory <FaChevronRight />
              </Link>
            </div>

            {dataLoading ? (
              <div className="bloodbank-dash-skeleton-inv">
                <div className="bloodbank-dash-skeleton-line" />
                <div className="bloodbank-dash-skeleton-line" />
                <div className="bloodbank-dash-skeleton-line" />
              </div>
            ) : totalUnits === 0 ? (
              <div className="bloodbank-dash-empty">
                <FaTint />
                <p>No stock recorded yet. Add units to any blood group to begin.</p>
              </div>
            ) : (
              <div className="bloodbank-dash-inv-grid">
                {groups.map((group) => {
                  const meta =
                    INVENTORY_STATUS_META[group.status] || INVENTORY_STATUS_META.OUT_OF_STOCK
                  const width = Math.min(100, (group.unitsAvailable / maxUnits) * 100)
                  return (
                    <div className="bloodbank-dash-inv-item" key={group.bloodGroup}>
                      <div className="bloodbank-dash-inv-top">
                        <span className="bloodbank-dash-inv-group">{group.bloodGroup}</span>
                        <span className={`bloodbank-dash-inv-status ${meta.className}`}>{meta.label}</span>
                      </div>
                      <div className="bloodbank-dash-inv-units">
                        <strong>{group.unitsAvailable}</strong>
                        <span>units</span>
                      </div>
                      <div className="bloodbank-dash-inv-track">
                        <span
                          className="bloodbank-dash-inv-fill"
                          style={{ width: `${width}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>

          <section className="bloodbank-dash-panel">
            <div className="bloodbank-dash-panel-head">
              <div className="bloodbank-dash-panel-title"><FaClipboardList /> Recent Blood Requests</div>
              <Link to="/blood-bank/requests" className="bloodbank-dash-panel-link">
                View All <FaChevronRight />
              </Link>
            </div>

            {dataLoading ? (
              <div className="bloodbank-dash-skeleton-inv">
                <div className="bloodbank-dash-skeleton-line" />
                <div className="bloodbank-dash-skeleton-line" />
                <div className="bloodbank-dash-skeleton-line" />
              </div>
            ) : recentRequests.length === 0 ? (
              <div className="bloodbank-dash-empty">
                <FaClipboardList />
                <p>No blood requests yet. New requests from hospitals will appear here.</p>
              </div>
            ) : (
              <ul className="bloodbank-dash-req-list">
                {recentRequests.map((req) => {
                  const reqStatus = REQUEST_STATUS_META[req.status] || REQUEST_STATUS_META.submitted
                  const priority = PRIORITY_META[req.priority] || PRIORITY_META.standard
                  return (
                    <li className="bloodbank-dash-req-item" key={req.id}>
                      <span className="bloodbank-dash-req-group">{req.bloodGroup}</span>
                      <div className="bloodbank-dash-req-main">
                        <strong>{req.patientName}</strong>
                        <span>
                          <FaHospital /> {req.hospitalName}
                          {req.city ? ` · ${req.city}` : ''}
                        </span>
                      </div>
                      <div className="bloodbank-dash-req-side">
                        <span className={`bloodbank-dash-req-priority ${priority.className}`}>
                          {priority.label}
                        </span>
                        <span className={`bloodbank-dash-req-status ${reqStatus.className}`}>
                          {reqStatus.label}
                        </span>
                        <span className="bloodbank-dash-req-meta">
                          {req.units} unit{req.units > 1 ? 's' : ''} · {formatDate(req.requiredBy)}
                        </span>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        </div>

        <aside className="bloodbank-dash-side-col">
          <section className="bloodbank-dash-panel">
            <div className="bloodbank-dash-panel-head">
              <div className="bloodbank-dash-panel-title"><FaPlus /> Quick Actions</div>
            </div>
            <div className="bloodbank-dash-actions">
              {QUICK_ACTIONS.map((action) => (
                <Link to={action.to} className="bloodbank-dash-action" key={action.to}>
                  <span className="bloodbank-dash-action-icon">{action.icon}</span>
                  <span className="bloodbank-dash-action-text">
                    <strong>{action.label}</strong>
                    <small>{action.description}</small>
                  </span>
                  <FaArrowRight className="bloodbank-dash-action-arrow" />
                </Link>
              ))}
            </div>
          </section>

          <section className="bloodbank-dash-panel">
            <div className="bloodbank-dash-panel-head">
              <div className="bloodbank-dash-panel-title"><FaTint /> Blood Group Distribution</div>
            </div>

            {dataLoading ? (
              <div className="bloodbank-dash-skeleton-inv">
                <div className="bloodbank-dash-skeleton-line" />
                <div className="bloodbank-dash-skeleton-line" />
              </div>
            ) : !donut ? (
              <div className="bloodbank-dash-empty">
                <FaTint />
                <p>No inventory data to chart yet.</p>
              </div>
            ) : (
              <div className="bloodbank-dash-donut-wrap">
                <div className="bloodbank-dash-donut" style={{ background: donut.background }}>
                  <div className="bloodbank-dash-donut-hole">
                    <strong>{donut.total}</strong>
                    <span>units</span>
                  </div>
                </div>
                <ul className="bloodbank-dash-donut-legend">
                  {groups.map((group) => (
                    <li key={group.bloodGroup}>
                      <span
                        className="bloodbank-dash-legend-dot"
                        style={{ background: GROUP_COLORS[group.bloodGroup] }}
                      />
                      <span className="bloodbank-dash-legend-group">{group.bloodGroup}</span>
                      <span className="bloodbank-dash-legend-units">{group.unitsAvailable}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          <section className="bloodbank-dash-panel">
            <div className="bloodbank-dash-panel-head">
              <div className="bloodbank-dash-panel-title"><FaBell /> Alerts &amp; Notifications</div>
            </div>

            {dataLoading ? (
              <div className="bloodbank-dash-skeleton-inv">
                <div className="bloodbank-dash-skeleton-line" />
                <div className="bloodbank-dash-skeleton-line" />
              </div>
            ) : alerts.length === 0 ? (
              <div className="bloodbank-dash-empty bloodbank-dash-empty--ok">
                <FaCheckCircle />
                <p>No new alerts. All clear.</p>
              </div>
            ) : (
              <ul className="bloodbank-dash-alerts">
                {alerts.map((alert) => (
                  <li className={`bloodbank-dash-alert bloodbank-dash-alert--${alert.tone}`} key={alert.key}>
                    <span className="bloodbank-dash-alert-icon">{alert.icon}</span>
                    <div className="bloodbank-dash-alert-body">
                      <strong>{alert.title}</strong>
                      <p>{alert.text}</p>
                      {alert.to && (
                        <Link to={alert.to}>Review <FaChevronRight /></Link>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>
    </div>
  )
}

export default BloodBankDashboard
