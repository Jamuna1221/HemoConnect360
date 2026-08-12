import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { FaBell, FaUser, FaBars, FaTimes, FaSignOutAlt } from 'react-icons/fa'
import logo from '../../assets/logo/Hemoconnectlogo.png'
import { useRequester } from '../../context/RequesterContext'
import { enableRequesterNotifications, subscribeToForegroundNotifications } from '../../services/pushNotificationService'
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
  const [pushStatus, setPushStatus] = useState(() => (
    typeof Notification !== 'undefined' && Notification.permission === 'granted' ? 'enabled' : 'idle'
  ))
  const [pushError, setPushError] = useState('')
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logoutUser, notifications } = useRequester()

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    let active = true
    let unsubscribe = () => {}
    subscribeToForegroundNotifications((payload) => {
      if (active && 'Notification' in window && Notification.permission === 'granted') {
        new Notification(payload.notification?.title || 'HemoConnect360', {
          body: payload.notification?.body || 'You have a new update.',
          icon: '/favicon.svg',
        })
      }
    }).then((stop) => {
      if (active) unsubscribe = stop
      else stop()
    })
    return () => { active = false; unsubscribe() }
  }, [])

  const closeMenu = () => setMenuOpen(false)

  const handleEnableNotifications = async () => {
    setPushStatus('enabling')
    setPushError('')
    try {
      await enableRequesterNotifications()
      setPushStatus('enabled')
    } catch (error) {
      setPushStatus('error')
      setPushError(error.message || 'Unable to enable notifications')
    }
  }

  const handleLogout = () => {
    logoutUser()
    navigate('/requester/login')
  }

  const notificationItems = notifications.map((notification) => ({
    id: notification.id,
    text: notification.message,
    title: notification.title,
    time: new Date(notification.created_at).toLocaleString(),
    read: Boolean(notification.read_at),
  }))
  const unreadCount = notificationItems.filter((n) => !n.read).length

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
            <button type="button" className="req-navbar__push-enable" onClick={handleEnableNotifications} disabled={pushStatus === 'enabling'}>
              {pushStatus === 'enabled' ? 'Alerts On' : pushStatus === 'enabling' ? 'Enabling...' : 'Enable Alerts'}
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
                <button type="button" className="req-navbar__push-enable" onClick={handleEnableNotifications} disabled={pushStatus === 'enabling'}>
                  {pushStatus === 'enabled' ? 'Browser alerts enabled' : pushStatus === 'enabling' ? 'Enabling...' : 'Enable browser alerts'}
                </button>
                {pushError && <p className="req-navbar__push-error">{pushError}</p>}
                {notificationItems.length === 0 ? (
                  <p className="req-navbar__notif-empty">No notifications</p>
                ) : (
                  notificationItems.map((n) => (
                    <div key={n.id} className={`req-navbar__notif-item ${!n.read ? 'req-navbar__notif-item--unread' : ''}`}>
                      {n.title && <strong className="req-navbar__notif-title-text">{n.title}</strong>}
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
