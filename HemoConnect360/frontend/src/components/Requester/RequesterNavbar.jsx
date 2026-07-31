import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { FaBell, FaUser, FaBars, FaTimes, FaSignOutAlt } from 'react-icons/fa'
import logo from '../../assets/logo/Hemoconnectlogo.png'
import { useRequester } from '../../context/RequesterContext'
import './RequesterNavbar.css'

const NAV_LINKS = [
  { label: 'Dashboard', path: '/requester/dashboard' },
  { label: 'Request Blood', path: '/requester/request-blood' },
  { label: 'History', path: '/requester/history' },
  { label: 'Profile', path: '/requester/profile' },
]

const RequesterNavbar = () => {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [showNotif, setShowNotif] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logoutUser, notifications } = useRequester()

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const closeMenu = () => setMenuOpen(false)

  const handleLogout = () => {
    logoutUser()
    navigate('/requester/login')
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <header className={`req-navbar ${scrolled ? 'req-navbar--scrolled' : ''}`}>
      <div className="req-navbar__container">
        <Link to="/requester/dashboard" className="req-navbar__logo" onClick={closeMenu}>
          <img src={logo} alt="HemoConnect360" className="req-navbar__logo-img" />
        </Link>

        <nav className={`req-navbar__links ${menuOpen ? 'req-navbar__links--open' : ''}`}>
          {NAV_LINKS.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`req-navbar__link ${location.pathname === link.path ? 'req-navbar__link--active' : ''}`}
              onClick={closeMenu}
            >
              {link.label}
            </Link>
          ))}
          <div className="req-navbar__cta-group req-navbar__cta-group--mobile">
            <span className="req-navbar__phone">{user?.phone}</span>
            <button type="button" className="req-navbar__bell" onClick={() => { setShowNotif(!showNotif); closeMenu() }}>
              <FaBell />
              {unreadCount > 0 && <span className="req-navbar__badge">{unreadCount}</span>}
            </button>
            <button type="button" className="req-navbar__logout-btn" onClick={handleLogout}>
              <FaSignOutAlt /> Logout
            </button>
          </div>
        </nav>

        <div className="req-navbar__cta-group">
          <div className="req-navbar__user-info">
            <span className="req-navbar__user-name">{user?.fullName || 'User'}</span>
          </div>
          <div className="req-navbar__notif-wrapper">
            <button type="button" className="req-navbar__bell" onClick={() => setShowNotif(!showNotif)}>
              <FaBell />
              {unreadCount > 0 && <span className="req-navbar__badge">{unreadCount}</span>}
            </button>
            {showNotif && (
              <div className="req-navbar__notif-dropdown">
                <h4 className="req-navbar__notif-title">Notifications</h4>
                {notifications.length === 0 ? (
                  <p className="req-navbar__notif-empty">No notifications</p>
                ) : (
                  notifications.map((n) => (
                    <div key={n.id} className={`req-navbar__notif-item ${!n.read ? 'req-navbar__notif-item--unread' : ''}`}>
                      <p className="req-navbar__notif-text">{n.text}</p>
                      <span className="req-navbar__notif-time">{n.time}</span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
          <button type="button" className="req-navbar__profile-btn" onClick={() => { navigate('/requester/profile'); closeMenu() }}>
            <FaUser />
          </button>
          <span className="req-navbar__phone">{user?.phone}</span>
          <button type="button" className="req-navbar__logout-btn" onClick={handleLogout}>
            <FaSignOutAlt /> Logout
          </button>
        </div>

        <button
          type="button"
          className="req-navbar__toggle"
          aria-label="Toggle navigation menu"
          onClick={() => setMenuOpen((prev) => !prev)}
        >
          {menuOpen ? <FaTimes /> : <FaBars />}
        </button>
      </div>
    </header>
  )
}

export default RequesterNavbar
