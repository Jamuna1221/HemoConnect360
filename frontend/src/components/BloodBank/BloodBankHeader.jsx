import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { FaBars, FaBell, FaCheck } from 'react-icons/fa'
import { getBloodBankPageTitle } from './bloodBankNav'
import {
  fetchBloodBankNotifications,
  markBloodBankNotificationRead,
} from '../../services/bloodBankService'
import './BloodBankHeader.css'

const BloodBankHeader = ({ profile, onMenuClick }) => {
  const location = useLocation()
  const title = getBloodBankPageTitle(location.pathname)
  const bankName = profile?.bloodBankName || 'Blood Bank'
  const initial = bankName.charAt(0).toUpperCase()

  const [notifications, setNotifications] = useState([])
  const [showNotifications, setShowNotifications] = useState(false)
  const notificationRef = useRef(null)

  useEffect(() => {
    let active = true
    const loadNotifications = () =>
      fetchBloodBankNotifications()
        .then((items) => {
          if (active) setNotifications(items)
        })
        .catch((error) => console.warn('[blood-bank-notifications] Load failed', error))

    loadNotifications()
    const timer = setInterval(loadNotifications, 8000)
    return () => {
      active = false
      clearInterval(timer)
    }
  }, [])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleNotificationClick = async (notification) => {
    if (!notification.read_at) {
      await markBloodBankNotificationRead(notification.id).catch(() => {})
      setNotifications((items) =>
        items.map((item) =>
          item.id === notification.id ? { ...item, read_at: new Date().toISOString() } : item,
        ),
      )
    }
  }

  const unreadCount = notifications.filter((notification) => !notification.read_at).length

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
        <div className="bloodbank-header-notifications" ref={notificationRef}>
          <button
            type="button"
            className="bloodbank-header-bell"
            aria-label="Notifications"
            onClick={() => setShowNotifications((open) => !open)}
          >
            <FaBell />
            {unreadCount > 0 && <span className="bloodbank-header-badge">{unreadCount}</span>}
          </button>
          {showNotifications && (
            <div className="bloodbank-header-dropdown">
              <h4>Notifications</h4>
              {notifications.length === 0 ? (
                <p className="bloodbank-header-dropdown-empty">No notifications yet.</p>
              ) : (
                notifications.map((notification) => (
                  <button
                    type="button"
                    key={notification.id}
                    className={`bloodbank-header-notification-item ${!notification.read_at ? 'bloodbank-header-notification-item--unread' : ''}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <span className="bloodbank-header-notification-item-text">
                      <strong>{notification.title}</strong>
                      <span>{notification.message}</span>
                    </span>
                    {notification.read_at && <FaCheck className="bloodbank-header-notification-item-check" />}
                  </button>
                ))
              )}
            </div>
          )}
        </div>

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
