import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  FaEnvelope,
  FaPaperPlane,
  FaArrowLeft,
  FaHome,
  FaExclamationTriangle,
} from 'react-icons/fa'
import logo from '../../assets/logo/Hemoconnectlogo.png'
import bloodDropSuccess from '../../assets/donor-success/blood-drop-success.png'
import { resendDonorVerification } from '../../services/donorService'
import './VerifyEmail.css'

const getMailProviderUrl = (email = '') => {
  const domain = (email.split('@')[1] || '').toLowerCase()
  if (domain.includes('gmail') || domain.includes('googlemail')) return 'https://mail.google.com'
  if (domain.includes('outlook') || domain.includes('hotmail') || domain.includes('live.com') || domain.includes('msn.com')) return 'https://outlook.live.com'
  if (domain.includes('yahoo')) return 'https://mail.yahoo.com'
  if (domain.includes('icloud')) return 'https://www.icloud.com/mail'
  if (domain.includes('protonmail') || domain.includes('proton.me')) return 'https://mail.protonmail.com'
  if (domain.includes('zoho')) return 'https://mail.zoho.com'
  if (domain.includes('aol')) return 'https://mail.aol.com'
  return 'https://mail.google.com'
}

const VerifyEmail = () => {
  const location = useLocation()
  const email = location.state?.email || ''
  const callbackError = location.state?.error || ''

  const [resend, setResend] = useState({ status: 'idle', message: '' })
  const [cooldown, setCooldown] = useState(0)
  const mailUrl = getMailProviderUrl(email)

  useEffect(() => {
    if (!cooldown) return undefined
    const timer = setInterval(() => setCooldown((value) => Math.max(0, value - 1)), 1000)
    return () => clearInterval(timer)
  }, [cooldown])

  const handleResend = async () => {
    if (!email) {
      setResend({ status: 'error', message: 'No email address on file. Please register again.' })
      return
    }
    if (cooldown > 0) return
    setResend({ status: 'sending', message: '' })
    try {
      await resendDonorVerification(email)
      setResend({ status: 'sent', message: 'Verification email sent again. Please check your inbox.' })
      setCooldown(60)
    } catch (err) {
      setResend({ status: 'error', message: err.message || 'Unable to resend the verification email. Please try again.' })
    }
  }

  return (
    <div className="verify-email-page">
      <Link to="/" className="verify-email-back">
        <FaArrowLeft /> Back to Home
      </Link>

      <div className="verify-email-wrap">
        <motion.div
          className="verify-email-card"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <div className="verify-email-brand">
            <img src={logo} alt="HemoConnect360" className="verify-email-logo" />
          </div>

          <motion.div
            className="verify-email-illustration"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.45, type: 'spring', stiffness: 200 }}
          >
            <img src={bloodDropSuccess} alt="" className="verify-email-blood" />
            <motion.div
              className="verify-email-mail-badge"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: 'spring', stiffness: 260 }}
            >
              <FaEnvelope />
            </motion.div>
          </motion.div>

          <span className="verify-email-badge">Verify Your Email</span>
          <h1 className="verify-email-title">Registration Successful!</h1>
          <p className="verify-email-text">
            We&apos;ve sent a verification email. Please check your inbox to activate your account.
          </p>

          {email && (
            <div className="verify-email-address">
              <FaEnvelope /> {email}
            </div>
          )}

          {callbackError && (
            <div className="verify-email-error">
              <FaExclamationTriangle /> {callbackError}
            </div>
          )}

          <div className="verify-email-actions">
            <a href={mailUrl} target="_blank" rel="noopener noreferrer" className="verify-email-btn verify-email-btn--primary">
              <FaEnvelope /> Open Email
            </a>
            <button
              type="button"
              className="verify-email-btn verify-email-btn--secondary"
              onClick={handleResend}
               disabled={resend.status === 'sending' || cooldown > 0}
            >
              <FaPaperPlane /> {resend.status === 'sending' ? 'Sending...' : cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Verification Email'}
            </button>
          </div>

          {resend.message && (
            <p className={`verify-email-status verify-email-status--${resend.status}`}>
              {resend.message}
            </p>
          )}

          <Link to="/" className="verify-email-home">
            <FaHome /> Back to Home
          </Link>
        </motion.div>
      </div>
    </div>
  )
}

export default VerifyEmail
