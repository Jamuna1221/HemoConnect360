import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FaBoxes,
  FaCalendarAlt,
  FaCalendarCheck,
  FaCheckCircle,
  FaClock,
  FaEnvelope,
  FaExclamationTriangle,
  FaHeartbeat,
  FaHospital,
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaUserTie,
  FaUsers,
} from 'react-icons/fa'
import BloodBankStatCard from '../../components/BloodBank/BloodBankStatCard'
import {
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

const BloodBankDashboard = () => {
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

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

  const retry = () => {
    setError('')
    setLoading(true)
    setReloadKey((key) => key + 1)
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

  return (
    <div className="bloodbank-dash-page">
      <div className="bloodbank-dash-welcome">
        <div>
          <span className="bloodbank-dash-eyebrow">Blood Bank Dashboard</span>
          <h1>Welcome, {profile.bloodBankName}</h1>
          <p>Manage your blood inventory, blood requests, donors and collections from one place.</p>
        </div>
        <span className={`bloodbank-dash-status ${statusMeta.className}`}>
          {statusMeta.icon} {statusMeta.label}
        </span>
      </div>

      <div className="bloodbank-dash-grid">
        <section className="bloodbank-dash-card bloodbank-dash-card--wide">
          <div className="bloodbank-dash-card-title">
            <FaHospital /> Blood Bank Information
          </div>
          <dl className="bloodbank-dash-fields">
            <div>
              <dt>Blood Bank Name</dt>
              <dd>{profile.bloodBankName}</dd>
            </div>
            <div>
              <dt>Blood Bank Type</dt>
              <dd>{profile.bloodBankType}</dd>
            </div>
            <div>
              <dt>Registration Number</dt>
              <dd>{profile.registrationNumber}</dd>
            </div>
            <div>
              <dt>Established Year</dt>
              <dd><FaCalendarAlt /> {profile.establishedYear || '—'}</dd>
            </div>
            <div>
              <dt>Official Email</dt>
              <dd><FaEnvelope /> {profile.officialEmail}</dd>
            </div>
            <div>
              <dt>Primary Contact Number</dt>
              <dd><FaPhoneAlt /> {profile.primaryPhone}</dd>
            </div>
          </dl>
        </section>

        <section className="bloodbank-dash-card">
          <div className="bloodbank-dash-card-title">
            <FaMapMarkerAlt /> Location
          </div>
          <p className="bloodbank-dash-address">{profile.addressLine}</p>
          <p className="bloodbank-dash-address">
            {profile.city}
            {profile.district ? `, ${profile.district}` : ''}, {profile.state} - {profile.pincode}
          </p>
          {profile.latitude && profile.longitude && (
            <p className="bloodbank-dash-coords">
              <FaMapMarkerAlt /> {profile.latitude}, {profile.longitude}
            </p>
          )}
        </section>

        <section className="bloodbank-dash-card">
          <div className="bloodbank-dash-card-title">
            <FaUserTie /> Authorized Person
          </div>
          <dl className="bloodbank-dash-list">
            <div><dt>Name</dt><dd>{profile.authorizedPersonName}</dd></div>
            <div><dt>Designation</dt><dd>{profile.designation}</dd></div>
            <div><dt>Contact Number</dt><dd><FaPhoneAlt /> {profile.authorizedPersonPhone}</dd></div>
            <div><dt>Official Email</dt><dd><FaEnvelope /> {profile.authorizedPersonEmail || '—'}</dd></div>
          </dl>
        </section>
      </div>

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
    </div>
  )
}

export default BloodBankDashboard
