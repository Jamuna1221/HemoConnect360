import { useLocation } from 'react-router-dom'
import { FaBars } from 'react-icons/fa'
import { getBloodBankPageTitle } from './bloodBankNav'
import './BloodBankHeader.css'

const BloodBankHeader = ({ profile, onMenuClick }) => {
  const location = useLocation()
  const title = getBloodBankPageTitle(location.pathname)
  const bankName = profile?.bloodBankName || 'Blood Bank'
  const initial = bankName.charAt(0).toUpperCase()

  return (
    <header className="bloodbank-header">
      <div className="bloodbank-header-left">
        <button type="button" className="bloodbank-header-menu" onClick={onMenuClick} aria-label="Open menu">
          <FaBars />
        </button>
        <div className="bloodbank-header-title">
          <h1>{title}</h1>
          <span>Blood Bank Portal</span>
        </div>
      </div>

      <div className="bloodbank-header-right">
        <div className="bloodbank-header-bank">
          <span className="bloodbank-header-avatar">{initial}</span>
          <div className="bloodbank-header-bank-text">
            <strong>{bankName}</strong>
            <span>{profile?.bloodBankType || 'Portal'}</span>
          </div>
        </div>
      </div>
    </header>
  )
}

export default BloodBankHeader
