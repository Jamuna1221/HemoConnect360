import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBell, FaUser, FaBars, FaTimes, FaSignOutAlt } from 'react-icons/fa';
import logo from '../../assets/logo/Hemoconnectlogo.png';
import { useAuthContext } from '../../context/useAuthContext';
import './Navbar.css';

const NAV_LINKS = [
  { label: 'Home', href: '#home' },
  { label: 'Find Donors', href: '#find-donors' },
  { label: 'Requests', href: '/donor/requests' },
  { label: 'Profile', href: '/donor/profile' },
  { label: 'About Us', href: '#about' },
  { label: 'Contact', href: '#contact' },
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
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, donor, loading, signOut } = useAuthContext();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const closeMenu = () => setMenuOpen(false);

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
          {NAV_LINKS.map((link, index) => (
            <a
              key={link.href}
              href={link.href}
              className={`navbar__link ${index === 0 ? 'navbar__link--active' : ''}`}
              onClick={closeMenu}
            >
              {link.label}
            </a>
          ))}
          <div className="navbar__cta-group navbar__cta-group--mobile">
            <button type="button" className="navbar__bell" aria-label="Notifications">
              <FaBell />
            </button>
            {authControl(true)}
          </div>
        </nav>

        <div className="navbar__cta-group">
          <button type="button" className="navbar__bell" aria-label="Notifications">
            <FaBell />
          </button>
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
