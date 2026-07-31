import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { FaPhone, FaArrowLeft, FaTint, FaShieldAlt, FaHospital, FaHandHoldingHeart } from 'react-icons/fa'
import { useRequester } from '../../context/RequesterContext'
import './RequesterLogin.css'

const RequesterLogin = () => {
  const navigate = useNavigate()
  const { loginUser } = useRequester()
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    if (!phone.trim()) { setError('Please enter your phone number'); return }
    if (!/^\d{10}$/.test(phone.trim())) { setError('Please enter a valid 10-digit phone number'); return }
    setLoading(true)
try {
      await loginUser({ phone: phone.trim() })
      setLoading(false)
      navigate('/requester/dashboard')
    } catch (err) {
      setLoading(false)
      setError(err.message || 'Unable to sign in. Please try again.')
    }
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
            <p className="req-login-subtitle">Enter your phone number to manage blood requests</p>
            <form onSubmit={handleLogin}>
              <div className="req-login-field">
                <label><FaPhone /> Phone Number</label>
                <input type="tel" placeholder="Enter 10-digit phone number" value={phone} onChange={(e) => { setPhone(e.target.value.replace(/\D/g, '')); setError('') }} maxLength={10} />
              </div>
              {error && <span className="req-login-error">{error}</span>}
              <button type="submit" className="req-login-btn" disabled={loading}>
                {loading ? 'Signing in...' : 'Continue'}
              </button>
            </form>
            <p className="req-login-register">New numbers are signed in automatically. No OTP required for requester access.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RequesterLogin
