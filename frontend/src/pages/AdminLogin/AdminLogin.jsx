import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { FaArrowLeft, FaEnvelope, FaLock, FaEye, FaEyeSlash, FaShieldAlt } from 'react-icons/fa'
import adminBg from '../../assets/admin/admin_login.png'
import './AdminLogin.css'

const AdminLogin = () => {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Redirect if already logged in
  useEffect(() => {
    const session = localStorage.getItem('admin_session')
    if (session) {
      navigate('/admin/dashboard', { replace: true })
    }
  }, [navigate])

  const handleLogin = (e) => {
    e.preventDefault()
    setError('')

    const trimmedEmail = email.trim()
    if (!trimmedEmail) {
      setError('Please enter your email address')
      return
    }
    if (!/^\S+@\S+\.\S+$/.test(trimmedEmail)) {
      setError('Please enter a valid email address')
      return
    }
    if (!password) {
      setError('Please enter your password')
      return
    }

    setLoading(true)

    // Simulate authentication
    setTimeout(() => {
      if (trimmedEmail === 'admin@hemoconnect360.com' && password === 'Admin@360') {
        localStorage.setItem('admin_session', JSON.stringify({ email: trimmedEmail, token: 'admin-mock-token', timestamp: Date.now() }))
        setLoading(false)
        navigate('/admin/dashboard', { replace: true })
      } else {
        setLoading(false)
        setError('Invalid admin credentials. Please try again.')
      }
    }, 800)
  }

  return (
    <div 
      className="admin-login-page"
      style={{
        backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.5), rgba(15, 23, 42, 0.5)), url(${adminBg})`,
        backgroundSize: '100% 100%',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundColor: '#0f172a'
      }}
    >
      <Link to="/" className="admin-login-back">
        <FaArrowLeft /> Back to Home
      </Link>

      <div className="admin-login-container">
        <div className="admin-login-card">
          <div className="admin-login-header">
            <div className="admin-login-logo">
              <FaShieldAlt />
            </div>
            <h2>Admin Control Center</h2>
            <p className="admin-login-subtitle">Sign in to manage HemoConnect360 platform</p>
          </div>

          <form onSubmit={handleLogin} className="admin-login-form">
            <div className="admin-login-field">
              <label htmlFor="admin-email">
                <FaEnvelope className="field-icon" /> Email Address
              </label>
              <div className="admin-login-input-wrap">
                <input
                  id="admin-email"
                  type="email"
                  placeholder="admin@hemoconnect360.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setError('')
                  }}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="admin-login-field">
              <label htmlFor="admin-password">
                <FaLock className="field-icon" /> Password
              </label>
              <div className="admin-login-input-wrap">
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    setError('')
                  }}
                  disabled={loading}
                />
                <button
                  type="button"
                  className="admin-login-input-eye"
                  aria-label="Toggle password visibility"
                  onClick={() => setShowPassword((prev) => !prev)}
                  disabled={loading}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            {error && <span className="admin-login-error" role="alert">{error}</span>}

            <button type="submit" className="admin-login-btn" disabled={loading}>
              {loading ? 'Authenticating...' : 'Access Console'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default AdminLogin
