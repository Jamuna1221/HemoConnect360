import { useEffect, useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import {
  FaBell,
  FaCheckCircle,
  FaClock,
  FaEnvelope,
  FaExclamationTriangle,
  FaEye,
  FaEyeSlash,
  FaLock,
  FaMapMarkerAlt,
  FaShieldAlt,
  FaSignOutAlt,
  FaUserCircle,
} from 'react-icons/fa'
import {
  changeBloodBankPassword,
  fetchBloodBankSettings,
  signOutBloodBank,
  updateBloodBankSettings,
} from '../../services/bloodBankService'
import { getSupabase } from '../../lib/supabase'
import './BloodBankDashboard.css'
import './BloodBankSettings.css'

const STATUS_META = {
  PENDING_VERIFICATION: { label: 'Pending Verification', icon: <FaClock />, className: 'bb-set-status--pending' },
  APPROVED: { label: 'Approved', icon: <FaCheckCircle />, className: 'bb-set-status--approved' },
  VERIFIED: { label: 'Verified', icon: <FaCheckCircle />, className: 'bb-set-status--verified' },
  REJECTED: { label: 'Rejected', icon: <FaExclamationTriangle />, className: 'bb-set-status--rejected' },
}

const humanize = (value) =>
  String(value || '')
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase())

const getStatusMeta = (status) =>
  STATUS_META[status] || {
    label: humanize(status) || 'Unknown',
    icon: <FaClock />,
    className: 'bb-set-status--pending',
  }

const RADIUS_OPTIONS = [10, 25, 50, 100]

const NOTIFICATION_PREFS = [
  {
    key: 'bloodRequestNotifications',
    label: 'Blood Request Notifications',
    description: 'Get notified when a new blood request is submitted for your blood bank.',
  },
  {
    key: 'nearbyRequestNotifications',
    label: 'Nearby Request Notifications',
    description: 'Get notified about blood requests near your blood bank within your default radius.',
  },
  {
    key: 'inventoryNotifications',
    label: 'Inventory / Low Stock Notifications',
    description: 'Get notified when inventory changes or a blood group runs low.',
  },
  {
    key: 'collectionNotifications',
    label: 'Collection Notifications',
    description: 'Get notified about blood collection activity and donor donations.',
  },
  {
    key: 'systemNotifications',
    label: 'System Notifications',
    description: 'Receive important updates about your blood bank account and the platform.',
  },
]

const getPasswordStrength = (value) => {
  if (!value) return ''
  let score = 0
  if (value.length >= 6) score += 1
  if (value.length >= 10) score += 1
  if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score += 1
  if (/\d/.test(value)) score += 1
  if (/[^A-Za-z0-9]/.test(value)) score += 1
  if (score <= 2) return { label: 'Weak', level: 'weak' }
  if (score <= 3) return { label: 'Medium', level: 'medium' }
  return { label: 'Strong', level: 'strong' }
}

const BloodBankSettings = () => {
  const navigate = useNavigate()
  const { bloodBank: profile } = useOutletContext()

  const [settings, setSettings] = useState(null)
  const [settingsLoading, setSettingsLoading] = useState(true)
  const [settingsError, setSettingsError] = useState('')
  const [settingsReloadKey, setSettingsReloadKey] = useState(0)

  const [form, setForm] = useState({
    bloodRequestNotifications: true,
    nearbyRequestNotifications: true,
    inventoryNotifications: true,
    collectionNotifications: true,
    systemNotifications: true,
    defaultRequestRadiusKm: 25,
  })
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [saveSuccess, setSaveSuccess] = useState('')

  const [sessionEmail, setSessionEmail] = useState('')

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordErrors, setPasswordErrors] = useState({})
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')

  const [signingOut, setSigningOut] = useState(false)

  useEffect(() => {
    getSupabase()
      .auth.getUser()
      .then(({ data }) => {
        if (data?.user?.email) setSessionEmail(data.user.email)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    let active = true

    const load = async () => {
      try {
        const data = await fetchBloodBankSettings()
        if (!active) return
        setSettings(data)
        setForm({
          bloodRequestNotifications: data.bloodRequestNotifications,
          nearbyRequestNotifications: data.nearbyRequestNotifications,
          inventoryNotifications: data.inventoryNotifications,
          collectionNotifications: data.collectionNotifications,
          systemNotifications: data.systemNotifications,
          defaultRequestRadiusKm: data.defaultRequestRadiusKm,
        })
        setSaveError('')
      } catch (err) {
        if (!active) return
        if (err.status === 401) {
          navigate('/blood-bank/login', { replace: true })
          return
        }
        setSettingsError(err.message || 'Unable to load blood bank settings.')
      } finally {
        if (active) setSettingsLoading(false)
      }
    }

    load()

    return () => {
      active = false
    }
  }, [navigate, settingsReloadKey])

  const retrySettings = () => {
    setSettingsLoading(true)
    setSettingsError('')
    setSaveError('')
    setSaveSuccess('')
    setSettingsReloadKey((key) => key + 1)
  }

  const isDirty = () =>
    settings &&
    (settings.bloodRequestNotifications !== form.bloodRequestNotifications ||
      settings.nearbyRequestNotifications !== form.nearbyRequestNotifications ||
      settings.inventoryNotifications !== form.inventoryNotifications ||
      settings.collectionNotifications !== form.collectionNotifications ||
      settings.systemNotifications !== form.systemNotifications ||
      settings.defaultRequestRadiusKm !== form.defaultRequestRadiusKm)

  const togglePref = (key) => {
    setSaveSuccess('')
    setSaveError('')
    setForm((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const handleRadiusChange = (e) => {
    setSaveSuccess('')
    setSaveError('')
    setForm((prev) => ({ ...prev, defaultRequestRadiusKm: Number(e.target.value) }))
  }

  const handleSaveSettings = async (e) => {
    e.preventDefault()
    if (saving) return

    setSaving(true)
    setSaveError('')
    setSaveSuccess('')
    try {
      const saved = await updateBloodBankSettings({
        bloodRequestNotifications: form.bloodRequestNotifications,
        nearbyRequestNotifications: form.nearbyRequestNotifications,
        inventoryNotifications: form.inventoryNotifications,
        collectionNotifications: form.collectionNotifications,
        systemNotifications: form.systemNotifications,
        defaultRequestRadiusKm: form.defaultRequestRadiusKm,
      })
      setSettings(saved)
      setForm({
        bloodRequestNotifications: saved.bloodRequestNotifications,
        nearbyRequestNotifications: saved.nearbyRequestNotifications,
        inventoryNotifications: saved.inventoryNotifications,
        collectionNotifications: saved.collectionNotifications,
        systemNotifications: saved.systemNotifications,
        defaultRequestRadiusKm: saved.defaultRequestRadiusKm,
      })
      setSaveSuccess('Settings saved successfully.')
    } catch (err) {
      if (err.status === 401) {
        navigate('/blood-bank/login', { replace: true })
        return
      }
      setSaveError(err.message || 'Unable to save settings. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    const errors = {}
    if (!newPassword) {
      errors.newPassword = 'New password is required'
    } else if (newPassword.length < 6) {
      errors.newPassword = 'New password must be at least 6 characters'
    }
    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your new password'
    } else if (confirmPassword !== newPassword) {
      errors.confirmPassword = 'Passwords do not match'
    }
    setPasswordErrors(errors)
    if (Object.keys(errors).length > 0) return

    setPasswordSaving(true)
    setPasswordError('')
    setPasswordSuccess('')
    try {
      await changeBloodBankPassword({ newPassword })
      setNewPassword('')
      setConfirmPassword('')
      setPasswordSuccess('Password updated successfully.')
    } catch (err) {
      setPasswordError(err.message || 'Unable to update your password.')
    } finally {
      setPasswordSaving(false)
    }
  }

  const handleSignOut = async () => {
    if (signingOut) return
    setSigningOut(true)
    await signOutBloodBank()
    navigate('/blood-bank/login', { replace: true })
  }

  const passwordStrength = getPasswordStrength(newPassword)
  const statusMeta = getStatusMeta(profile?.verificationStatus)

  return (
    <section className="bb-set">
      <div className="bb-set-head">
        <div>
          <span className="bloodbank-dash-eyebrow">Blood Bank Settings</span>
          <h2>Settings</h2>
          <p>Manage your account security, notification preferences and blood bank preferences.</p>
        </div>
        <span className={`bb-set-status ${statusMeta.className}`}>
          {statusMeta.icon} {statusMeta.label}
        </span>
      </div>

      <div className="bb-set-grid">
        <section className="bb-set-card">
          <div className="bb-set-card-title">
            <FaUserCircle /> Account &amp; Security
          </div>

          <div className="bb-set-row">
            <div>
              <strong>Signed-in email</strong>
              <span>This is the email you use to sign in to the blood bank portal.</span>
            </div>
            <div className="bb-set-value">
              <FaEnvelope /> {sessionEmail || '—'}
            </div>
          </div>

          <div className="bb-set-row">
            <div>
              <strong>Account status</strong>
              <span>Your blood bank&apos;s verification status, decided by the admin team.</span>
            </div>
            <div className="bb-set-value">
              <span className={`bb-set-status ${statusMeta.className}`}>
                {statusMeta.icon} {statusMeta.label}
              </span>
            </div>
          </div>

          <form className="bb-set-password" onSubmit={handlePasswordSubmit} noValidate>
            <div className="bb-set-subtitle">
              <FaLock /> Change Password
            </div>
            <p className="bb-set-subtitle-note">
              Your password is stored securely by Supabase Auth and never saved in the application database.
            </p>

            <div className="bb-set-field">
              <label htmlFor="bb-set-new-password">New Password</label>
              <div className={`bb-set-password-input${passwordErrors.newPassword ? ' bb-set-password-input--error' : ''}`}>
                <input
                  id="bb-set-new-password"
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  autoComplete="new-password"
                  placeholder="Enter a new password (min 6 characters)"
                  onChange={(e) => {
                    setNewPassword(e.target.value)
                    setPasswordErrors((prev) => ({ ...prev, newPassword: undefined }))
                    setPasswordError('')
                    setPasswordSuccess('')
                  }}
                />
                <button
                  type="button"
                  className="bb-set-eye"
                  aria-label="Toggle new password visibility"
                  onClick={() => setShowNewPassword((prev) => !prev)}
                >
                  {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {passwordErrors.newPassword && (
                <span className="bb-set-field-error">{passwordErrors.newPassword}</span>
              )}
              {newPassword && passwordStrength && (
                <span className={`bb-set-strength bb-set-strength--${passwordStrength.level}`}>
                  Password strength: {passwordStrength.label}
                </span>
              )}
            </div>

            <div className="bb-set-field">
              <label htmlFor="bb-set-confirm-password">Confirm New Password</label>
              <div className={`bb-set-password-input${passwordErrors.confirmPassword ? ' bb-set-password-input--error' : ''}`}>
                <input
                  id="bb-set-confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  autoComplete="new-password"
                  placeholder="Re-enter your new password"
                  onChange={(e) => {
                    setConfirmPassword(e.target.value)
                    setPasswordErrors((prev) => ({ ...prev, confirmPassword: undefined }))
                    setPasswordError('')
                    setPasswordSuccess('')
                  }}
                />
                <button
                  type="button"
                  className="bb-set-eye"
                  aria-label="Toggle confirm password visibility"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                >
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {passwordErrors.confirmPassword && (
                <span className="bb-set-field-error">{passwordErrors.confirmPassword}</span>
              )}
            </div>

            {passwordError && (
              <div className="bb-set-alert bb-set-alert--error">
                <FaExclamationTriangle /> {passwordError}
              </div>
            )}
            {passwordSuccess && (
              <div className="bb-set-alert bb-set-alert--success">
                <FaCheckCircle /> {passwordSuccess}
              </div>
            )}

            <button
              type="submit"
              className="bb-set-btn bb-set-btn--primary"
              disabled={passwordSaving}
            >
              {passwordSaving ? 'Updating...' : 'Update Password'}
            </button>
          </form>

          <div className="bb-set-divider" />

          <button type="button" className="bb-set-btn bb-set-btn--ghost" onClick={handleSignOut} disabled={signingOut}>
            <FaSignOutAlt /> {signingOut ? 'Signing out...' : 'Sign Out'}
          </button>
        </section>

        {settingsError ? (
          <section className="bb-set-card">
            <div className="bb-set-card-title">
              <FaBell /> Notification Preferences
            </div>
            <div className="bb-set-error">
              <FaExclamationTriangle />
              <div>
                <h3>Unable to Load Settings</h3>
                <p>{settingsError}</p>
              </div>
              <button type="button" className="bb-set-btn bb-set-btn--primary" onClick={retrySettings}>
                Retry
              </button>
            </div>
          </section>
        ) : settingsLoading ? (
          <section className="bb-set-card">
            <div className="bb-set-card-title">
              <FaBell /> Notification Preferences
            </div>
            <div className="bb-set-loading">
              <div className="bloodbank-dash-spinner" />
              <p>Loading your notification preferences...</p>
            </div>
          </section>
        ) : (
          <form className="bb-set-form" onSubmit={handleSaveSettings} noValidate>
            <section className="bb-set-card">
              <div className="bb-set-card-title">
                <FaBell /> Notification Preferences
              </div>
              <div className="bb-set-prefs">
                {NOTIFICATION_PREFS.map((pref) => (
                  <div className="bb-set-pref" key={pref.key}>
                    <div className="bb-set-pref-text">
                      <strong>{pref.label}</strong>
                      <span>{pref.description}</span>
                    </div>
                    <label className="bb-set-switch">
                      <input
                        type="checkbox"
                        checked={form[pref.key]}
                        onChange={() => togglePref(pref.key)}
                        aria-label={pref.label}
                      />
                      <span className="bb-set-switch-slider" />
                    </label>
                  </div>
                ))}
              </div>
            </section>

            <section className="bb-set-card">
              <div className="bb-set-card-title">
                <FaMapMarkerAlt /> Blood Bank Preferences
              </div>
              <div className="bb-set-pref">
                <div className="bb-set-pref-text">
                  <strong>Default Request Radius</strong>
                  <span>
                    The initial search radius used on the Nearby Requests page. Saved settings survive a page
                    refresh.
                  </span>
                </div>
                <select
                  className="bb-set-select"
                  value={form.defaultRequestRadiusKm}
                  onChange={handleRadiusChange}
                  aria-label="Default request radius"
                >
                  {RADIUS_OPTIONS.map((radius) => (
                    <option key={radius} value={radius}>
                      {radius} km
                    </option>
                  ))}
                </select>
              </div>
            </section>

            {saveError && (
              <div className="bb-set-alert bb-set-alert--error">
                <FaExclamationTriangle /> {saveError}
              </div>
            )}
            {saveSuccess && (
              <div className="bb-set-alert bb-set-alert--success">
                <FaCheckCircle /> {saveSuccess}
              </div>
            )}

            <div className="bb-set-actions">
              <button
                type="submit"
                className="bb-set-btn bb-set-btn--primary"
                disabled={saving || !isDirty()}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                className="bb-set-btn bb-set-btn--outline"
                disabled={saving || !isDirty()}
                onClick={() =>
                  setForm({
                    bloodRequestNotifications: settings.bloodRequestNotifications,
                    nearbyRequestNotifications: settings.nearbyRequestNotifications,
                    inventoryNotifications: settings.inventoryNotifications,
                    collectionNotifications: settings.collectionNotifications,
                    systemNotifications: settings.systemNotifications,
                    defaultRequestRadiusKm: settings.defaultRequestRadiusKm,
                  })
                }
              >
                Reset
              </button>
            </div>
          </form>
        )}

        <section className="bb-set-card">
          <div className="bb-set-card-title">
            <FaShieldAlt /> Privacy &amp; Security
          </div>
          <div className="bb-set-row">
            <div>
              <strong>Signed in as</strong>
              <span>All changes are made to your authenticated account only.</span>
            </div>
            <div className="bb-set-value">
              <FaEnvelope /> {sessionEmail || '—'}
            </div>
          </div>
          <div className="bb-set-row">
            <div>
              <strong>Authentication</strong>
              <span>You are signed in with a secure Supabase Auth session.</span>
            </div>
            <div className="bb-set-value bb-set-value--muted">Secured</div>
          </div>
          <div className="bb-set-row">
            <div>
              <strong>Password storage</strong>
              <span>Passwords are stored by Supabase Auth only - never in the application database.</span>
            </div>
            <div className="bb-set-value bb-set-value--muted">Protected</div>
          </div>
          <div className="bb-set-row">
            <div>
              <strong>Data access</strong>
              <span>Database access is restricted to your own blood bank by row-level security.</span>
            </div>
            <div className="bb-set-value bb-set-value--muted">Restricted</div>
          </div>

          <div className="bb-set-divider" />

          <button type="button" className="bb-set-btn bb-set-btn--outline" onClick={handleSignOut} disabled={signingOut}>
            <FaSignOutAlt /> Sign Out of Current Session
          </button>
        </section>

        <section className="bb-set-card bb-set-card--danger">
          <div className="bb-set-card-title">
            <FaExclamationTriangle /> Danger Zone
          </div>
          <p className="bb-set-danger-note">
            Account deactivation is not available in the current system. You can sign out at any time; your data is
            never deleted automatically.
          </p>
          <button type="button" className="bb-set-btn bb-set-btn--danger" onClick={handleSignOut} disabled={signingOut}>
            <FaSignOutAlt /> {signingOut ? 'Signing out...' : 'Sign Out'}
          </button>
        </section>
      </div>
    </section>
  )
}

export default BloodBankSettings
