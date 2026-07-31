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

const SUMMARY = [
  { icon: <FaUser />, label: 'Full Name', value: 'Arun Kumar' },
  { icon: <FaTint />, label: 'Blood Group', value: 'B+' },
  { icon: <FaPhone />, label: 'Phone Number', value: '+91 98765 43210' },
  { icon: <FaEnvelope />, label: 'Email Address', value: 'arun.kumar@email.com' },
  { icon: <FaMapMarkerAlt />, label: 'Location', value: 'Chennai, Tamil Nadu' },
  { icon: <FaIdCard />, label: 'Registration ID', value: 'HC-2026-0741' },
  { icon: <FaCalendarAlt />, label: 'Registered On', value: '27 July 2026' },
]

const RegistrationSummary = () => {
  return (
    <section className="reg-summary">
      <h2 className="reg-summary__heading">Your Registration Summary</h2>

      <div className="reg-summary__card">
        {SUMMARY.map((item, index) => (
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
