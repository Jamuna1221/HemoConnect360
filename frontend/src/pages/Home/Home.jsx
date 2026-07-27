import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaBell,
  FaMapMarkerAlt,
  FaShieldAlt,
  FaUsers,
  FaTint,
  FaHospital,
  FaHeartbeat,
  FaFileAlt,
  FaHandsHelping,
  FaHeart,
  FaSmile,
  FaPhoneAlt,
  FaEnvelope,
  FaMapMarkerAlt as FaMapMarker,
  FaFacebookF,
  FaInstagram,
  FaTwitter,
  FaYoutube,
  FaBars,
  FaTimes,
} from 'react-icons/fa';
import logo from '../../assets/logo/Hemoconnectlogo.png';
import bloodDrop from '../../assets/hero/blood-drop.png';
import hand from '../../assets/hero/hand.png';
import cityBg from '../../assets/hero/city-bg.png';
import bloodBag from '../../assets/donate/blood-bag.png';
import donor1 from '../../assets/avatars/donor1.jpg';
import donor2 from '../../assets/avatars/donor2.jpg';
import donor3 from '../../assets/avatars/donor3.jpg';
import donor4 from '../../assets/avatars/donor4.jpg';
import waveTop from '../../assets/shapes/wave-top.svg';
import waveBottom from '../../assets/shapes/wave-bottom.svg';
import dottedCircle from '../../assets/shapes/dotted-circle.svg';
import './Home.css';

const NAV_LINKS = [
  { label: 'Home', href: '#home' },
  { label: 'About Us', href: '#about' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Why Donate', href: '#why-donate' },
  { label: 'Contact Us', href: '#contact' },
];

const STATS = [
  { icon: <FaUsers />, value: '10,000+', label: 'Registered Donors' },
  { icon: <FaTint />, value: '850+', label: 'Blood Requests Fulfilled' },
  { icon: <FaHospital />, value: '120+', label: 'Partner Hospitals' },
  { icon: <FaHeartbeat />, value: '24/7', label: 'Emergency Support' },
];

const STEPS = [
  { number: 1, icon: <FaFileAlt />, title: 'Submit Request', description: 'Fill in the patient and blood details quickly and submit your request.' },
  { number: 2, icon: <FaBell />, title: 'Donors Get Alerted', description: 'Matching donors nearby receive instant alerts about your request.' },
  { number: 3, icon: <FaHandsHelping />, title: 'Connect & Save Lives', description: 'Donor accepts, you connect, and together you save a life.' },
];

const BENEFITS = [
  { icon: <FaHeart />, title: 'Saves Lives', description: 'One donation can save up to 3 lives' },
  { icon: <FaHeartbeat />, title: 'Boosts Health', description: 'Helps in new blood cell production' },
  { icon: <FaSmile />, title: 'Feels Good', description: 'The joy of saving someone is priceless' },
  { icon: <FaUsers />, title: 'Builds Community', description: 'Stronger communities save more lives' },
];

const QUICK_LINKS = [
  { label: 'Home', href: '#home' },
  { label: 'About Us', href: '#about' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Why Donate', href: '#why-donate' },
  { label: 'FAQs', href: '#faq' },
];

const Home = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="home">
      {/* ─── 1. NAVBAR ─── */}
      <header className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}>
        <div className="navbar__container">
          <a href="#home" className="navbar__logo" onClick={closeMenu}>
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
            <button type="button" className="navbar__cta navbar__cta--mobile" onClick={() => { closeMenu(); navigate('/donor/registration'); }}>
              Become a Donor
            </button>
          </nav>

          <button type="button" className="navbar__cta navbar__cta--desktop" onClick={() => navigate('/donor/registration')}>
            Become a Donor
          </button>

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

      {/* ─── 2. HERO SECTION ─── */}
      <section className="hero" id="home">
        <div className="hero__bg">
          <img src={cityBg} alt="" className="hero__bg-img" />
        </div>

        <div className="hero__container">
          <div className="hero__content">
            <h1 className="hero__heading">
              One Request.<br />
              Many Heroes.<br />
              <span className="hero__heading--accent">Countless Lives Saved.</span>
            </h1>

            <p className="hero__description">
              HemoConnect360 instantly connects blood requesters with nearby, compatible donors
              in times of urgent need.
            </p>

            <div className="hero__actions">
              <button type="button" className="hero__btn hero__btn--primary">
                Request Blood Now
              </button>
              <button type="button" className="hero__btn hero__btn--secondary" onClick={() => navigate('/donor/registration')}>
                Become a Donor
              </button>
            </div>

            <div className="hero__social-proof">
              <div className="hero__avatars">
                <img src={donor1} alt="Donor 1" className="hero__avatar" />
                <img src={donor2} alt="Donor 2" className="hero__avatar" />
                <img src={donor3} alt="Donor 3" className="hero__avatar" />
                <img src={donor4} alt="Donor 4" className="hero__avatar" />
              </div>
              <div className="hero__social-text">
                <strong>10,000+</strong> Lives Impacted
                <span className="hero__social-subtext">Trusted by donors and hospitals across India.</span>
              </div>
            </div>
          </div>

          <div className="hero__visual">
            <div className="hero-illustration">
              <img src={bloodDrop} alt="Blood drop" className="hero__blood-drop" />
              <img src={hand} alt="Hand holding blood drop" className="hero__hand" />
            </div>

            <img src={dottedCircle} alt="" className="hero__dotted-circle" />

            <div className="hero__float hero__float--top-left">
              <div className="hero__float-icon"><FaBell /></div>
              <span className="hero__float-label">Instant Alerts</span>
            </div>
            <div className="hero__float hero__float--top-right">
              <div className="hero__float-icon"><FaMapMarkerAlt /></div>
              <span className="hero__float-label">Nearby Donors</span>
            </div>
            <div className="hero__float hero__float--bottom-left">
              <div className="hero__float-icon"><FaShieldAlt /></div>
              <span className="hero__float-label">Safe &amp; Secure</span>
            </div>
            <div className="hero__float hero__float--bottom-right">
              <div className="hero__float-icon"><FaUsers /></div>
              <span className="hero__float-label">Verified Donors</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 3. WAVE DIVIDER ─── */}
      <div className="wave-divider wave-divider--top">
        <img src={waveTop} alt="" className="wave-divider__svg" />
      </div>

      {/* ─── 4. STATISTICS CARD ─── */}
      <section className="stats">
        <div className="stats__card">
          {STATS.map((stat) => (
            <div className="stats__item" key={stat.label}>
              <div className="stats__icon">{stat.icon}</div>
              <h3 className="stats__value">{stat.value}</h3>
              <p className="stats__label">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── 5. HOW IT WORKS ─── */}
      <section className="how-it-works" id="how-it-works">
        <div className="how-it-works__container">
          <span className="how-it-works__eyebrow">How It Works</span>
          <h2 className="how-it-works__heading">Three Simple Steps to Save a Life</h2>
          <p className="how-it-works__subheading">
            Our platform makes blood donation simple, fast and effective.
          </p>

          <div className="how-it-works__steps">
            {STEPS.map((step, index) => (
              <div className="how-it-works__step-wrapper" key={step.number}>
                <div className="how-it-works__card">
                  <span className="how-it-works__number">{step.number}</span>
                  <div className="how-it-works__icon">{step.icon}</div>
                  <h3 className="how-it-works__title">{step.title}</h3>
                  <p className="how-it-works__description">{step.description}</p>
                </div>
                {index < STEPS.length - 1 && (
                  <div className="how-it-works__arrow">
                    <svg width="40" height="24" viewBox="0 0 40 24" fill="none">
                      <path d="M2 12h32M30 4l8 8-8 8" stroke="#E53935" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 6. WHY DONATE ─── */}
      <section className="why-donate" id="why-donate">
        <div className="why-donate__container">
          <div className="why-donate__image-wrapper">
            <img src={bloodBag} alt="Blood donation bag" className="why-donate__image" />
          </div>

          <div className="why-donate__content">
            <h2 className="why-donate__heading">Why Donate Blood?</h2>
            <p className="why-donate__description">
              Your single act of kindness can create a ripple of hope in someone&apos;s life.
              Blood donation is one of the most selfless acts that can make a real difference.
            </p>

            <div className="why-donate__benefits">
              {BENEFITS.map((benefit) => (
                <div className="why-donate__benefit-card" key={benefit.title}>
                  <div className="why-donate__benefit-icon">{benefit.icon}</div>
                  <div>
                    <h4 className="why-donate__benefit-title">{benefit.title}</h4>
                    <p className="why-donate__benefit-description">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── 7. CTA BANNER ─── */}
      <section className="cta">
        <img src={waveBottom} alt="" className="cta__wave" />
        <div className="cta__container">
          <div className="cta__text">
            <h2 className="cta__heading">Be the reason someone lives today.</h2>
            <p className="cta__subtext">Join HemoConnect360 and make a difference.</p>
          </div>
          <div className="cta__actions">
            <button type="button" className="cta__btn cta__btn--outline">
              Request Blood
            </button>
            <button type="button" className="cta__btn cta__btn--solid" onClick={() => navigate('/donor/registration')}>
              Become a Donor
            </button>
          </div>
        </div>
      </section>

      {/* ─── 8. FOOTER ─── */}
      <footer className="footer" id="contact">
        <div className="footer__container">
          <div className="footer__brand">
            <a href="#home" className="footer__logo">
              <img src={logo} alt="HemoConnect360" className="footer__logo-img" />
            </a>
            <p className="footer__tagline">Connecting Lives. Every Drop Counts.</p>
          </div>

          <div className="footer__column">
            <h4 className="footer__heading">Quick Links</h4>
            <ul className="footer__links">
              {QUICK_LINKS.map((link) => (
                <li key={link.label}>
                  <a href={link.href}>{link.label}</a>
                </li>
              ))}
            </ul>
          </div>

          <div className="footer__column">
            <h4 className="footer__heading">Contact Us</h4>
            <ul className="footer__contact">
              <li><FaPhoneAlt /> +91 98765 43210</li>
              <li><FaEnvelope /> support@hemoconnect360.in</li>
              <li><FaMapMarker /> Chennai, Tamil Nadu, India</li>
            </ul>
          </div>

          <div className="footer__column">
            <h4 className="footer__heading">Follow Us</h4>
            <div className="footer__social">
              <a href="#" aria-label="Facebook" className="footer__social-icon"><FaFacebookF /></a>
              <a href="#" aria-label="Instagram" className="footer__social-icon"><FaInstagram /></a>
              <a href="#" aria-label="Twitter" className="footer__social-icon"><FaTwitter /></a>
              <a href="#" aria-label="YouTube" className="footer__social-icon"><FaYoutube /></a>
            </div>
          </div>
        </div>

        <div className="footer__bottom">
          <p>&copy; {new Date().getFullYear()} HemoConnect360. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
