import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  FaArrowLeft,
  FaEnvelope,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaShieldAlt,
  FaUserFriends,
  FaHeartbeat,
  FaPlus,
} from 'react-icons/fa'
import logo from '../../assets/logo/Hemoconnectlogo.png'
import bloodDrop from '../../assets/hero/blood-drop.png'
import { loginDonor } from '../../services/donorService'
import './DonorLogin.css'

const PLUS_POSITIONS = [
  { top: '6%', left: '10%', size: 16 },
  { top: '12%', left: '70%', size: 12 },
  { top: '22%', left: '38%', size: 20 },
  { top: '38%', left: '86%', size: 14 },
  { top: '52%', left: '7%', size: 22 },
  { top: '66%', left: '32%', size: 12 },
  { top: '80%', left: '74%', size: 18 },
  { top: '90%', left: '22%', size: 14 },
  { top: '30%', left: '55%', size: 11 },
  { top: '72%', left: '58%', size: 10 },
]

const FEATURES = [
  { icon: <FaShieldAlt />, title: 'Secure', desc: 'Your data is protected' },
  { icon: <FaUserFriends />, title: 'Trusted Community', desc: 'Thousands of verified donors' },
  { icon: <FaHeartbeat />, title: 'Save Lives', desc: 'Every donation matters' },
]

const DonorLogin = () => {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
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
      const { donor } = await loginDonor({ email: trimmedEmail, password })
      navigate('/donor/dashboard', { state: { donor } })
    } catch (err) {
      setError(err.message || 'Unable to sign in. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="donor-login-page">
      <Link to="/" className="donor-login-back"><FaArrowLeft /> Back to Home</Link>

      <div className="donor-login-container">
        <div className="donor-login-left">
          {PLUS_POSITIONS.map((plus, i) => (
            <FaPlus
              key={i}
              className="donor-login-plus"
              style={{ top: plus.top, left: plus.left, fontSize: plus.size }}
            />
          ))}

          <div className="donor-login-blob donor-login-blob--one" />
          <div className="donor-login-blob donor-login-blob--two" />
          <div className="donor-login-blob donor-login-blob--three" />

          <div className="donor-login-brand">
            <img src={logo} alt="HemoConnect360" className="donor-login-logo-img" />
          </div>

          <h1 className="donor-login-title">
            Every Drop <br /> Makes a <span>Difference</span>
          </h1>

          <div className="donor-login-hero">
            <img src={bloodDrop} alt="Blood drop" className="donor-login-hero-img" />
          </div>

          <p className="donor-login-sub">
            Join our life-saving community.
            <br />
            Donate blood.
            <br />
            Save lives.
            <br />
            Become someone's hero.
          </p>

          <div className="donor-login-features">
            {FEATURES.map((feature, i) => (
              <div className="donor-login-feature" key={i}>
                <div className="donor-login-feature-icon">{feature.icon}</div>
                <h3>{feature.title}</h3>
                <p>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="donor-login-right">
          <div className="donor-login-card">
            <h2>Welcome Back!</h2>
            <p className="donor-login-subtitle">Sign in to continue saving lives.</p>

            <form onSubmit={handleLogin}>
              <div className="donor-login-field">
                <label><FaEnvelope /> Email Address</label>
                <div className="donor-login-input-wrap">
                  <FaEnvelope className="donor-login-input-icon" />
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError('') }}
                  />
                </div>
              </div>

              <div className="donor-login-field">
                <label><FaLock /> Password</label>
                <div className="donor-login-input-wrap">
                  <FaLock className="donor-login-input-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError('') }}
                  />
                  <button
                    type="button"
                    className="donor-login-input-eye"
                    aria-label="Toggle password visibility"
                    onClick={() => setShowPassword((prev) => !prev)}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              <div className="donor-login-options">
                <label className="donor-login-remember">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span>Remember Me</span>
                </label>
                <button type="button" className="donor-login-forgot" onClick={() => {}}>
                  Forgot Password?
                </button>
              </div>

              {error && <span className="donor-login-error">{error}</span>}
              <button type="submit" className="donor-login-btn" disabled={loading}>
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </form>

            <p className="donor-login-register">
              New to HemoConnect360? <Link to="/donor/register">Register as a Donor</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DonorLogin
