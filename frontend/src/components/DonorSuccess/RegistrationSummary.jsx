import {
  FaUser,
  FaTint,
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaIdCard,
  FaCalendarAlt,
  FaShieldAlt,
} from 'react-icons/fa'
import './RegistrationSummary.css'

const formatId = (id) => {
  if (!id) return '—'
  return 'HC-' + id.replace(/-/g, '').slice(0, 8).toUpperCase()
}

const formatDate = (iso) => {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
}

const RegistrationSummary = ({ donor, loading, error }) => {
  if (!donor) {
    const message = error || (loading ? 'Loading your registration details...' : 'No registration details available.')
    return (
      <section className="reg-summary">
        <h2 className="reg-summary__heading">Your Registration Summary</h2>
        <div className="reg-summary__card">
          <p className="reg-summary__empty">{message}</p>
        </div>
      </section>
    )
  }

  const locationText = [donor.city, donor.state].filter(Boolean).join(', ')
  const summary = [
    { icon: <FaUser />, label: 'Full Name', value: donor.full_name || '—' },
    { icon: <FaTint />, label: 'Blood Group', value: donor.blood_group || '—' },
    { icon: <FaPhone />, label: 'Phone Number', value: donor.phone || '—' },
    { icon: <FaEnvelope />, label: 'Email Address', value: donor.email || '—' },
    { icon: <FaMapMarkerAlt />, label: 'Location', value: locationText || '—' },
    { icon: <FaIdCard />, label: 'Registration ID', value: formatId(donor.id) },
    { icon: <FaCalendarAlt />, label: 'Registered On', value: formatDate(donor.created_at) },
  ]

  return (
    <section className="reg-summary">
      <h2 className="reg-summary__heading">Your Registration Summary</h2>

      <div className="reg-summary__card">
        {summary.map((item, index) => (
          <div className="reg-summary__row" key={index}>
            <div className="reg-summary__icon">{item.icon}</div>
            <div className="reg-summary__info">
              <span className="reg-summary__label">{item.label}</span>
              <span className="reg-summary__value">{item.value}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="reg-summary__privacy">
        <div className="reg-summary__privacy-icon">
          <FaShieldAlt />
        </div>
        <div className="reg-summary__privacy-content">
          <h4 className="reg-summary__privacy-title">Your information is safe with us.</h4>
          <p className="reg-summary__privacy-text">
            We never share your data without your consent.
          </p>
        </div>
      </div>
    </section>
  )
}

export default RegistrationSummary
