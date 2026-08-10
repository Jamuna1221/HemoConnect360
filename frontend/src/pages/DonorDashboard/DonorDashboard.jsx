import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar/Navbar'
import Footer from '../../components/Footer/Footer'
import heroPattern from '../../assets/donor-dashboard/hero-pattern.png'
import donorHero from '../../assets/donor-dashboard/donor-hero.png'
import bloodBag from '../../assets/donor-dashboard/blood-bag.png'
import { getSupabase } from '../../lib/supabase'
import { fetchDonorProfile, fetchDonationHistory, recordDonation } from '../../services/donorService'
import {
  FaHeart,
  FaTint,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaClock,
  FaBell,
  FaShieldAlt,
  FaHandHoldingHeart,
  FaCheckCircle,
  FaPhoneAlt,
  FaEnvelope,
  FaWhatsapp,
  FaHospital,
  FaClipboardList,
  FaAward,
  FaUsers,
  FaHeartbeat,
  FaIdCard,
  FaExclamationTriangle,
  FaStar,
  FaMapPin,
  FaChevronRight,
  FaUser,
  FaUserCircle,
  FaWeight,
} from 'react-icons/fa'
import './DonorDashboard.css'

const QUICK_ACTIONS = [
  { icon: <FaClipboardList />, title: 'Update Profile', desc: 'Keep your information current', path: '/donor/register', color: '#E53935' },
  { icon: <FaMapMarkerAlt />, title: 'Find Blood Bank', desc: 'Locate nearest donation center', path: '/', color: '#22C55E' },
  { icon: <FaCalendarAlt />, title: 'Schedule Donation', desc: 'Book your next appointment', path: '/', color: '#3B82F6' },
  { icon: <FaBell />, title: 'Alert Preferences', desc: 'Manage notification settings', path: '/', color: '#F59E0B' }
]

const HERO_STATS = [
  { icon: <FaHeart />, value: null, label: 'Lives Impacted', color: '#E53935' },
  { icon: <FaTint />, value: null, label: 'Total Donations', color: '#22C55E' },
  { icon: <FaAward />, value: null, label: 'Reward Points', color: '#F59E0B' }
]

const HEALTH_TIPS = [
  { icon: <FaTint />, title: 'Stay Hydrated', desc: 'Drink plenty of water before and after donation to help your body recover quickly.' },
  { icon: <FaHeart />, title: 'Eat Iron-Rich Foods', desc: 'Include spinach, beans, and red meat in your diet to maintain healthy iron levels.' },
  { icon: <FaShieldAlt />, title: 'Rest Well', desc: 'Get adequate sleep the night before donation and avoid strenuous activity afterward.' }
]

const BLOOD_REQUESTS = [
  { id: 1, bloodGroup: 'O+', hospital: 'Central Hospital', distance: '2.3 km', priority: 'urgent', date: '2026-07-25' },
  { id: 2, bloodGroup: 'A+', hospital: 'City Medical Center', distance: '5.1 km', priority: 'high', date: '2026-07-26' },
  { id: 3, bloodGroup: 'B+', hospital: 'St. Mary\'s Hospital', distance: '8.7 km', priority: 'normal', date: '2026-07-28' },
  { id: 4, bloodGroup: 'AB-', hospital: 'National Blood Bank', distance: '3.4 km', priority: 'urgent', date: '2026-07-29' }
]

const DONATION_CAMPS = [
  { id: 1, name: 'Community Blood Drive', date: '2026-08-10', time: '9:00 AM - 4:00 PM', location: 'Central Hospital Grounds', organizer: 'Red Cross Society' },
  { id: 2, name: 'Corporate Blood Camp', date: '2026-08-22', time: '10:00 AM - 3:00 PM', location: 'Tech Park Auditorium', organizer: 'HemoConnect360' },
  { id: 3, name: 'University Blood Drive', date: '2026-09-05', time: '8:00 AM - 2:00 PM', location: 'State University Campus', organizer: 'Youth Red Cross' }
]

const REWARDS = [
  { id: 1, title: 'First Donation', desc: 'Completed your first blood donation', icon: <FaHeart />, earned: true },
  { id: 2, title: 'Life Saver', desc: 'Saved 3 lives through donations', icon: <FaAward />, earned: true },
  { id: 3, title: 'Regular Donor', desc: 'Donated 3 times in one year', icon: <FaStar />, earned: false },
  { id: 4, title: 'Hero Badge', desc: 'Reach 10 total donations', icon: <FaShieldAlt />, earned: false }
]

const EMERGENCY_ALERTS = [
  { id: 1, title: 'Critical O- Shortage', message: 'Immediate O- blood donors needed at City Hospital. Only 2 units remaining.', time: '2 hours ago', severity: 'critical' },
  { id: 2, title: 'Blood Camp This Weekend', message: 'Community blood drive at Central Hospital on Aug 10. Your support needed!', time: '1 day ago', severity: 'info' }
]

const formatDate = (value) => {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

const getFirstName = (fullName) => (fullName || '').trim().split(/\s+/)[0] || 'Donor'

const getInitials = (fullName) => {
  const parts = (fullName || '').trim().split(/\s+/).filter(Boolean)
  const first = parts[0] ? parts[0][0] : ''
  const last = parts.length > 1 ? parts[parts.length - 1][0] : ''
  return (first + last).toUpperCase() || 'HC'
}

const getDonorCode = (id) => {
  if (!id) return 'HC-PENDING'
  return `HC-${id.replace(/-/g, '').slice(0, 8).toUpperCase()}`
}

const getNextEligible = (lastDonation) => {
  if (!lastDonation) return null
  const date = new Date(lastDonation)
  if (Number.isNaN(date.getTime())) return null
  date.setDate(date.getDate() + 90)
  return date
}

const capitalize = (value) => {
  if (!value) return '—'
  return value.charAt(0).toUpperCase() + value.slice(1)
}

const DonorDashboard = () => {
  const navigate = useNavigate()
  const [donor, setDonor] = useState(null)
  const [daysLeft, setDaysLeft] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [donations, setDonations] = useState([])
  const [showRecordForm, setShowRecordForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [donationError, setDonationError] = useState('')
  const [donationSuccess, setDonationSuccess] = useState('')
  const [recordForm, setRecordForm] = useState({ donationDate: '', bloodBank: '', city: '', units: '1', notes: '' })

  const handleRecordFormChange = (e) => {
    setRecordForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmitDonation = async (e) => {
    e.preventDefault()
    setSaving(true)
    setDonationError('')
    setDonationSuccess('')
    try {
      const saved = await recordDonation({
        donationDate: recordForm.donationDate,
        bloodBank: recordForm.bloodBank,
        city: recordForm.city,
        units: recordForm.units,
        notes: recordForm.notes,
      })
      const refreshed = await fetchDonationHistory()
      setDonations(refreshed)
      setDonor((prev) => ({ ...prev, last_donation: saved.donation_date }))
      setRecordForm({ donationDate: '', bloodBank: '', city: '', units: '1', notes: '' })
      setShowRecordForm(false)
      setDonationSuccess('Donation recorded. Your history and eligibility are now updated.')
    } catch (err) {
      setDonationError(err.message || 'Unable to record the donation.')
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    let active = true

    const loadDashboard = async () => {
      try {
        const supabase = getSupabase()
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) throw sessionError

        if (!session?.user) {
          navigate('/donor/login', { replace: true })
          return
        }

        const { donor: data, error: donorError } = await fetchDonorProfile(supabase, session.user.id)

        if (donorError) {
          console.error('[donor-dashboard] Donor profile query failed', { userId: session.user.id, error: donorError })
          throw donorError
        }

        if (!active) return

        if (!data) {
          console.warn('[donor-dashboard] No donor profile found', { userId: session.user.id })
          setError('No donor profile found for this account.')
          setLoading(false)
          return
        }

        console.info('[donor-dashboard] Donor profile loaded', { userId: session.user.id, donorId: data.id })

        const next = getNextEligible(data.last_donation)
        const left = next
          ? Math.max(0, Math.ceil((next.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
          : null

        const history = await fetchDonationHistory()
        if (!active) return

        setDonations(history)
        setDonor(data)
        setDaysLeft(left)
        setLoading(false)
      } catch {
        if (active) {
          setError('Unable to load your dashboard. Please try again.')
          setLoading(false)
        }
      }
    }

    loadDashboard()
    return () => { active = false }
  }, [navigate])

  if (loading) {
    return (
      <div className="donor-dash-page">
        <Navbar />
        <main className="donor-dash-main">
          <div className="donor-dash-loading">
            <div className="donor-dash-spinner" />
            <p>Loading your dashboard...</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (error) {
    return (
      <div className="donor-dash-page">
        <Navbar />
        <main className="donor-dash-main">
          <div className="donor-dash-loading donor-dash-error">
            <div className="donor-dash-error-icon"><FaExclamationTriangle /></div>
            <h2>Something went wrong</h2>
            <p>{error}</p>
            <Link to="/donor/login" className="donor-dash-btn-outline">Back to Login</Link>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const firstName = getFirstName(donor.full_name)
  const nextEligible = getNextEligible(donor.last_donation)

  const totalUnits = donations.reduce((sum, d) => sum + (Number(d.units) || 0), 0)
  const rewardPoints = donations.reduce((sum, d) => sum + (Number(d.units) || 0) * 250, 0)
  const heroStats = HERO_STATS.map((stat) => {
    if (stat.label === 'Total Donations') return { ...stat, value: String(totalUnits) }
    if (stat.label === 'Lives Impacted') return { ...stat, value: String(totalUnits) }
    if (stat.label === 'Reward Points') return { ...stat, value: String(rewardPoints) }
    return stat
  })
  const impactStats = [
    { iconClass: 'donor-dash-impact-stat-icon--red', icon: <FaHeart />, num: String(totalUnits), text: 'Lives Saved' },
    { iconClass: 'donor-dash-impact-stat-icon--green', icon: <FaTint />, num: `${totalUnits}L`, text: 'Blood Donated' },
    { iconClass: 'donor-dash-impact-stat-icon--blue', icon: <FaUsers />, num: String(totalUnits), text: 'Families Helped' },
    { iconClass: 'donor-dash-impact-stat-icon--purple', icon: <FaAward />, num: String(rewardPoints), text: 'Reward Points' }
  ]

  return (
    <div className="donor-dash-page">
      <Navbar />
      <main className="donor-dash-main">
        <div className="donor-dash-container">

          <div className="donor-dash-hero">
            <div className="donor-dash-hero-left">
              <span className="donor-dash-badge"><FaHeart /> Registered Donor</span>
              <h1 className="donor-dash-hero-heading">
                Welcome back, <span className="donor-dash-hero-name">{firstName}!</span>
              </h1>
              <p className="donor-dash-hero-appreciation">
                Thank you for being a life saver. Your generous donations are making a real difference in people's lives.
              </p>
              <div className="donor-dash-hero-stats">
                {heroStats.map((stat) => (
                  <div key={stat.label} className="donor-dash-hero-stat-card">
                    <div className="donor-dash-hero-stat-icon" style={{ background: `${stat.color}15`, color: stat.color }}>
                      {stat.icon}
                    </div>
                    <div className="donor-dash-hero-stat-info">
                      <span className="donor-dash-hero-stat-value">{stat.value}</span>
                      <span className="donor-dash-hero-stat-label">{stat.label}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="donor-dash-hero-right">
              <div className="donor-dash-hero-pattern" style={{ backgroundImage: `url(${heroPattern})` }}></div>
              <img src={donorHero} alt="Donor Hero" className="donor-dash-hero-illustration" />
            </div>
          </div>

          <div className="donor-dash-info-grid">
            <div className="donor-dash-info-card">
              <div className="donor-dash-info-icon donor-dash-info-icon--blue">
                <FaCalendarAlt />
              </div>
              <div className="donor-dash-info-content">
                <span className="donor-dash-info-label">Next Eligible Donation</span>
                <span className="donor-dash-info-value">
                  {nextEligible ? formatDate(nextEligible) : 'Eligible Now'}
                </span>
                <span className="donor-dash-info-sub">
                  {nextEligible
                    ? (daysLeft > 0 ? `${daysLeft} days remaining` : 'You are eligible to donate')
                    : 'New donor — you are ready'}
                </span>
              </div>
            </div>
            <div className="donor-dash-info-card">
              <div className="donor-dash-info-icon donor-dash-info-icon--red">
                <FaTint />
              </div>
              <div className="donor-dash-info-content">
                <span className="donor-dash-info-label">Blood Group</span>
                <span className="donor-dash-info-value">{donor.blood_group}</span>
                <span className="donor-dash-info-sub">
                  {['O+', 'O-'].includes(donor.blood_group) ? 'Universal donor' : 'Registered donor'}
                </span>
              </div>
            </div>
            <div className="donor-dash-info-card">
              <div className="donor-dash-info-icon donor-dash-info-icon--purple">
                <FaIdCard />
              </div>
              <div className="donor-dash-info-content">
                <span className="donor-dash-info-label">Donor ID</span>
                <span className="donor-dash-info-value">{getDonorCode(donor.id)}</span>
                <span className="donor-dash-info-sub">Registered donor</span>
              </div>
            </div>
            <div className="donor-dash-info-card">
              <div className="donor-dash-info-icon donor-dash-info-icon--green">
                <FaHeartbeat />
              </div>
              <div className="donor-dash-info-content">
                <span className="donor-dash-info-label">Health Status</span>
                <span className="donor-dash-info-value">Excellent</span>
                <span className="donor-dash-info-sub">Cleared to donate</span>
              </div>
            </div>
          </div>

          <div className="donor-dash-section donor-dash-profile-section">
            <div className="donor-dash-section-header">
              <h2><FaUserCircle /> Donor Profile</h2>
            </div>
            <div className="donor-dash-profile-card">
              <div className="donor-dash-profile-avatar">
                {donor.profile_pic
                  ? <img src={donor.profile_pic} alt={donor.full_name} />
                  : <span>{getInitials(donor.full_name)}</span>}
              </div>
              <div className="donor-dash-profile-head">
                <h3>{donor.full_name}</h3>
                <p>{donor.blood_group} &bull; {donor.status === 'active' ? 'Active Donor' : capitalize(donor.status)}</p>
              </div>
            </div>
            <div className="donor-dash-info-grid donor-dash-profile-grid">
              <div className="donor-dash-info-card">
                <div className="donor-dash-info-icon donor-dash-info-icon--blue">
                  <FaEnvelope />
                </div>
                <div className="donor-dash-info-content">
                  <span className="donor-dash-info-label">Email</span>
                  <span className="donor-dash-info-value donor-dash-info-value--small">{donor.email || '—'}</span>
                </div>
              </div>
              <div className="donor-dash-info-card">
                <div className="donor-dash-info-icon donor-dash-info-icon--green">
                  <FaPhoneAlt />
                </div>
                <div className="donor-dash-info-content">
                  <span className="donor-dash-info-label">Phone</span>
                  <span className="donor-dash-info-value">{donor.phone || '—'}</span>
                </div>
              </div>
              <div className="donor-dash-info-card">
                <div className="donor-dash-info-icon donor-dash-info-icon--red">
                  <FaMapMarkerAlt />
                </div>
                <div className="donor-dash-info-content">
                  <span className="donor-dash-info-label">City</span>
                  <span className="donor-dash-info-value">
                    {donor.city ? `${donor.city}${donor.state ? `, ${donor.state}` : ''}` : '—'}
                  </span>
                </div>
              </div>
              <div className="donor-dash-info-card">
                <div className="donor-dash-info-icon donor-dash-info-icon--purple">
                  <FaUser />
                </div>
                <div className="donor-dash-info-content">
                  <span className="donor-dash-info-label">Gender</span>
                  <span className="donor-dash-info-value">{capitalize(donor.gender)}</span>
                </div>
              </div>
              <div className="donor-dash-info-card">
                <div className="donor-dash-info-icon donor-dash-info-icon--purple">
                  <FaWeight />
                </div>
                <div className="donor-dash-info-content">
                  <span className="donor-dash-info-label">Weight</span>
                  <span className="donor-dash-info-value">{donor.weight ? `${donor.weight} kg` : '—'}</span>
                </div>
              </div>
              <div className="donor-dash-info-card">
                <div className="donor-dash-info-icon donor-dash-info-icon--red">
                  <FaHeartbeat />
                </div>
                <div className="donor-dash-info-content">
                  <span className="donor-dash-info-label">Hemoglobin</span>
                  <span className="donor-dash-info-value">{donor.hemoglobin ? `${donor.hemoglobin} g/dL` : '—'}</span>
                </div>
              </div>
              <div className="donor-dash-info-card">
                <div className="donor-dash-info-icon donor-dash-info-icon--blue">
                  <FaCalendarAlt />
                </div>
                <div className="donor-dash-info-content">
                  <span className="donor-dash-info-label">Last Donation</span>
                  <span className="donor-dash-info-value">{formatDate(donor.last_donation) || 'Not yet donated'}</span>
                </div>
              </div>
              <div className="donor-dash-info-card">
                <div className="donor-dash-info-icon donor-dash-info-icon--green">
                  <FaIdCard />
                </div>
                <div className="donor-dash-info-content">
                  <span className="donor-dash-info-label">Registration Date</span>
                  <span className="donor-dash-info-value">{formatDate(donor.created_at) || '—'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="donor-dash-section">
            <div className="donor-dash-section-header">
              <h2>Quick Actions</h2>
            </div>
            <div className="donor-dash-actions-grid">
              {QUICK_ACTIONS.map((action) => (
                <Link key={action.title} to={action.path} className="donor-dash-action-card">
                  <div className="donor-dash-action-icon" style={{ background: `${action.color}15`, color: action.color }}>
                    {action.icon}
                  </div>
                  <h3>{action.title}</h3>
                  <p>{action.desc}</p>
                  <span className="donor-dash-action-arrow"><FaChevronRight /></span>
                </Link>
              ))}
            </div>
          </div>

          <div className="donor-dash-two-col">
            <div className="donor-dash-section">
              <div className="donor-dash-section-header">
                <h2><FaClock /> Donation History</h2>
                <div className="donor-dash-history-actions">
                  <button
                    type="button"
                    className="donor-dash-btn-outline"
                    onClick={() => { setShowRecordForm((v) => !v); setDonationError(''); setDonationSuccess('') }}
                  >
                    {showRecordForm ? 'Cancel' : 'Record Donation'}
                  </button>
                </div>
              </div>

              {donationSuccess && (
                <div className="donor-dash-alert donor-dash-alert--success">
                  <FaCheckCircle /> {donationSuccess}
                </div>
              )}
              {donationError && (
                <div className="donor-dash-alert donor-dash-alert--error">
                  <FaExclamationTriangle /> {donationError}
                </div>
              )}

              {showRecordForm && (
                <form className="donor-dash-record-form" onSubmit={handleSubmitDonation}>
                  <div className="donor-dash-record-form-grid">
                    <label className="donor-dash-record-field">
                      <span>Donation Date</span>
                      <input
                        type="date"
                        name="donationDate"
                        value={recordForm.donationDate}
                        onChange={handleRecordFormChange}
                        required
                        max={new Date().toISOString().slice(0, 10)}
                      />
                    </label>
                    <label className="donor-dash-record-field">
                      <span>Blood Bank / Center</span>
                      <input
                        type="text"
                        name="bloodBank"
                        value={recordForm.bloodBank}
                        onChange={handleRecordFormChange}
                        placeholder="e.g. Central Blood Bank"
                        required
                      />
                    </label>
                    <label className="donor-dash-record-field">
                      <span>City</span>
                      <input
                        type="text"
                        name="city"
                        value={recordForm.city}
                        onChange={handleRecordFormChange}
                        placeholder="e.g. Colombo"
                      />
                    </label>
                    <label className="donor-dash-record-field">
                      <span>Units</span>
                      <input
                        type="number"
                        name="units"
                        value={recordForm.units}
                        onChange={handleRecordFormChange}
                        min="1"
                        max="5"
                        required
                      />
                    </label>
                    <label className="donor-dash-record-field donor-dash-record-field--full">
                      <span>Notes (optional)</span>
                      <input
                        type="text"
                        name="notes"
                        value={recordForm.notes}
                        onChange={handleRecordFormChange}
                        placeholder="e.g. Platelet donation"
                      />
                    </label>
                  </div>
                  <div className="donor-dash-record-form-actions">
                    <button type="button" className="donor-dash-camp-register" onClick={() => setShowRecordForm(false)}>Cancel</button>
                    <button type="submit" className="donor-dash-thankyou-btn" disabled={saving}>
                      {saving ? 'Saving...' : 'Save Donation'}
                    </button>
                  </div>
                </form>
              )}

              {donations.length === 0 ? (
                <div className="donor-dash-empty">
                  <FaTint />
                  <p>No donations recorded yet. Use &quot;Record Donation&quot; to add your donation history.</p>
                </div>
              ) : (
                <div className="donor-dash-timeline">
                  {donations.map((donation, idx) => (
                    <div key={donation.id} className="donor-dash-timeline-item">
                      <div className="donor-dash-timeline-line">
                        <div className="donor-dash-timeline-dot"></div>
                        {idx < donations.length - 1 && <div className="donor-dash-timeline-connector"></div>}
                      </div>
                      <div className="donor-dash-timeline-card">
                        <div className="donor-dash-timeline-top">
                          <span className="donor-dash-timeline-date">{new Date(donation.donation_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                          <span className="donor-dash-timeline-badge donor-dash-timeline-badge--completed"><FaCheckCircle /> Completed</span>
                        </div>
                        <h4 className="donor-dash-timeline-title">{donation.blood_bank}</h4>
                        <p className="donor-dash-timeline-meta">
                          <FaMapMarkerAlt /> {donation.city || 'Blood Bank'} &bull; {donation.units} unit{Number(donation.units) > 1 ? 's' : ''} donated{donation.notes ? ` &bull; ${donation.notes}` : ''}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="donor-dash-section">
              <div className="donor-dash-section-header">
                <h2><FaHospital /> Recent Blood Requests</h2>
                <Link to="/" className="donor-dash-view-all">View All <FaChevronRight /></Link>
              </div>
              <div className="donor-dash-requests-list">
                {BLOOD_REQUESTS.map((req) => (
                  <div key={req.id} className="donor-dash-request-card">
                    <div className="donor-dash-request-top">
                      <span className="donor-dash-request-blood-group">
                        <FaTint /> {req.bloodGroup}
                      </span>
                      <span className={`donor-dash-request-priority donor-dash-request-priority--${req.priority}`}>
                        {req.priority}
                      </span>
                    </div>
                    <h4 className="donor-dash-request-hospital">{req.hospital}</h4>
                    <div className="donor-dash-request-bottom">
                      <span className="donor-dash-request-distance"><FaMapMarkerAlt /> {req.distance}</span>
                      <span className="donor-dash-request-date"><FaCalendarAlt /> {new Date(req.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    </div>
                  </div>
                ))}
              </div>
              <Link to="/" className="donor-dash-btn-outline">
                <FaChevronRight /> View All Blood Requests
              </Link>
            </div>
          </div>

          <div className="donor-dash-impact-section">
            <div className="donor-dash-impact-left">
              <span className="donor-dash-impact-tag"><FaHandHoldingHeart /> Your Impact</span>
              <h2 className="donor-dash-impact-heading">Making a Real Difference</h2>
              <p className="donor-dash-impact-desc">
                Every donation you make helps save lives and strengthen communities. Track your contribution and see the positive impact you've created.
              </p>
              <div className="donor-dash-impact-stats-grid">
                {impactStats.map((stat) => (
                  <div key={stat.text} className="donor-dash-impact-stat-card">
                    <div className={`donor-dash-impact-stat-icon ${stat.iconClass}`}>{stat.icon}</div>
                    <div className="donor-dash-impact-stat-num">{stat.num}</div>
                    <div className="donor-dash-impact-stat-text">{stat.text}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="donor-dash-impact-right">
              <img src={bloodBag} alt="Your Impact" className="donor-dash-impact-image" />
            </div>
          </div>

          <div className="donor-dash-section">
            <div className="donor-dash-section-header">
              <h2><FaHeartbeat /> Health Tips for Donors</h2>
            </div>
            <div className="donor-dash-tips-grid">
              {HEALTH_TIPS.map((tip) => (
                <div key={tip.title} className="donor-dash-tip-card">
                  <div className="donor-dash-tip-icon">{tip.icon}</div>
                  <h4>{tip.title}</h4>
                  <p>{tip.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="donor-dash-section">
            <div className="donor-dash-section-header">
              <h2><FaPhoneAlt /> Emergency Contact</h2>
            </div>
            <div className="donor-dash-contact-grid">
              <a href="tel:18001801234" className="donor-dash-contact-card">
                <FaPhoneAlt />
                <h4>24/7 Helpline</h4>
                <p>1800-180-1234</p>
              </a>
              <a href="mailto:support@hemoconnect360.com" className="donor-dash-contact-card">
                <FaEnvelope />
                <h4>Email Support</h4>
                <p>support@hemoconnect360.com</p>
              </a>
              <a href="https://wa.me/94771234567" className="donor-dash-contact-card" target="_blank" rel="noopener noreferrer">
                <FaWhatsapp />
                <h4>WhatsApp</h4>
                <p>Chat with us</p>
              </a>
            </div>
          </div>

          <div className="donor-dash-bottom-grid">

            <div className="donor-dash-section">
              <div className="donor-dash-section-header">
                <h2><FaCalendarAlt /> Upcoming Donation Camps</h2>
              </div>
              <div className="donor-dash-camps-list">
                {DONATION_CAMPS.map((camp) => (
                  <div key={camp.id} className="donor-dash-camp-card">
                    <div className="donor-dash-camp-top">
                      <div className="donor-dash-camp-date-block">
                        <span className="donor-dash-camp-month">{new Date(camp.date).toLocaleDateString('en-US', { month: 'short' })}</span>
                        <span className="donor-dash-camp-day">{new Date(camp.date).getDate()}</span>
                      </div>
                      <div className="donor-dash-camp-info">
                        <h4>{camp.name}</h4>
                        <p className="donor-dash-camp-meta"><FaClock /> {camp.time}</p>
                        <p className="donor-dash-camp-meta"><FaMapPin /> {camp.location}</p>
                        <p className="donor-dash-camp-organizer"><FaUsers /> {camp.organizer}</p>
                      </div>
                    </div>
                    <button className="donor-dash-camp-register">Register</button>
                  </div>
                ))}
              </div>
            </div>

            <div className="donor-dash-section">
              <div className="donor-dash-section-header">
                <h2><FaAward /> Rewards & Badges</h2>
              </div>
              <div className="donor-dash-rewards-list">
                {REWARDS.map((reward) => (
                  <div key={reward.id} className={`donor-dash-reward-card ${reward.earned ? 'donor-dash-reward-card--earned' : 'donor-dash-reward-card--locked'}`}>
                    <div className="donor-dash-reward-icon">
                      {reward.icon}
                      {reward.earned && <span className="donor-dash-reward-check"><FaCheckCircle /></span>}
                    </div>
                    <div className="donor-dash-reward-info">
                      <h4>{reward.title}</h4>
                      <p>{reward.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link to="/" className="donor-dash-btn-outline">
                <FaChevronRight /> View All Rewards
              </Link>
            </div>

            <div className="donor-dash-section">
              <div className="donor-dash-section-header">
                <h2><FaExclamationTriangle /> Emergency Alerts</h2>
              </div>
              <div className="donor-dash-alerts-list">
                {EMERGENCY_ALERTS.map((alert) => (
                  <div key={alert.id} className={`donor-dash-alert-card donor-dash-alert-card--${alert.severity}`}>
                    <div className="donor-dash-alert-header">
                      <span className={`donor-dash-alert-badge donor-dash-alert-badge--${alert.severity}`}>
                        {alert.severity === 'critical' ? <FaExclamationTriangle /> : <FaBell />}
                        {alert.severity}
                      </span>
                      <span className="donor-dash-alert-time">{alert.time}</span>
                    </div>
                    <h4>{alert.title}</h4>
                    <p>{alert.message}</p>
                  </div>
                ))}
              </div>
              <button className="donor-dash-btn-help" onClick={() => window.location.href = 'tel:18001801234'}>
                <FaPhoneAlt /> Help Now
              </button>
            </div>

          </div>

          <div className="donor-dash-thankyou">
            <div className="donor-dash-thankyou-left">
              <div className="donor-dash-thankyou-icon">
                <FaHeart />
              </div>
              <div className="donor-dash-thankyou-text">
                <h2>Thank you for being a lifesaver!</h2>
                <p>Your generosity brings hope and healing to those in need. Every drop counts, and your contribution makes a lasting impact on the community.</p>
              </div>
            </div>
            <div className="donor-dash-thankyou-right">
              <Link to="/" className="donor-dash-thankyou-btn">
                <FaUsers /> Refer a Friend
              </Link>
            </div>
          </div>

        </div>
      </main>
      <Footer />
    </div>
  )
}

export default DonorDashboard
