import { FaTint, FaPhoneAlt, FaEnvelope, FaMapMarkerAlt, FaFacebookF, FaTwitter, FaInstagram, FaYoutube } from 'react-icons/fa';
import './Footer.css';

const QUICK_LINKS = [
  { label: 'Home', href: '#home' },
  { label: 'Why Donate', href: '#why-donate' },
  { label: 'About Us', href: '#about' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'FAQs', href: '#faq' },
];

const SOCIAL_LINKS = [
  { icon: <FaFacebookF />, href: '#', label: 'Facebook' },
  { icon: <FaTwitter />, href: '#', label: 'Twitter' },
  { icon: <FaInstagram />, href: '#', label: 'Instagram' },
  { icon: <FaYoutube />, href: '#', label: 'YouTube' },
];

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer__container">
        <div className="footer__brand">
          <a href="#home" className="footer__logo">
            <FaTint className="footer__logo-icon" />
            <span>HemoConnect360</span>
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
            <li>
              <FaPhoneAlt /> +91 98765 43210
            </li>
            <li>
              <FaEnvelope /> support@hemoconnect360.in
            </li>
            <li>
              <FaMapMarkerAlt /> Chennai, Tamil Nadu, India
            </li>
          </ul>
        </div>

        <div className="footer__column">
          <h4 className="footer__heading">Follow Us</h4>
          <div className="footer__social">
            {SOCIAL_LINKS.map((social) => (
              <a href={social.href} key={social.label} aria-label={social.label} className="footer__social-icon">
                {social.icon}
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="footer__bottom">
        <p>&copy; {new Date().getFullYear()} HemoConnect360. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
