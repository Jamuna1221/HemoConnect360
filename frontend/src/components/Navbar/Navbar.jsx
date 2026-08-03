import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBell, FaUser, FaBars, FaTimes } from 'react-icons/fa';
import logo from '../../assets/logo/Hemoconnectlogo.png';
import './Navbar.css';

const NAV_LINKS = [
  { label: 'Home', href: '#home' },
  { label: 'Find Donors', href: '#find-donors' },
  { label: 'Requests', href: '#requests' },
  { label: 'About Us', href: '#about' },
  { label: 'Contact', href: '#contact' },
];

const Navbar = () => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const closeMenu = () => setMenuOpen(false);

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
            <button type="button" className="navbar__login-btn" onClick={() => { closeMenu(); navigate('/donor/login'); }}>
              <FaUser /> Login / Sign Up
            </button>
          </div>
        </nav>

        <div className="navbar__cta-group">
          <button type="button" className="navbar__bell" aria-label="Notifications">
            <FaBell />
          </button>
          <button type="button" className="navbar__login-btn" onClick={() => navigate('/donor/login')}>
            <FaUser /> Login / Sign Up
          </button>
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
