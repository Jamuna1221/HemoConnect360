import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  FaArrowLeft,
  FaEnvelope,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaHospital,
} from 'react-icons/fa'
import logo from '../../assets/logo/Hemoconnectlogo.png'
import { loginBloodBank } from '../../services/bloodBankService'
import './BloodBankLogin.css'

const BloodBankLogin = () => {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')

    const trimmedEmail = email.trim()
    if (!trimmedEmail) { setError('Please enter your email address'); return }
    if (!/^\S+@\S+\.\S+$/.test(trimmedEmail)) { setError('Please enter a valid email address'); return }
    if (!password) { setError('Please enter your password'); return }

    setLoading(true)
    try {
      const { bloodBank: profile } = await loginBloodBank({ email: trimmedEmail, password })
      navigate('/blood-bank/dashboard', { state: { bloodBank: profile } })
    } catch (err) {
      setError(err.message || 'Unable to sign in. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bloodbank-login-page">
      <Link to="/" className="bloodbank-login-back"><FaArrowLeft /> Back to Home</Link>

      <div className="bloodbank-login-container">
        <div className="bloodbank-login-left">
          <div className="bloodbank-login-brand">
            <img src={logo} alt="HemoConnect360" className="bloodbank-login-logo-img" />
          </div>

          <h1 className="bloodbank-login-title">
            Blood Bank <span>Portal</span>
          </h1>

          <p className="bloodbank-login-sub">
            Manage your blood bank account with HemoConnect360.
          </p>

          <div className="bloodbank-login-features">
            <div className="bloodbank-login-feature">
              <div className="bloodbank-login-feature-icon"><FaHospital /></div>
              <h3>Registered Institutions</h3>
              <p>Blood banks across the region</p>
            </div>
          </div>
        </div>

        <div className="bloodbank-login-right">
          <div className="bloodbank-login-card">
            <div className="bloodbank-login-card-icon">
              <FaHospital />
            </div>
            <h2>Welcome Back!</h2>
            <p className="bloodbank-login-subtitle">
              Sign in with your official email and password.
            </p>

            <form onSubmit={handleLogin}>
              <div className="bloodbank-login-field">
                <label>Email Address</label>
                <div className="bloodbank-login-input-wrap">
                  <FaEnvelope className="bloodbank-login-input-icon" />
                  <input
                    type="email"
                    placeholder="Enter your official email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError('') }}
                  />
                </div>
              </div>

              <div className="bloodbank-login-field">
                <label>Password</label>
                <div className="bloodbank-login-input-wrap">
                  <FaLock className="bloodbank-login-input-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError('') }}
                  />
                  <button
                    type="button"
                    className="bloodbank-login-input-eye"
                    aria-label="Toggle password visibility"
                    onClick={() => setShowPassword((prev) => !prev)}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              {error && <span className="bloodbank-login-error">{error}</span>}
              <button type="submit" className="bloodbank-login-btn" disabled={loading}>
                {loading ? 'Signing in...' : 'Login'}
              </button>
            </form>

            <p className="bloodbank-login-register">
              New to HemoConnect360? <Link to="/blood-bank/register">Register your Blood Bank</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BloodBankLogin
