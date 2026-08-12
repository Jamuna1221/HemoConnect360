import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaBell, FaUser, FaBars, FaTimes, FaSignOutAlt } from 'react-icons/fa';
import logo from '../../assets/logo/Hemoconnectlogo.png';
import { useAuthContext } from '../../context/useAuthContext';
import { enableDonorNotifications, subscribeToForegroundNotifications } from '../../services/pushNotificationService';
import { fetchDonorNotifications, markDonorNotificationRead } from '../../services/notificationService';
import './Navbar.css';
import GoogleTranslate from '../Common/GoogleTranslate';

const NAV_LINKS = [
  { label: 'Home', href: '#home' },
  { label: 'Dashboard', href: '/donor/dashboard' },
  { label: 'Requests', href: '/donor/requests' },
  { label: 'Donations', href: '/donor/donations' },
  { label: 'Profile', href: '/donor/profile' },

];

const getInitials = (fullName) => {
  if (!fullName) return 'HC';
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  const first = parts[0] ? parts[0][0] : '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase() || 'HC';
};

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [pushStatus, setPushStatus] = useState(() => (
    typeof Notification !== 'undefined' && Notification.permission === 'granted' ? 'enabled' : 'idle'
  ));
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const { user, donor, loading, signOut } = useAuthContext();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!user) return;
    let active = true;
    const loadNotifications = () => fetchDonorNotifications()
      .then((items) => { if (active) setNotifications(items) })
      .catch((error) => console.warn('[donor-notifications] Load failed', error));
    loadNotifications();
    const timer = setInterval(loadNotifications, 8000);
    return () => { active = false; clearInterval(timer); };
  }, [user]);

  useEffect(() => {
    let active = true;
    let unsubscribe = () => {};
    subscribeToForegroundNotifications((payload) => {
      if (active && 'Notification' in window && Notification.permission === 'granted') {
        new Notification(payload.notification?.title || 'HemoConnect360', {
          body: payload.notification?.body || 'You have a new update.',
          icon: '/favicon.svg',
        });
      }
    }).then((stop) => {
      if (active) unsubscribe = stop;
      else stop();
    });
    return () => { active = false; unsubscribe(); };
  }, []);

  const closeMenu = () => setMenuOpen(false);
  const handleEnableDonorNotifications = async () => {
    setPushStatus('enabling');
    try {
      await enableDonorNotifications();
      setPushStatus('enabled');
    } catch (error) {
      console.error('[donor-push] Enable notifications failed', error);
      setPushStatus('error');
    }
  };
  const handleNotificationClick = async (notification) => {
    if (!notification.read_at) {
      await markDonorNotificationRead(notification.id).catch(() => {});
      setNotifications((items) => items.map((item) => item.id === notification.id ? { ...item, read_at: new Date().toISOString() } : item));
    }
  };
  const unreadNotifications = notifications.filter((notification) => !notification.read_at).length;
  const visibleNavLinks = location.pathname === '/'
    ? NAV_LINKS
    : NAV_LINKS.filter((link) => ['Dashboard', 'Requests', 'Profile', 'Donations'].includes(link.label));
  const isNavLinkActive = (link) => {
    if (location.pathname === '/' && link.label === 'Home') return true;
    if (link.href === '/donor/requests') return location.pathname.startsWith('/donor/requests');
    return location.pathname === link.href;
  };

  const handleLogout = async () => {
    closeMenu();
    try {
      await signOut();
    } finally {
      navigate('/');
    }
  };

  const authControl = (inMobile) => {
    if (loading) return null;

    if (user) {
      return (
        <div className="navbar__donor">
          <div className="navbar__donor-info">
            <div className="navbar__donor-avatar">
              {donor?.profile_pic ? (
                <img src={donor.profile_pic} alt={donor.full_name || 'Donor'} />
              ) : (
                <span>{getInitials(donor?.full_name)}</span>
              )}
            </div>
            {donor?.full_name && <span className="navbar__donor-name">{donor.full_name}</span>}
          </div>
          <button type="button" className="navbar__logout-btn" aria-label="Logout" title="Logout" onClick={handleLogout}>
            <FaSignOutAlt />
          </button>
        </div>
      );
    }

    return (
      <button
        type="button"
        className="navbar__login-btn"
        onClick={() => { if (inMobile) closeMenu(); navigate('/donor/login'); }}
      >
        <FaUser /> Login / Sign Up
      </button>
    );
  };

  return (
    <header className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}>
      <div className="navbar__container">
        <a href="/" className="navbar__logo" onClick={closeMenu}>
          <img src={logo} alt="HemoConnect360" className="navbar__logo-img" />
        </a>

        <nav className={`navbar__links ${menuOpen ? 'navbar__links--open' : ''}`}>
          {visibleNavLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={`navbar__link ${isNavLinkActive(link) ? 'navbar__link--active' : ''}`}
              onClick={closeMenu}
            >
              {link.label}
            </a>
          ))}
          <div className="navbar__cta-group navbar__cta-group--mobile">
            <GoogleTranslate />
            <button type="button" className="navbar__bell" aria-label="Notifications">
              <FaBell />
            </button>
            {user && <button type="button" className="navbar__push-enable" onClick={handleEnableDonorNotifications} disabled={pushStatus === 'enabling'}>{pushStatus === 'enabled' ? 'Alerts On' : 'Enable Alerts'}</button>}
            {authControl(true)}
          </div>
        </nav>

        <div className="navbar__cta-group">
          <GoogleTranslate />
          <div className="navbar__notification-wrapper">
            <button type="button" className="navbar__bell" aria-label="Notifications" onClick={() => setShowNotifications((open) => !open)}>
              <FaBell />
              {unreadNotifications > 0 && <span className="navbar__notification-badge">{unreadNotifications}</span>}
            </button>
            {showNotifications && <div className="navbar__notification-dropdown">
              <h4>Notifications</h4>
              {notifications.length === 0 ? <p>No notifications yet.</p> : notifications.map((notification) => (
                <button type="button" key={notification.id} className={`navbar__notification-item ${!notification.read_at ? 'navbar__notification-item--unread' : ''}`} onClick={() => handleNotificationClick(notification)}>
                  <strong>{notification.title}</strong><span>{notification.message}</span>
                </button>
              ))}
            </div>}
          </div>
          {user && <button type="button" className="navbar__push-enable" onClick={handleEnableDonorNotifications} disabled={pushStatus === 'enabling'}>{pushStatus === 'enabled' ? 'Alerts On' : 'Enable Alerts'}</button>}
          {authControl(false)}
        </div>

        <button
          type="button"
          className="navbar__toggle"
          aria-label="Toggle navigation menu"
          onClick={() => setMenuOpen((prev) => !prev)}
        >
          {menuOpen ? <FaTimes /> : <FaBars />}
        </button>
      </div>
    </header>
  );
};

export default Navbar;
