import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { FaPhone, FaLock, FaArrowLeft, FaTint, FaShieldAlt, FaHospital, FaHandHoldingHeart } from 'react-icons/fa'
import { useRequester } from '../../context/RequesterContext'
import './RequesterLogin.css'

const RequesterLogin = () => {
  const navigate = useNavigate()
  const { loginUser, user } = useRequester()
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSendOtp = (e) => {
    e.preventDefault()
    setError('')
    if (!phone.trim()) { setError('Please enter your phone number'); return }
    if (!/^\d{10}$/.test(phone.trim())) { setError('Please enter a valid 10-digit phone number'); return }
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      const existingUsers = JSON.parse(localStorage.getItem('requesterUsers') || '[]')
      const isExisting = existingUsers.find((u) => u.phone === phone.trim())
      if (isExisting) {
        setOtpSent(true)
      } else {
        navigate('/requester/register', { state: { phone: phone.trim() } })
      }
    }, 1200)
  }

  const handleVerifyOtp = (e) => {
    e.preventDefault()
    setError('')
    if (!otp.trim()) { setError('Please enter the OTP'); return }
    if (!/^\d{4,6}$/.test(otp.trim())) { setError('Please enter a valid OTP'); return }
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      const existingUsers = JSON.parse(localStorage.getItem('requesterUsers') || '[]')
      const found = existingUsers.find((u) => u.phone === phone.trim())
      const userData = found || { phone: phone.trim(), fullName: 'Requester' }
      loginUser(userData)
      navigate('/requester/dashboard')
    }, 1000)
  }

  return (
    <div className="req-login-page">
      <Link to="/" className="req-login-back"><FaArrowLeft /> Back to Home</Link>
      <div className="req-login-container">
        <div className="req-login-left">
          <div className="req-login-brand">
            <div className="req-login-logo"><FaTint /></div>
            <h1>HemoConnect360</h1>
            <p>Requester Portal</p>
          </div>
          <div className="req-login-features">
            <div className="req-login-feature"><FaShieldAlt /><span>Safe &amp; secure blood requests</span></div>
            <div className="req-login-feature"><FaHospital /><span>Connected with 120+ hospitals</span></div>
            <div className="req-login-feature"><FaHandHoldingHeart /><span>24/7 donor network</span></div>
          </div>
        </div>
        <div className="req-login-right">
          <div className="req-login-card">
            <h2>Welcome Back</h2>
            <p className="req-login-subtitle">Sign in to manage your blood requests</p>
            {!otpSent ? (
              <form onSubmit={handleSendOtp}>
                <div className="req-login-field">
                  <label><FaPhone /> Phone Number</label>
                  <input type="tel" placeholder="Enter 10-digit phone number" value={phone} onChange={(e) => { setPhone(e.target.value); setError('') }} maxLength={10} />
                </div>
                {error && <span className="req-login-error">{error}</span>}
                <button type="submit" className="req-login-btn" disabled={loading}>
                  {loading ? 'Sending OTP...' : 'Send OTP'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp}>
                <div className="req-login-otp-info">OTP sent to <strong>{phone}</strong></div>
                <div className="req-login-field">
                  <label><FaLock /> Enter OTP</label>
                  <input type="text" placeholder="Enter OTP" value={otp} onChange={(e) => { setOtp(e.target.value); setError('') }} maxLength={6} />
                </div>
                {error && <span className="req-login-error">{error}</span>}
                <button type="submit" className="req-login-btn" disabled={loading}>
                  {loading ? 'Verifying...' : 'Verify & Login'}
                </button>
                <button type="button" className="req-login-resend" onClick={() => { setOtpSent(false); setOtp('') }}>Change Number</button>
              </form>
            )}
            <p className="req-login-register">Don't have an account? <Link to="/requester/register">Register Now</Link></p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RequesterLogin
