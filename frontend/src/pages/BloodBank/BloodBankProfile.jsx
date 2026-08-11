import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FaCalendarAlt,
  FaCheckCircle,
  FaClock,
  FaEdit,
  FaEnvelope,
  FaExclamationTriangle,
  FaFileAlt,
  FaHospital,
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaUserTie,
} from 'react-icons/fa'
import {
  fetchBloodBankProfile,
  updateBloodBankProfile,
} from '../../services/bloodBankService'
import './BloodBankDashboard.css'
import './BloodBankProfile.css'

const BLOOD_BANK_TYPES = [
  'Government Blood Bank',
  'Private Blood Bank',
  'Hospital Blood Bank',
  'NGO / Trust Blood Bank',
  'Other',
]

const STATUS_META = {
  PENDING_VERIFICATION: { label: 'Pending Verification', icon: <FaClock />, className: 'bankprof-status--pending' },
  APPROVED: { label: 'Approved', icon: <FaCheckCircle />, className: 'bankprof-status--approved' },
  VERIFIED: { label: 'Verified', icon: <FaCheckCircle />, className: 'bankprof-status--verified' },
  REJECTED: { label: 'Rejected', icon: <FaExclamationTriangle />, className: 'bankprof-status--rejected' },
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
    className: 'bankprof-status--pending',
  }

const PHONE_RE = /^\d{10}$/
const PINCODE_RE = /^\d{6}$/
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const GROUPS = [
  {
    title: 'Blood Bank Information',
    icon: <FaHospital />,
    fields: [
      { key: 'bloodBankName', label: 'Blood Bank Name', type: 'text', required: true },
      { key: 'bloodBankType', label: 'Blood Bank Type', type: 'select', required: true, options: BLOOD_BANK_TYPES },
      { key: 'registrationNumber', label: 'Registration Number', type: 'text', required: true },
      { key: 'establishedYear', label: 'Established Year', type: 'number', required: true },
      { key: 'officialEmail', label: 'Official Email', type: 'email', required: true },
      { key: 'primaryPhone', label: 'Primary Phone', type: 'tel', required: true },
      { key: 'alternatePhone', label: 'Alternate Phone', type: 'tel', required: false },
    ],
  },
  {
    title: 'Address & Location',
    icon: <FaMapMarkerAlt />,
    fields: [
      { key: 'addressLine', label: 'Address', type: 'text', required: true },
      { key: 'city', label: 'City', type: 'text', required: true },
      { key: 'district', label: 'District', type: 'text', required: false },
      { key: 'state', label: 'State', type: 'text', required: true },
      { key: 'pincode', label: 'Pincode', type: 'pincode', required: true },
      {
        key: 'latitude',
        label: 'Latitude',
        type: 'number',
        required: false,
        hint: 'Coordinates help match nearby blood requests. Leave blank to remove.',
      },
      { key: 'longitude', label: 'Longitude', type: 'number', required: false },
    ],
  },
  {
    title: 'Authorized Person',
    icon: <FaUserTie />,
    fields: [
      { key: 'authorizedPersonName', label: 'Authorized Person Name', type: 'text', required: true },
      { key: 'designation', label: 'Designation', type: 'text', required: true },
      { key: 'authorizedPersonPhone', label: 'Authorized Person Phone', type: 'tel', required: true },
      { key: 'authorizedPersonEmail', label: 'Authorized Person Email', type: 'email', required: false },
    ],
  },
]

const validateForm = (form) => {
  const errors = {}

  const required = (key, label) => {
    const value = form[key]
    if (value === undefined || String(value).trim() === '') {
      errors[key] = `${label} is required`
      return false
    }
    return true
  }

  const phone = (key, label) => {
    const value = String(form[key] || '').trim()
    if (value && !PHONE_RE.test(value)) {
      errors[key] = `${label} must be a 10-digit number`
    }
  }

  const email = (key, label) => {
    const value = String(form[key] || '').trim()
    if (value && !EMAIL_RE.test(value)) {
      errors[key] = `Enter a valid ${label.toLowerCase()}`
    }
  }

  const number = (key, label, min, max) => {
    const value = String(form[key] || '').trim()
    if (!value) return
    const parsed = Number(value)
    if (!Number.isFinite(parsed)) {
      errors[key] = `${label} must be a number`
    } else if (min != null && parsed < min) {
      errors[key] = `${label} must be at least ${min}`
    } else if (max != null && parsed > max) {
      errors[key] = `${label} must be at most ${max}`
    }
  }

  for (const group of GROUPS) {
    for (const field of group.fields) {
      if (field.required) required(field.key, field.label)
    }
  }

  if (required('officialEmail', 'Official Email')) email('officialEmail', 'Official Email')
  email('authorizedPersonEmail', 'Authorized person email')
  if (required('primaryPhone', 'Primary phone')) phone('primaryPhone', 'Primary phone')
  phone('alternatePhone', 'Alternate phone')
  if (required('authorizedPersonPhone', 'Authorized person phone')) {
    phone('authorizedPersonPhone', 'Authorized person phone')
  }

  if (required('pincode', 'Pincode')) {
    const value = String(form.pincode).trim()
    if (!PINCODE_RE.test(value)) errors.pincode = 'Pincode must be a 6-digit number'
  }

  if (required('establishedYear', 'Established year')) {
    const value = Number(form.establishedYear)
    const currentYear = new Date().getFullYear()
    if (!Number.isInteger(value) || value < 1900 || value > currentYear) {
      errors.establishedYear = `Established year must be between 1900 and ${currentYear}`
    }
  }

  number('latitude', 'Latitude', -90, 90)
  number('longitude', 'Longitude', -180, 180)

  return errors
}

const formatDate = (value) => {
  if (!value) return '—'
  return new Date(value).toLocaleString()
}

const BloodBankProfile = () => {
  const navigate = useNavigate()

  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({})
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    let active = true

    const load = async () => {
      try {
        const { bloodBank } = await fetchBloodBankProfile()
        if (!active) return
        setProfile(bloodBank)
      } catch (err) {
        if (!active) return
        if (err.status === 401) {
          navigate('/blood-bank/login', { replace: true })
          return
        }
        setError(err.message || 'Unable to load blood bank profile.')
      } finally {
        if (active) setLoading(false)
      }
    }

    load()

    return () => {
      active = false
    }
  }, [navigate, reloadKey])

  const retry = () => {
    setError('')
    setLoading(true)
    setReloadKey((key) => key + 1)
  }

  const startEdit = () => {
    setForm({
      bloodBankName: profile.bloodBankName || '',
      bloodBankType: profile.bloodBankType || '',
      registrationNumber: profile.registrationNumber || '',
      establishedYear: profile.establishedYear != null ? String(profile.establishedYear) : '',
      officialEmail: profile.officialEmail || '',
      primaryPhone: profile.primaryPhone || '',
      alternatePhone: profile.alternatePhone || '',
      addressLine: profile.addressLine || '',
      city: profile.city || '',
      district: profile.district || '',
      state: profile.state || '',
      pincode: profile.pincode != null ? String(profile.pincode) : '',
      latitude: profile.latitude != null ? String(profile.latitude) : '',
      longitude: profile.longitude != null ? String(profile.longitude) : '',
      authorizedPersonName: profile.authorizedPersonName || '',
      designation: profile.designation || '',
      authorizedPersonPhone: profile.authorizedPersonPhone || '',
      authorizedPersonEmail: profile.authorizedPersonEmail || '',
    })
    setErrors({})
    setSubmitError('')
    setSuccess('')
    setEditing(true)
  }

  const cancelEdit = () => {
    setEditing(false)
    setErrors({})
    setSubmitError('')
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const validationErrors = validateForm(form)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      setSubmitError('Please fix the highlighted fields.')
      return
    }

    setSaving(true)
    setSubmitError('')
    try {
      await updateBloodBankProfile({
        bloodBankName: form.bloodBankName.trim(),
        bloodBankType: form.bloodBankType,
        registrationNumber: form.registrationNumber.trim(),
        establishedYear: Number(form.establishedYear),
        officialEmail: form.officialEmail.trim(),
        primaryPhone: form.primaryPhone.trim(),
        alternatePhone: form.alternatePhone.trim(),
        addressLine: form.addressLine.trim(),
        city: form.city.trim(),
        district: form.district.trim(),
        state: form.state.trim(),
        pincode: Number(form.pincode),
        latitude: form.latitude.trim() === '' ? null : Number(form.latitude),
        longitude: form.longitude.trim() === '' ? null : Number(form.longitude),
        authorizedPersonName: form.authorizedPersonName.trim(),
        designation: form.designation.trim(),
        authorizedPersonPhone: form.authorizedPersonPhone.trim(),
        authorizedPersonEmail: form.authorizedPersonEmail.trim(),
      })

      const { bloodBank } = await fetchBloodBankProfile()
      setProfile(bloodBank)
      setSuccess('Profile updated successfully.')
      setEditing(false)
    } catch (err) {
      if (err.status === 401) {
        navigate('/blood-bank/login', { replace: true })
        return
      }
      setSubmitError(err.message || 'Unable to update the profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="bloodbank-dash-page">
        <div className="bloodbank-dash-skeleton">
          <div className="bloodbank-dash-skeleton-line bloodbank-dash-skeleton-line--eyebrow" />
          <div className="bloodbank-dash-skeleton-line bloodbank-dash-skeleton-line--title" />
          <div className="bloodbank-dash-skeleton-line" />
          <div className="bloodbank-dash-grid">
            <div className="bloodbank-dash-card bloodbank-dash-card--wide bloodbank-dash-skeleton-card" />
            <div className="bloodbank-dash-card bloodbank-dash-skeleton-card" />
            <div className="bloodbank-dash-card bloodbank-dash-skeleton-card" />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bloodbank-dash-page">
        <div className="bloodbank-dash-restricted bloodbank-dash-restricted--rejected">
          <div className="bloodbank-dash-restricted-icon">
            <FaExclamationTriangle />
          </div>
          <h2>Unable to load blood bank profile.</h2>
          <p>{error}</p>
          <button type="button" className="bloodbank-dash-retry-btn" onClick={retry}>
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="bloodbank-dash-page">
        <div className="bloodbank-dash-restricted bloodbank-dash-restricted--rejected">
          <div className="bloodbank-dash-restricted-icon">
            <FaHospital />
          </div>
          <h2>No Blood Bank Profile</h2>
          <p>No blood bank profile was found for this account. Please register your blood bank first.</p>
        </div>
      </div>
    )
  }

  const statusMeta = getStatusMeta(profile.verificationStatus)

  return (
    <section className="bankprof">
      <div className="bankprof-head">
        <div>
          <span className="bloodbank-dash-eyebrow">Blood Bank Profile</span>
          <h2>Profile</h2>
          <p>Manage your blood bank details. Registration and verification documents are managed by the admin.</p>
        </div>
        {!editing && (
          <button type="button" className="bankprof-edit-btn" onClick={startEdit}>
            <FaEdit /> Edit Profile
          </button>
        )}
      </div>

      {success && (
        <div className="bankprof-banner bankprof-banner--success">
          <FaCheckCircle /> {success}
        </div>
      )}
      {submitError && (
        <div className="bankprof-banner bankprof-banner--error">
          <FaExclamationTriangle /> {submitError}
        </div>
      )}

      {editing ? (
        <form className="bankprof-form" onSubmit={handleSubmit} noValidate>
          {GROUPS.map((group) => (
            <section className="bankprof-card" key={group.title}>
              <div className="bankprof-card-title">
                {group.icon} {group.title}
              </div>
              <div className="bankprof-fields">
                {group.fields.map((field) => {
                  const hasError = Boolean(errors[field.key])
                  return (
                    <div
                      className={`bankprof-field bankprof-field--${field.type}${hasError ? ' bankprof-field--error' : ''}`}
                      key={field.key}
                    >
                      <label htmlFor={`bankprof-${field.key}`}>
                        {field.label}
                        {field.required && <span className="bankprof-required"> *</span>}
                      </label>
                      {field.type === 'select' ? (
                        <select id={`bankprof-${field.key}`} name={field.key} value={form[field.key] || ''} onChange={handleChange}>
                          <option value="">Select blood bank type</option>
                          {field.options.map((option) => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          id={`bankprof-${field.key}`}
                          name={field.key}
                          type={field.type}
                          value={form[field.key] || ''}
                          onChange={handleChange}
                          inputMode={field.type === 'number' ? 'decimal' : field.type === 'tel' ? 'tel' : undefined}
                        />
                      )}
                      {field.hint && !hasError && <span className="bankprof-hint">{field.hint}</span>}
                      {hasError && <span className="bankprof-field-error">{errors[field.key]}</span>}
                    </div>
                  )
                })}
              </div>
            </section>
          ))}

          <div className="bankprof-actions">
            <button type="submit" className="bankprof-save" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button type="button" className="bankprof-cancel" onClick={cancelEdit} disabled={saving}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <>
          <div className="bankprof-grid">
            <section className="bankprof-card">
              <div className="bankprof-card-title">
                <FaHospital /> Blood Bank Information
              </div>
              <dl className="bankprof-fields">
                <div><dt>Blood Bank Name</dt><dd>{profile.bloodBankName}</dd></div>
                <div><dt>Blood Bank Type</dt><dd>{profile.bloodBankType}</dd></div>
                <div><dt>Registration Number</dt><dd>{profile.registrationNumber}</dd></div>
                <div><dt>Established Year</dt><dd><FaCalendarAlt /> {profile.establishedYear || '—'}</dd></div>
                <div><dt>Official Email</dt><dd><FaEnvelope /> {profile.officialEmail}</dd></div>
                <div><dt>Primary Phone</dt><dd><FaPhoneAlt /> {profile.primaryPhone}</dd></div>
                <div><dt>Alternate Phone</dt><dd><FaPhoneAlt /> {profile.alternatePhone || '—'}</dd></div>
              </dl>
            </section>

            <section className="bankprof-card">
              <div className="bankprof-card-title">
                <FaMapMarkerAlt /> Address &amp; Location
              </div>
              <dl className="bankprof-fields">
                <div><dt>Address</dt><dd>{profile.addressLine}</dd></div>
                <div><dt>City</dt><dd>{profile.city}</dd></div>
                <div><dt>District</dt><dd>{profile.district || '—'}</dd></div>
                <div><dt>State</dt><dd>{profile.state}</dd></div>
                <div><dt>Pincode</dt><dd>{profile.pincode}</dd></div>
                <div>
                  <dt>Coordinates</dt>
                  <dd>
                    {profile.latitude && profile.longitude
                      ? `${profile.latitude}, ${profile.longitude}`
                      : '—'}
                  </dd>
                </div>
              </dl>
            </section>

            <section className="bankprof-card">
              <div className="bankprof-card-title">
                <FaUserTie /> Authorized Person
              </div>
              <dl className="bankprof-fields">
                <div><dt>Name</dt><dd>{profile.authorizedPersonName}</dd></div>
                <div><dt>Designation</dt><dd>{profile.designation}</dd></div>
                <div><dt>Contact Number</dt><dd><FaPhoneAlt /> {profile.authorizedPersonPhone}</dd></div>
                <div><dt>Official Email</dt><dd><FaEnvelope /> {profile.authorizedPersonEmail || '—'}</dd></div>
              </dl>
            </section>

            <section className="bankprof-card">
              <div className="bankprof-card-title">
                <FaCheckCircle /> Verification &amp; Documents
              </div>
              <div className="bankprof-verification">
                <span className="bankprof-verification-status">
                  <span className={`bankprof-status ${statusMeta.className}`}>
                    {statusMeta.icon} {statusMeta.label}
                  </span>
                </span>
                <p className="bankprof-verification-note">
                  Your verification status is reviewed by the admin team. You cannot change it here.
                </p>
                <dl className="bankprof-fields">
                  <div><dt>Verification Notes</dt><dd>{profile.verificationNotes || '—'}</dd></div>
                  <div><dt>Verified At</dt><dd><FaCalendarAlt /> {formatDate(profile.verifiedAt)}</dd></div>
                  <div>
                    <dt>License Document</dt>
                    <dd>{profile.hasLicenseDocument ? <><FaFileAlt /> Uploaded</> : '—'}</dd>
                  </div>
                  <div>
                    <dt>Authorization Document</dt>
                    <dd>{profile.hasAuthorizationDocument ? <><FaFileAlt /> Uploaded</> : '—'}</dd>
                  </div>
                </dl>
              </div>
            </section>
          </div>
        </>
      )}
    </section>
  )
}

export default BloodBankProfile
