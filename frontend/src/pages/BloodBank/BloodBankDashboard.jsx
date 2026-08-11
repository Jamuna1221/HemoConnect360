import { useEffect, useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import {
  FaHospital,
  FaSignOutAlt,
  FaHome,
  FaMapMarkerAlt,
  FaEnvelope,
  FaPhoneAlt,
  FaUserTie,
  FaCalendarAlt,
} from 'react-icons/fa'
import logo from '../../assets/logo/Hemoconnectlogo.png'
import { fetchBloodBankProfile } from '../../services/bloodBankService'
import { getSupabase } from '../../lib/supabase'
import BloodInventory from '../../components/BloodInventory'
import BloodRequests from '../../components/BloodRequests'
import './BloodBankDashboard.css'

const BloodBankDashboard = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [profile, setProfile] = useState(location.state?.bloodBank || null)
  const [loading, setLoading] = useState(!profile)
  const [error, setError] = useState('')
  const [inventoryReload, setInventoryReload] = useState(0)

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
        setError(err.message || 'Unable to load your blood bank profile.')
      } finally {
        if (active) setLoading(false)
      }
    }

    if (!profile) {
      load()
    }

    return () => {
      active = false
    }
  }, [navigate, profile])

  const handleLogout = async () => {
    await getSupabase().auth.signOut().catch(() => {})
    navigate('/')
  }

  if (loading) {
    return (
      <div className="bloodbank-dash-page">
        <main className="bloodbank-dash-main">
          <div className="bloodbank-dash-loading">
            <div className="bloodbank-dash-spinner" />
            <p>Loading your blood bank profile...</p>
          </div>
        </main>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bloodbank-dash-page">
        <main className="bloodbank-dash-main">
          <div className="bloodbank-dash-restricted bloodbank-dash-restricted--rejected">
            <div className="bloodbank-dash-restricted-icon">
              <FaHospital />
            </div>
            <h2>Unable to Load Profile</h2>
            <p>{error}</p>
            <Link to="/blood-bank/login" className="bloodbank-dash-primary-btn">Go to Login</Link>
          </div>
        </main>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="bloodbank-dash-page">
        <main className="bloodbank-dash-main">
          <div className="bloodbank-dash-restricted bloodbank-dash-restricted--rejected">
            <div className="bloodbank-dash-restricted-icon">
              <FaHospital />
            </div>
            <h2>No Blood Bank Profile</h2>
            <p>No blood bank profile was found for this account. Please register your blood bank first.</p>
            <Link to="/blood-bank/register" className="bloodbank-dash-primary-btn">Register Blood Bank</Link>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="bloodbank-dash-page">
      <header className="bloodbank-dash-header">
        <Link to="/" className="bloodbank-dash-logo">
          <img src={logo} alt="HemoConnect360" />
        </Link>
        <div className="bloodbank-dash-header-actions">
          <Link to="/" className="bloodbank-dash-ghost-btn"><FaHome /> Home</Link>
          <button type="button" className="bloodbank-dash-outline-btn" onClick={handleLogout}>
            <FaSignOutAlt /> Sign Out
          </button>
        </div>
      </header>

      <main className="bloodbank-dash-main">
        <div className="bloodbank-dash-welcome">
          <div>
            <span className="bloodbank-dash-eyebrow">Blood Bank Dashboard</span>
            <h1>{profile.bloodBankName}</h1>
            <p>Your blood bank is active on HemoConnect360.</p>
          </div>
        </div>

        <div className="bloodbank-dash-grid">
          <section className="bloodbank-dash-card">
            <div className="bloodbank-dash-card-title">
              <FaHospital /> Blood Bank Details
            </div>
            <dl className="bloodbank-dash-list">
              <div><dt>Type</dt><dd>{profile.bloodBankType}</dd></div>
              <div><dt>Registration Number</dt><dd>{profile.registrationNumber}</dd></div>
              <div><dt>Established</dt><dd><FaCalendarAlt /> {profile.establishedYear || '—'}</dd></div>
              <div><dt>Official Email</dt><dd><FaEnvelope /> {profile.officialEmail}</dd></div>
              <div><dt>Primary Phone</dt><dd><FaPhoneAlt /> {profile.primaryPhone}</dd></div>
            </dl>
          </section>

          <section className="bloodbank-dash-card">
            <div className="bloodbank-dash-card-title">
              <FaMapMarkerAlt /> Address
            </div>
            <p className="bloodbank-dash-address">
              {profile.addressLine}, {profile.city},
              {profile.district ? ` ${profile.district},` : ''} {profile.state} - {profile.pincode}
            </p>
            {profile.latitude && profile.longitude && (
              <p className="bloodbank-dash-coords">
                {profile.latitude}, {profile.longitude}
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
              <div><dt>Phone</dt><dd><FaPhoneAlt /> {profile.authorizedPersonPhone}</dd></div>
              {profile.authorizedPersonEmail && <div><dt>Email</dt><dd><FaEnvelope /> {profile.authorizedPersonEmail}</dd></div>}
            </dl>
          </section>
        </div>

        <BloodInventory reloadSignal={inventoryReload} />
        <BloodRequests onInventoryChanged={() => setInventoryReload((key) => key + 1)} />
      </main>
    </div>
  )
}

export default BloodBankDashboard
