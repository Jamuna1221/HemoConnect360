import {
  FaTachometerAlt,
  FaBoxes,
  FaHeartbeat,
  FaHandHoldingHeart,
  FaHistory,
  FaMapMarkerAlt,
  FaUserCircle,
  FaCog,
} from 'react-icons/fa'

export const BLOOD_BANK_NAV = [
  { label: 'Dashboard', path: '/blood-bank/dashboard', icon: <FaTachometerAlt /> },
  { label: 'Profile', path: '/blood-bank/profile', icon: <FaUserCircle /> },
  { label: 'Inventory', path: '/blood-bank/inventory', icon: <FaBoxes /> },
  { label: 'Requests', path: '/blood-bank/requests', icon: <FaHeartbeat /> },
  { label: 'Collection Records', path: '/blood-bank/collections', icon: <FaHandHoldingHeart /> },
  { label: 'Nearby Requests', path: '/blood-bank/nearby-requests', icon: <FaMapMarkerAlt /> },
  { label: 'Stock History', path: '/blood-bank/stock-history', icon: <FaHistory /> },
  { label: 'Settings', path: '/blood-bank/settings', icon: <FaCog /> },
]

export const getBloodBankPageTitle = (pathname) => {
  const match = BLOOD_BANK_NAV.find((item) => item.path === pathname)
  return match ? match.label : 'Blood Bank Portal'
}
