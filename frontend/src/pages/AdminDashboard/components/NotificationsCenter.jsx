import { useState } from 'react'
import {
  FaBroadcastTower,
  FaEnvelopeOpen,
  FaEnvelope,
  FaCheckDouble,
  FaSpinner,
  FaExclamationTriangle,
  FaShieldAlt,
  FaHeartbeat,
  FaIdCard,
  FaBullhorn,
  FaCog
} from 'react-icons/fa'
import StateMessage from './common/StateMessage'

const TYPE_META = {
  REGISTRATION: { icon: FaIdCard, label: 'Registration', className: 'ntype--registration' },
  BLOOD_REQUEST: { icon: FaHeartbeat, label: 'Blood Request', className: 'ntype--request' },
  VERIFICATION: { icon: FaShieldAlt, label: 'Verification', className: 'ntype--verification' },
  URGENT_REQUEST: { icon: FaExclamationTriangle, label: 'Urgent Request', className: 'ntype--urgent' },
  SECURITY: { icon: FaExclamationTriangle, label: 'Security', className: 'ntype--security' },
  SYSTEM: { icon: FaCog, label: 'System', className: 'ntype--system' },
  ANNOUNCEMENT: { icon: FaBullhorn, label: 'Announcement', className: 'ntype--announcement' },
}

const fmtTime = (value) => {
  if (!value) return ''
  const d = new Date(value)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleString()
}

const NotificationsCenter = ({
  data = [],
  loading,
  error,
  onRetry,
  onMarkRead,
  onMarkAllRead,
  onAnnouncement,
}) => {
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const [form, setForm] = useState({
    title: '',
    message: '',
    audience: 'all',
    priority: 'normal',
  })

  const notifications = Array.isArray(data) ? data : []

  const handleRead = async (id) => {
    try {
      await onMarkRead(id)
    } catch (err) {
      setMsg(err?.message || 'Unable to update notification')
    }
  }

  const handleReadAll = async () => {
    try {
      await onMarkAllRead()
    } catch (err) {
      setMsg(err?.message || 'Unable to update notifications')
    }
  }

  const handlePublish = async (e) => {
    e.preventDefault()
    if (!form.title.trim() || !form.message.trim()) {
      setMsg('Please provide both a title and message for the announcement.')
      return
    }
    setBusy(true)
    setMsg('')
    try {
      await onAnnouncement(form.title, form.message, form.audience, form.priority)
      setMsg('Announcement published successfully!')
      setForm({ title: '', message: '', audience: 'all', priority: 'normal' })
      setTimeout(() => setMsg(''), 3000)
    } catch (err) {
      setMsg(err?.message || 'Unable to publish announcement')
    } finally {
      setBusy(false)
    }
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length

  return (
    <div className="tab-panel">
      <p className="tab-info-text">Send announcements and review system notifications across the platform.</p>

      <div className="notification-composer-grid">
        <form className="notification-form" onSubmit={handlePublish}>
          <h3>Publish Announcement</h3>
          {msg && <div className="broadcast-msg-banner">{msg}</div>}

          <div className="form-group">
            <label htmlFor="announcement-title">Title</label>
            <input
              id="announcement-title"
              type="text"
              placeholder="e.g. Emergency blood drive in Chennai"
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
            />
          </div>

          <div className="form-group">
            <label htmlFor="announcement-message">Message</label>
            <textarea
              id="announcement-message"
              placeholder="Write the announcement content..."
              value={form.message}
              onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))}
            />
          </div>

          <div className="form-row-grid">
            <div className="form-group">
              <label htmlFor="announcement-audience">Audience</label>
              <select
                id="announcement-audience"
                value={form.audience}
                onChange={(e) => setForm((prev) => ({ ...prev, audience: e.target.value }))}
              >
                <option value="all">All Users</option>
                <option value="donors">Donors</option>
                <option value="requesters">Requesters</option>
                <option value="blood_banks">Blood Banks</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="announcement-priority">Priority</label>
              <select
                id="announcement-priority"
                value={form.priority}
                onChange={(e) => setForm((prev) => ({ ...prev, priority: e.target.value }))}
              >
                <option value="normal">Normal</option>
                <option value="important">Important</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <button type="submit" className="broadcast-submit-btn" disabled={busy}>
            <FaBroadcastTower /> {busy ? 'Publishing...' : 'Publish Announcement'}
          </button>
        </form>

        <div className="notification-history-card">
          <div className="notification-list-header">
            <h3>Notifications</h3>
            <div className="notification-list-actions">
              <span className="notification-unread-count">{unreadCount} unread</span>
              <button className="mark-all-read-btn" onClick={handleReadAll}>
                <FaCheckDouble /> Mark all read
              </button>
            </div>
          </div>

          {loading ? (
            <div className="admin-loading-state"><FaSpinner className="spin" /> Loading notifications...</div>
          ) : error ? (
            <StateMessage type="error" message="Unable to load notifications." onRetry={onRetry} />
          ) : (
            <div className="alert-history-list">
              {notifications.map((n) => {
                const meta = TYPE_META[n.type] || TYPE_META.SYSTEM
                const Icon = meta.icon
                return (
                  <div className={`alert-history-row notification-row ${n.isRead ? '' : 'notification-row--unread'}`} key={n.id}>
                    <div className="notification-row-top">
                      <span className={`notification-type-badge ${meta.className}`}><Icon /> {meta.label}</span>
                      <span className={`urgency-badge urgency-badge--${(n.priority || 'normal').toLowerCase()}`}>{n.priority}</span>
                    </div>
                    <div className="notification-title">{n.title}</div>
                    {n.description && <p className="alert-text">{n.description}</p>}
                    <div className="notification-row-bottom">
                      <span className="meta-time">{fmtTime(n.createdAt)}</span>
                      <span className="notification-audience">{n.audience}</span>
                      {!n.isRead ? (
                        <button className="notification-read-btn" onClick={() => handleRead(n.id)}>
                          <FaEnvelope /> Mark read
                        </button>
                      ) : (
                        <span className="notification-read-state"><FaEnvelopeOpen /> Read</span>
                      )}
                    </div>
                  </div>
                )
              })}
              {notifications.length === 0 && (
                <div className="empty-text">No notifications yet.</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default NotificationsCenter
