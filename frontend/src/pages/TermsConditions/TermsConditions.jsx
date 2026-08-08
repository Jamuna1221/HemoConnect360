import { Link } from 'react-router-dom'
import {
  FaHandshake,
  FaUserCheck,
  FaHeartbeat,
  FaStethoscope,
  FaShieldAlt,
  FaPhoneAlt,
  FaEdit,
  FaExclamationTriangle,
  FaHospital,
  FaCheckCircle,
  FaLock,
  FaArrowLeft,
} from 'react-icons/fa'
import Navbar from '../../components/Navbar/Navbar'
import Footer from '../../components/Footer/Footer'
import './TermsConditions.css'

const TERMS = [
  {
    icon: <FaHandshake />,
    title: 'Voluntary Donation',
    text: 'I confirm that my decision to donate blood is voluntary and without any form of coercion.',
  },
  {
    icon: <FaUserCheck />,
    title: 'Eligibility',
    text: 'I confirm that the information provided during registration is true and accurate to the best of my knowledge.',
  },
  {
    icon: <FaHeartbeat />,
    title: 'Health Declaration',
    text: 'I understand that I should donate blood only if I am in good health and meet the required eligibility criteria.',
  },
  {
    icon: <FaStethoscope />,
    title: 'Medical Screening',
    text: 'I understand that I may be required to undergo a basic health screening before blood donation.',
  },
  {
    icon: <FaShieldAlt />,
    title: 'Privacy',
    text: 'I consent to HemoConnect360 securely storing and processing my personal information solely for blood donation and emergency donor matching purposes.',
  },
  {
    icon: <FaPhoneAlt />,
    title: 'Contact Permission',
    text: 'I agree that HemoConnect360 may contact me through phone, SMS, or email regarding blood donation requests, appointment reminders, and important updates.',
  },
  {
    icon: <FaEdit />,
    title: 'Data Accuracy',
    text: 'I agree to keep my contact information and health details updated whenever changes occur.',
  },
  {
    icon: <FaExclamationTriangle />,
    title: 'Emergency Requests',
    text: 'I understand that receiving a blood donation request does not obligate me to donate if I am unavailable or medically ineligible at that time.',
  },
  {
    icon: <FaHospital />,
    title: 'Safety',
    text: 'I acknowledge that blood donation should always be performed at an authorized hospital, blood bank, or approved donation camp.',
  },
  {
    icon: <FaCheckCircle />,
    title: 'Acceptance',
    text: 'By registering, I confirm that I have read, understood, and agree to these Terms & Conditions.',
  },
]

const TermsConditions = () => {
  return (
    <div className="terms-page">
      <Navbar />
      <main className="terms-main">
        <div className="terms-container">
          <div className="terms-header">
            <h1 className="terms-header__brand">HemoConnect360</h1>
            <h2 className="terms-header__title">Donor Terms & Conditions</h2>
            <p className="terms-header__subtitle">
              Please read the following terms carefully before registering as a blood donor.
            </p>
          </div>

          <div className="terms-cards">
            {TERMS.map((term, index) => (
              <div className="terms-card" key={index}>
                <div className="terms-card__icon">{term.icon}</div>
                <div className="terms-card__content">
                  <h3 className="terms-card__title">{term.title}</h3>
                  <p className="terms-card__text">{term.text}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="terms-privacy">
            <div className="terms-privacy__icon">
              <FaLock />
            </div>
            <h3 className="terms-privacy__title">Privacy Notice</h3>
            <p className="terms-privacy__text">
              Your personal information will be used only to connect you with verified blood requests
              and emergency donor matching.
            </p>
            <p className="terms-privacy__text">
              HemoConnect360 will never share your information with unauthorized third parties.
            </p>
          </div>

          <div className="terms-action">
            <Link to="/donor/register" className="terms-action__btn">
              <FaArrowLeft />
              Back to Donor Registration
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default TermsConditions
