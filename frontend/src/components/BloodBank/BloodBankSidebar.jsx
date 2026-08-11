import { NavLink } from 'react-router-dom'
import { FaHospital, FaSignOutAlt, FaTimes } from 'react-icons/fa'
import logo from '../../assets/logo/Hemoconnectlogo.png'
import { BLOOD_BANK_NAV } from './bloodBankNav'
import './BloodBankSidebar.css'

const BloodBankSidebar = ({ profile, open, onClose, onLogout }) => {
  const bankName = profile?.bloodBankName || 'Blood Bank'
  const bankType = profile?.bloodBankType || 'Portal'

  const handleLogout = () => {
    onLogout()
    onClose()
  }

  return (
    <>
      {open && <div className="bloodbank-sidebar-backdrop" onClick={onClose} />}
      <aside className={`bloodbank-sidebar ${open ? 'bloodbank-sidebar--open' : ''}`}>
        <div className="bloodbank-sidebar-brand">
          <NavLink to="/blood-bank/dashboard" className="bloodbank-sidebar-logo" onClick={onClose}>
            <img src={logo} alt="HemoConnect360" />
          </NavLink>
          <button type="button" className="bloodbank-sidebar-close" onClick={onClose} aria-label="Close menu">
            <FaTimes />
          </button>
        </div>

        <div className="bloodbank-sidebar-bank">
          <span className="bloodbank-sidebar-bank-icon"><FaHospital /></span>
          <div className="bloodbank-sidebar-bank-text">
            <strong>{bankName}</strong>
            <span>{bankType}</span>
          </div>
        </div>

        <nav className="bloodbank-sidebar-nav">
          <span className="bloodbank-sidebar-label">Menu</span>
          {BLOOD_BANK_NAV.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `bloodbank-sidebar-link ${isActive ? 'bloodbank-sidebar-link--active' : ''}`
              }
              onClick={onClose}
            >
              <span className="bloodbank-sidebar-link-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="bloodbank-sidebar-footer">
          <NavLink to="/" className="bloodbank-sidebar-home">Back to Home</NavLink>
          <button type="button" className="bloodbank-sidebar-logout" onClick={handleLogout}>
            <FaSignOutAlt /> Sign Out
          </button>
        </div>
      </aside>
    </>
  )
}

export default BloodBankSidebar
