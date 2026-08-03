import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  FaPhone,
  FaArrowLeft,
  FaEnvelope,
  FaLock,
  FaShieldAlt,
  FaUserFriends,
  FaHeartbeat,
  FaPlus,
} from 'react-icons/fa'
import logo from '../../assets/logo/Hemoconnectlogo.png'
import bloodDrop from '../../assets/hero/blood-drop.png'
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
  const [loginMethod, setLoginMethod] = useState('phone')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = (e) => {
    e.preventDefault()
    setError('')

    if (loginMethod === 'phone') {
      if (!phone.trim()) { setError('Please enter your phone number'); return }
      if (!/^\d{10}$/.test(phone.trim())) { setError('Please enter a valid 10-digit phone number'); return }
    } else {
      if (!email.trim()) { setError('Please enter your email address'); return }
      if (!/^\S+@\S+\.\S+$/.test(email.trim())) { setError('Please enter a valid email address'); return }
      if (!password) { setError('Please enter your password'); return }
    }

    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      navigate('/donor/dashboard')
    }, 800)
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

            <div className="donor-login-tabs">
              <button type="button" className={`donor-login-tab ${loginMethod === 'phone' ? 'donor-login-tab--active' : ''}`} onClick={() => { setLoginMethod('phone'); setError('') }}>
                Phone
              </button>
              <button type="button" className={`donor-login-tab ${loginMethod === 'email' ? 'donor-login-tab--active' : ''}`} onClick={() => { setLoginMethod('email'); setError('') }}>
                Email
              </button>
            </div>

            <form onSubmit={handleLogin}>
              {loginMethod === 'phone' ? (
                <div className="donor-login-field">
                  <label><FaPhone /> Phone Number</label>
                  <input
                    type="tel"
                    placeholder="Enter 10-digit phone number"
                    value={phone}
                    onChange={(e) => { setPhone(e.target.value.replace(/\D/g, '')); setError('') }}
                    maxLength={10}
                  />
                </div>
              ) : (
                <>
                  <div className="donor-login-field">
                    <label><FaEnvelope /> Email Address</label>
                    <input
                      type="email"
                      placeholder="Enter your email address"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError('') }}
                    />
                  </div>
                  <div className="donor-login-field">
                    <label><FaLock /> Password</label>
                    <input
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setError('') }}
                    />
                  </div>
                </>
              )}

              {error && <span className="donor-login-error">{error}</span>}
              <button type="submit" className="donor-login-btn" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <p className="donor-login-register">
              New to HemoConnect360? <Link to="/donor/registration">Register as a Donor</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DonorLogin
