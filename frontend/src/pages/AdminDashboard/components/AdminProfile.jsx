import { useState } from 'react'
import {
  FaUserCircle,
  FaEnvelope,
  FaUserTag,
  FaCalendarAlt,
  FaKey,
  FaSave,
  FaCheckCircle,
  FaToggleOn,
  FaToggleOff,
} from 'react-icons/fa'
import AdminModal from './common/AdminModal'
import StateMessage from './common/StateMessage'

const AdminProfile = ({ data, loading, error, onRetry, onSaveProfile, onChangePassword }) => {
  const [form, setForm] = useState({ name: '', email: '', title: '' })
  const [prevData, setPrevData] = useState(data)
  const [saving, setSaving] = useState(false)
  const [savedFlash, setSavedFlash] = useState(false)
  const [passwordOpen, setPasswordOpen] = useState(false)
  const [passwordForm, setPasswordForm] = useState({ current: '', next: '', confirm: '' })
  const [passwordBusy, setPasswordBusy] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState(false)

  const profile = data || {}

  if (data !== prevData) {
    setPrevData(data)
    setForm({
      name: (data && data.name) || '',
      email: (data && data.email) || '',
      title: (data && data.title) || '',
    })
  }

  const prefs = profile.notificationPrefs || {}
  const systemPrefs = profile.systemPrefs || {}

  const notifyToggles = [
    { key: 'email', label: 'Email Notifications', desc: 'Receive platform alerts and announcements via email.' },
    { key: 'urgent', label: 'Urgent Alerts', desc: 'Notify me immediately for urgent and critical alerts.' },
    { key: 'verification', label: 'Verification Updates', desc: 'Notify me when new verification requests are submitted.' },
    { key: 'security', label: 'Security Alerts', desc: 'Notify me when suspicious activity is flagged.' },
    { key: 'system', label: 'System Notices', desc: 'Receive platform maintenance and system notices.' },
  ]

  const handleSave = async () => {
    if (!form.name.trim() || !form.email.trim()) return
    setSaving(true)
    try {
      await onSaveProfile({ name: form.name.trim(), email: form.email.trim(), title: form.title.trim() })
      setSavedFlash(true)
      setTimeout(() => setSavedFlash(false), 3000)
    } finally {
      setSaving(false)
    }
  }

  const togglePref = (key) => {
    const next = {
      ...prefs,
      [key]: !(prefs[key] ?? true),
    }
    onSaveProfile({ name: form.name, email: form.email, title: form.title, notificationPrefs: next })
  }

  const changeSystemPref = (updates) => {
    onSaveProfile({ name: form.name, email: form.email, title: form.title, systemPrefs: { ...systemPrefs, ...updates } })
  }

  const submitPassword = async () => {
    setPasswordError('')
    setPasswordSuccess(false)
    if (!passwordForm.current || !passwordForm.next || !passwordForm.confirm) {
      setPasswordError('All fields are required.')
      return
    }
    if (passwordForm.next.length < 6) {
      setPasswordError('New password must be at least 6 characters long.')
      return
    }
    if (passwordForm.next !== passwordForm.confirm) {
      setPasswordError('New password and confirmation do not match.')
      return
    }
    setPasswordBusy(true)
    try {
      await onChangePassword(passwordForm.current, passwordForm.next)
      setPasswordSuccess(true)
      setPasswordForm({ current: '', next: '', confirm: '' })
    } catch (err) {
      setPasswordError(err?.message || 'Unable to change password. Please try again.')
    } finally {
      setPasswordBusy(false)
    }
  }

  if (loading) {
    return <StateMessage type="loading" message="Loading admin profile..." />
  }

  if (error) {
    return <StateMessage type="error" message="Unable to load admin profile." onRetry={onRetry} />
  }

  return (
    <div className="tab-panel">
      <p className="tab-info-text">Manage your administrator profile, notification preferences, and account security.</p>

      <div className="profile-header-card">
        <div className="profile-avatar">
          <FaUserCircle />
        </div>
        <div className="profile-header-info">
          <h3>{form.name || profile.name || 'Administrator'}</h3>
          <p>{form.title || profile.title || 'Platform Administrator'}</p>
        </div>
        <div className="profile-header-meta">
          <span><FaEnvelope /> {form.email || profile.email || '—'}</span>
          <span><FaUserTag /> {profile.role || 'Admin'}</span>
          {profile.lastLogin && <span><FaCalendarAlt /> Last login {profile.lastLogin}</span>}
          {profile.accountStatus && <span>Account: {profile.accountStatus}</span>}
        </div>
      </div>

      <div className="profile-grid">
        <div className="profile-card">
          <h4 className="profile-card-title">Profile Information</h4>
          <div className="form-group">
            <label htmlFor="profileName">Full Name</label>
            <input
              id="profileName"
              type="text"
              placeholder="Full name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label htmlFor="profileEmail">Email Address</label>
            <input
              id="profileEmail"
              type="email"
              placeholder="Email address"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label htmlFor="profileTitle">Role / Title</label>
            <input
              id="profileTitle"
              type="text"
              placeholder="e.g. Platform Administrator"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div className="profile-save-row">
            <button className="confirm-action-btn confirm-action-btn--primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : <><FaSave /> Save Changes</>}
            </button>
            {savedFlash && <span className="saved-flash"><FaCheckCircle /> Changes saved.</span>}
          </div>
        </div>

        <div className="profile-card">
          <h4 className="profile-card-title">Notification Preferences</h4>
          {notifyToggles.map((t) => (
            <div className="preference-row" key={t.key}>
              <div className="preference-text">
                <strong>{t.label}</strong>
                <p>{t.desc}</p>
              </div>
              <button className="toggle-btn" onClick={() => togglePref(t.key)} title={prefs[t.key] ?? true ? 'Turn off' : 'Turn on'}>
                {prefs[t.key] ?? true ? <FaToggleOn /> : <FaToggleOff />}
              </button>
            </div>
          ))}
        </div>

        <div className="profile-card">
          <h4 className="profile-card-title">System Preferences</h4>
          <div className="form-group">
            <label htmlFor="defaultTab">Default Tab</label>
            <select
              id="defaultTab"
              value={systemPrefs.defaultTab || 'dashboard'}
              onChange={(e) => changeSystemPref({ defaultTab: e.target.value })}
            >
              <option value="dashboard">Dashboard</option>
              <option value="donors">Donor Management</option>
              <option value="requests">Blood Requests</option>
              <option value="verification">Verification</option>
              <option value="security">Security</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="itemsPerPage">Items Per Page</label>
            <select
              id="itemsPerPage"
              value={Number(systemPrefs.itemsPerPage) || 20}
              onChange={(e) => changeSystemPref({ itemsPerPage: Number(e.target.value) })}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
          <p className="form-hint">These preferences control how the control panel behaves for your account.</p>
        </div>

        <div className="profile-card">
          <h4 className="profile-card-title">Account Security</h4>
          <p className="profile-card-desc">Keep your account secure by regularly updating your password.</p>
          <button className="confirm-action-btn confirm-action-btn--primary" onClick={() => setPasswordOpen(true)}>
            <FaKey /> Change Password
          </button>
        </div>
      </div>

      {passwordOpen && (
        <AdminModal
          icon={<FaKey className="modal-icon" />}
          title="Change Password"
          onClose={() => setPasswordOpen(false)}
          footer={
            <>
              <button className="modal-action-close" onClick={() => setPasswordOpen(false)}>Cancel</button>
              <button
                className="confirm-action-btn confirm-action-btn--primary"
                onClick={submitPassword}
                disabled={passwordBusy}
              >
                {passwordBusy ? 'Updating...' : 'Update Password'}
              </button>
            </>
          }
        >
          {passwordSuccess && <div className="form-success-msg"><FaCheckCircle /> Password updated successfully.</div>}
          {passwordError && <div className="form-error-msg">{passwordError}</div>}
          <div className="form-group">
            <label htmlFor="currentPassword">Current Password</label>
            <input
              id="currentPassword"
              type="password"
              placeholder="Current password"
              value={passwordForm.current}
              onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label htmlFor="newPassword">New Password</label>
            <input
              id="newPassword"
              type="password"
              placeholder="At least 6 characters"
              value={passwordForm.next}
              onChange={(e) => setPasswordForm({ ...passwordForm, next: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm New Password</label>
            <input
              id="confirmPassword"
              type="password"
              placeholder="Re-enter new password"
              value={passwordForm.confirm}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
            />
          </div>
        </AdminModal>
      )}
    </div>
  )
}

export default AdminProfile
