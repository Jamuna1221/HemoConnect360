import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FaArrowLeft,
  FaHospital,
  FaEnvelope,
  FaPhoneAlt,
  FaMapMarkerAlt,
  FaCrosshairs,
  FaCity,
  FaUserTie,
  FaUpload,
  FaFilePdf,
  FaEye,
  FaEyeSlash,
  FaLock,
  FaTimes,
  FaShieldAlt,
  FaClipboardCheck,
} from 'react-icons/fa'
import Navbar from '../../components/Navbar/Navbar'
import Footer from '../../components/Footer/Footer'
import {
  registerBloodBank,
  fetchBloodBankProfile,
} from '../../services/bloodBankService'
import { getSupabase } from '../../lib/supabase'
import { getCurrentPosition } from '../../lib/geolocation'
import './BloodBankRegister.css'

const BLOOD_BANK_TYPES = [
  'Government Blood Bank',
  'Private Blood Bank',
  'Hospital Blood Bank',
  'NGO / Trust Blood Bank',
  'Other',
]

const INITIAL_FORM = {
  name: '',
  licenseNumber: '',
  type: '',
  yearEstablished: '',
  email: '',
  primaryPhone: '',
  alternatePhone: '',
  address: '',
  city: '',
  district: '',
  state: '',
  pincode: '',
  latitude: '',
  longitude: '',
  authorizedName: '',
  authorizedDesignation: '',
  authorizedPhone: '',
  authorizedEmail: '',
  licenseDoc: null,
  authorizationDoc: null,
  password: '',
  confirmPassword: '',
  terms: false,
}

const getCurrentYear = () => new Date().getFullYear()

const isImage = (file) => file && file.type && file.type.startsWith('image/')

const formatFileSize = (bytes) => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1048576).toFixed(1) + ' MB'
}

const EMAIL_REGEX = /^\S+@\S+\.\S+$/
const PHONE_REGEX = /^\d{10}$/

const validateForm = (form) => {
  const errors = {}
  const currentYear = getCurrentYear()

  if (!form.name.trim()) errors.name = 'Blood bank name is required'
  if (!form.licenseNumber.trim()) errors.licenseNumber = 'Registration / license number is required'
  if (!form.type) errors.type = 'Please select a blood bank type'
  if (!form.yearEstablished.trim()) errors.yearEstablished = 'Year established is required'
  else if (!/^\d{4}$/.test(form.yearEstablished.trim())) errors.yearEstablished = 'Enter a valid 4-digit year'
  else if (Number(form.yearEstablished) < 1900 || Number(form.yearEstablished) > currentYear) {
    errors.yearEstablished = `Enter a year between 1900 and ${currentYear}`
  }

  if (!form.email.trim()) errors.email = 'Official email is required'
  else if (!EMAIL_REGEX.test(form.email.trim())) errors.email = 'Enter a valid email address'

  if (!form.primaryPhone.trim()) errors.primaryPhone = 'Primary contact number is required'
  else if (!PHONE_REGEX.test(form.primaryPhone.trim())) errors.primaryPhone = 'Contact number must be 10 digits'

  if (form.alternatePhone.trim() && !PHONE_REGEX.test(form.alternatePhone.trim())) {
    errors.alternatePhone = 'Contact number must be 10 digits'
  }

  if (!form.address.trim()) errors.address = 'Address is required'
  if (!form.city.trim()) errors.city = 'City is required'
  if (!form.district.trim()) errors.district = 'District is required'
  if (!form.state.trim()) errors.state = 'State is required'
  if (!form.pincode.trim()) errors.pincode = 'Pincode is required'
  else if (!/^\d{6}$/.test(form.pincode.trim())) errors.pincode = 'Pincode must be 6 digits'

  if (!form.authorizedName.trim()) errors.authorizedName = 'Full name is required'
  if (!form.authorizedDesignation.trim()) errors.authorizedDesignation = 'Designation is required'
  if (!form.authorizedPhone.trim()) errors.authorizedPhone = 'Contact number is required'
  else if (!PHONE_REGEX.test(form.authorizedPhone.trim())) errors.authorizedPhone = 'Contact number must be 10 digits'
  if (!form.authorizedEmail.trim()) errors.authorizedEmail = 'Official email is required'
  else if (!EMAIL_REGEX.test(form.authorizedEmail.trim())) errors.authorizedEmail = 'Enter a valid email address'

  if (!form.licenseDoc) errors.licenseDoc = 'License / registration certificate is required'
  if (!form.authorizationDoc) errors.authorizationDoc = 'Government authorization document is required'

  if (!form.password) errors.password = 'Password is required'
  else if (form.password.length < 6) errors.password = 'Password must be at least 6 characters'
  if (!form.confirmPassword) errors.confirmPassword = 'Please confirm your password'
  else if (form.confirmPassword !== form.password) errors.confirmPassword = 'Passwords do not match'

  if (!form.terms) errors.terms = 'You must confirm that you are authorized to register this blood bank'

  return errors
}

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

const SectionTitle = ({ icon, title, subtitle }) => (
  <div className="bloodbank-section-title">
    <div className="bloodbank-section-title__icon">{icon}</div>
    <div className="bloodbank-section-title__text">
      <h3>{title}</h3>
      {subtitle && <p>{subtitle}</p>}
    </div>
  </div>
)

const FileUploadField = ({ id, label, file, error, previewUrl, onFileChange, onRemove }) => (
  <div className="bloodbank-form__field bloodbank-form__field--full">
    <label htmlFor={id}>{label} *</label>
    <div className={`bloodbank-form__input-wrapper bloodbank-form__input-wrapper--file${error ? ' bloodbank-form__input-wrapper--error' : ''}`}>
      <FaUpload className="bloodbank-form__input-icon" />
      <input type="file" id={id} name={id} accept=".pdf,.jpg,.jpeg,.png" onChange={onFileChange} />
      <span className="bloodbank-form__file-label">
        {file ? file.name : 'Choose file (PDF, JPG, PNG)'}
      </span>
    </div>
    {file && (
      <div className="bloodbank-form__preview">
        <div className="bloodbank-form__preview-thumb">
          {isImage(file) && previewUrl ? (
            <img src={previewUrl} alt="Preview" className="bloodbank-form__preview-image" />
          ) : (
            <FaFilePdf className="bloodbank-form__preview-pdf-icon" />
          )}
        </div>
        <div className="bloodbank-form__preview-details">
          <span className="bloodbank-form__preview-name">{file.name}</span>
          <span className="bloodbank-form__preview-size">{formatFileSize(file.size)}</span>
        </div>
        <div className="bloodbank-form__preview-actions">
          <span
            className="bloodbank-form__preview-btn bloodbank-form__preview-btn--view"
            onClick={() => {
              const url = URL.createObjectURL(file)
              window.open(url, '_blank')
            }}
          >
            <FaEye /> View
          </span>
          <button type="button" className="bloodbank-form__preview-btn bloodbank-form__preview-btn--remove" onClick={onRemove}>
            <FaTimes /> Remove
          </button>
        </div>
      </div>
    )}
    {error && <span className="bloodbank-form__field-error">{error}</span>}
  </div>
)

const Field = ({ label, children, error, full, htmlFor }) => (
  <div className={`bloodbank-form__field${full ? ' bloodbank-form__field--full' : ''}`}>
    <label htmlFor={htmlFor}>{label}</label>
    {children}
    {error && <span className="bloodbank-form__field-error">{error}</span>}
  </div>
)

const BloodBankRegister = () => {
  const navigate = useNavigate()

  const [form, setForm] = useState(INITIAL_FORM)
  const [fieldErrors, setFieldErrors] = useState({})
  const [previews, setPreviews] = useState({ license: null, authorization: null })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [locationStatus, setLocationStatus] = useState('')
  const [isLocating, setIsLocating] = useState(false)

  useEffect(() => {
    return () => {
      Object.values(previews).forEach((url) => {
        if (url) URL.revokeObjectURL(url)
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // If the signed-in user already has a blood bank profile, send them to the
  // dashboard instead of the form.
  useEffect(() => {
    let active = true
    const checkExistingProfile = async () => {
      try {
        const supabase = getSupabase()
        const { data: { session } } = await supabase.auth.getSession()
        if (!active) return
        const user = session?.user || null

        if (user?.id) {
          try {
            const result = await fetchBloodBankProfile()
            if (active && result.bloodBank) {
              navigate('/blood-bank/dashboard', { replace: true })
              return
            }
          } catch (err) {
            // 404 = no blood bank profile yet (normal for a new registration)
            if (err.status !== 404) throw err
          }
        }
      } catch (err) {
        console.error('[blood-bank:register] profile check failed', err)
      }
    }
    checkExistingProfile()
    return () => {
      active = false
    }
  }, [navigate])

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target
    let nextValue = type === 'checkbox' ? checked : type === 'file' ? files[0] : value

    if (type === 'file') {
      const previewKey = name === 'licenseDoc' ? 'license' : 'authorization'
      if (previews[previewKey]) URL.revokeObjectURL(previews[previewKey])
      setPreviews((prev) => ({
        ...prev,
        [previewKey]: files[0] && isImage(files[0]) ? URL.createObjectURL(files[0]) : null,
      }))
    }

    if (name === 'primaryPhone' || name === 'alternatePhone' || name === 'authorizedPhone') {
      nextValue = nextValue.replace(/\D/g, '')
    }

    setFieldErrors((prev) => ({ ...prev, [name]: '' }))
    setForm((prev) => ({ ...prev, [name]: nextValue }))
  }

  const removeFile = (name, previewKey) => {
    if (previews[previewKey]) URL.revokeObjectURL(previews[previewKey])
    setPreviews((prev) => ({ ...prev, [previewKey]: null }))
    setForm((prev) => ({ ...prev, [name]: null }))
    setFieldErrors((prev) => ({ ...prev, [name]: '' }))
    const el = document.getElementById(name)
    if (el) el.value = ''
  }

  const detectLocation = async () => {
    if (isLocating) return
    setIsLocating(true)
    setLocationStatus('')
    setFieldErrors((prev) => ({ ...prev, latitude: '', longitude: '' }))
    try {
      const coords = await getCurrentPosition()
      setForm((prev) => ({
        ...prev,
        latitude: coords.latitude.toFixed(6),
        longitude: coords.longitude.toFixed(6),
      }))
      setLocationStatus('Location saved — nearby donors can now find your blood bank.')
    } catch (err) {
      setFieldErrors((prev) => ({
        ...prev,
        latitude: err.message,
        longitude: err.message,
      }))
    } finally {
      setIsLocating(false)
    }
  }

  const passwordStrength = getPasswordStrength(form.password)

  const canSubmit = Object.keys(validateForm(form)).length === 0

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitError('')

    const errors = validateForm(form)
    setFieldErrors(errors)

    if (Object.keys(errors).length > 0) {
      const firstErrEl = document.querySelector('.bloodbank-form__field-error')
      if (firstErrEl) firstErrEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }

    setIsSubmitting(true)
    try {
      await registerBloodBank({
        email: form.email,
        password: form.password,
        licenseDoc: form.licenseDoc,
        authorizationDoc: form.authorizationDoc,
        profile: {
          name: form.name,
          licenseNumber: form.licenseNumber,
          type: form.type,
          yearEstablished: form.yearEstablished,
          email: form.email,
          primaryPhone: form.primaryPhone,
          alternatePhone: form.alternatePhone,
          address: form.address,
          city: form.city,
          district: form.district,
          state: form.state,
          pincode: form.pincode,
          latitude: form.latitude || null,
          longitude: form.longitude || null,
          authorizedName: form.authorizedName,
          authorizedDesignation: form.authorizedDesignation,
          authorizedPhone: form.authorizedPhone,
          authorizedEmail: form.authorizedEmail,
        },
      })

      navigate('/blood-bank/dashboard', { replace: true })
    } catch (err) {
      setSubmitError(err.message || 'Registration failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderForm = () => (
    <section className="bloodbank-form-section">
      <div className="bloodbank-page-header">
        <span className="bloodbank-eyebrow">Institution Registration</span>
        <h1>Register Your Blood Bank</h1>
        <p>
          Register your blood bank or institution with HemoConnect360 and access your dashboard immediately.
        </p>
      </div>

      <div className="bloodbank-form">
        <form onSubmit={handleSubmit} noValidate>
          <div className="bloodbank-form__group">
            <SectionTitle icon={<FaHospital />} title="Blood Bank Information" subtitle="Basic details about your blood bank" />
            <div className="bloodbank-form__grid">
              <Field label="Blood Bank Name *" htmlFor="name" error={fieldErrors.name}>
                <div className={`bloodbank-form__input-wrapper${fieldErrors.name ? ' bloodbank-form__input-wrapper--error' : ''}`}>
                  <FaHospital className="bloodbank-form__input-icon" />
                  <input type="text" id="name" name="name" placeholder="Enter blood bank name" value={form.name} onChange={handleChange} />
                </div>
              </Field>
              <Field label="Registration / License Number *" htmlFor="licenseNumber" error={fieldErrors.licenseNumber}>
                <div className={`bloodbank-form__input-wrapper${fieldErrors.licenseNumber ? ' bloodbank-form__input-wrapper--error' : ''}`}>
                  <FaClipboardCheck className="bloodbank-form__input-icon" />
                  <input type="text" id="licenseNumber" name="licenseNumber" placeholder="e.g. BLK/2024/012345" value={form.licenseNumber} onChange={handleChange} />
                </div>
              </Field>
              <Field label="Blood Bank Type *" htmlFor="type" error={fieldErrors.type}>
                <div className={`bloodbank-form__input-wrapper${fieldErrors.type ? ' bloodbank-form__input-wrapper--error' : ''}`}>
                  <select id="type" name="type" value={form.type} onChange={handleChange}>
                    <option value="">Select blood bank type</option>
                    {BLOOD_BANK_TYPES.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </Field>
              <Field label="Year Established *" htmlFor="yearEstablished" error={fieldErrors.yearEstablished}>
                <div className={`bloodbank-form__input-wrapper${fieldErrors.yearEstablished ? ' bloodbank-form__input-wrapper--error' : ''}`}>
                  <FaClipboardCheck className="bloodbank-form__input-icon" />
                  <input type="number" id="yearEstablished" name="yearEstablished" placeholder="e.g. 2010" max={getCurrentYear()} value={form.yearEstablished} onChange={handleChange} />
                </div>
              </Field>
            </div>
          </div>

          <div className="bloodbank-form__group">
            <SectionTitle icon={<FaPhoneAlt />} title="Contact Information" subtitle="How patients and donors can reach you" />
            <div className="bloodbank-form__grid">
              <Field label="Official Email Address *" htmlFor="email" error={fieldErrors.email}>
                <div className={`bloodbank-form__input-wrapper${fieldErrors.email ? ' bloodbank-form__input-wrapper--error' : ''}`}>
                  <FaEnvelope className="bloodbank-form__input-icon" />
                  <input type="email" id="email" name="email" placeholder="Enter official email" value={form.email} onChange={handleChange} />
                </div>
              </Field>
              <Field label="Primary Contact Number *" htmlFor="primaryPhone" error={fieldErrors.primaryPhone}>
                <div className={`bloodbank-form__input-wrapper${fieldErrors.primaryPhone ? ' bloodbank-form__input-wrapper--error' : ''}`}>
                  <FaPhoneAlt className="bloodbank-form__input-icon" />
                  <input type="tel" id="primaryPhone" name="primaryPhone" placeholder="10-digit phone number" maxLength={10} value={form.primaryPhone} onChange={handleChange} />
                </div>
              </Field>
              <Field label="Alternate Contact Number (optional)" htmlFor="alternatePhone" error={fieldErrors.alternatePhone}>
                <div className={`bloodbank-form__input-wrapper${fieldErrors.alternatePhone ? ' bloodbank-form__input-wrapper--error' : ''}`}>
                  <FaPhoneAlt className="bloodbank-form__input-icon" />
                  <input type="tel" id="alternatePhone" name="alternatePhone" placeholder="10-digit phone number" maxLength={10} value={form.alternatePhone} onChange={handleChange} />
                </div>
              </Field>
            </div>
          </div>

          <div className="bloodbank-form__group">
            <SectionTitle icon={<FaMapMarkerAlt />} title="Blood Bank Address" subtitle="Location of your blood bank" />
            <div className="bloodbank-form__grid">
              <Field label="Address Line *" htmlFor="address" error={fieldErrors.address} full>
                <div className={`bloodbank-form__input-wrapper${fieldErrors.address ? ' bloodbank-form__input-wrapper--error' : ''}`}>
                  <FaMapMarkerAlt className="bloodbank-form__input-icon" />
                  <input type="text" id="address" name="address" placeholder="Street address, building, area" value={form.address} onChange={handleChange} />
                </div>
              </Field>
              <Field label="City *" htmlFor="city" error={fieldErrors.city}>
                <div className={`bloodbank-form__input-wrapper${fieldErrors.city ? ' bloodbank-form__input-wrapper--error' : ''}`}>
                  <FaCity className="bloodbank-form__input-icon" />
                  <input type="text" id="city" name="city" placeholder="Enter city" value={form.city} onChange={handleChange} />
                </div>
              </Field>
              <Field label="District *" htmlFor="district" error={fieldErrors.district}>
                <div className={`bloodbank-form__input-wrapper${fieldErrors.district ? ' bloodbank-form__input-wrapper--error' : ''}`}>
                  <FaMapMarkerAlt className="bloodbank-form__input-icon" />
                  <input type="text" id="district" name="district" placeholder="Enter district" value={form.district} onChange={handleChange} />
                </div>
              </Field>
              <Field label="State *" htmlFor="state" error={fieldErrors.state}>
                <div className={`bloodbank-form__input-wrapper${fieldErrors.state ? ' bloodbank-form__input-wrapper--error' : ''}`}>
                  <FaMapMarkerAlt className="bloodbank-form__input-icon" />
                  <input type="text" id="state" name="state" placeholder="Enter state" value={form.state} onChange={handleChange} />
                </div>
              </Field>
              <Field label="Pincode *" htmlFor="pincode" error={fieldErrors.pincode}>
                <div className={`bloodbank-form__input-wrapper${fieldErrors.pincode ? ' bloodbank-form__input-wrapper--error' : ''}`}>
                  <FaMapMarkerAlt className="bloodbank-form__input-icon" />
                  <input type="text" id="pincode" name="pincode" placeholder="6-digit pincode" maxLength={6} value={form.pincode} onChange={handleChange} />
                </div>
              </Field>
              <div className="bloodbank-form__field bloodbank-form__field--full">
                <label>Your Location</label>
                <div className={`bloodbank-form__input-wrapper${fieldErrors.latitude || fieldErrors.longitude ? ' bloodbank-form__input-wrapper--error' : ''}`}>
                  <button
                    type="button"
                    className="bloodbank-form__locate-btn"
                    onClick={detectLocation}
                    disabled={isLocating}
                  >
                    <FaCrosshairs className={isLocating ? 'bloodbank-form__locate-icon--spin' : ''} />
                    {isLocating ? 'Detecting…' : 'Use Current Location'}
                  </button>
                </div>
                {locationStatus && <span className="bloodbank-form__locate-status">{locationStatus}</span>}
                {(fieldErrors.latitude || fieldErrors.longitude) && (
                  <span className="bloodbank-form__field-error">{fieldErrors.latitude || fieldErrors.longitude}</span>
                )}
                {form.latitude && form.longitude && (
                  <span className="bloodbank-form__locate-coords">
                    {form.latitude}, {form.longitude}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="bloodbank-form__group">
            <SectionTitle icon={<FaUserTie />} title="Authorized Person" subtitle="The person representing your blood bank" />
            <div className="bloodbank-form__grid">
              <Field label="Full Name *" htmlFor="authorizedName" error={fieldErrors.authorizedName}>
                <div className={`bloodbank-form__input-wrapper${fieldErrors.authorizedName ? ' bloodbank-form__input-wrapper--error' : ''}`}>
                  <FaUserTie className="bloodbank-form__input-icon" />
                  <input type="text" id="authorizedName" name="authorizedName" placeholder="Enter full name" value={form.authorizedName} onChange={handleChange} />
                </div>
              </Field>
              <Field label="Designation *" htmlFor="authorizedDesignation" error={fieldErrors.authorizedDesignation}>
                <div className={`bloodbank-form__input-wrapper${fieldErrors.authorizedDesignation ? ' bloodbank-form__input-wrapper--error' : ''}`}>
                  <FaUserTie className="bloodbank-form__input-icon" />
                  <input type="text" id="authorizedDesignation" name="authorizedDesignation" placeholder="e.g. Director, Medical Officer" value={form.authorizedDesignation} onChange={handleChange} />
                </div>
              </Field>
              <Field label="Contact Number *" htmlFor="authorizedPhone" error={fieldErrors.authorizedPhone}>
                <div className={`bloodbank-form__input-wrapper${fieldErrors.authorizedPhone ? ' bloodbank-form__input-wrapper--error' : ''}`}>
                  <FaPhoneAlt className="bloodbank-form__input-icon" />
                  <input type="tel" id="authorizedPhone" name="authorizedPhone" placeholder="10-digit phone number" maxLength={10} value={form.authorizedPhone} onChange={handleChange} />
                </div>
              </Field>
              <Field label="Official Email *" htmlFor="authorizedEmail" error={fieldErrors.authorizedEmail}>
                <div className={`bloodbank-form__input-wrapper${fieldErrors.authorizedEmail ? ' bloodbank-form__input-wrapper--error' : ''}`}>
                  <FaEnvelope className="bloodbank-form__input-icon" />
                  <input type="email" id="authorizedEmail" name="authorizedEmail" placeholder="Enter official email" value={form.authorizedEmail} onChange={handleChange} />
                </div>
              </Field>
            </div>
          </div>

          <div className="bloodbank-form__group">
            <SectionTitle icon={<FaShieldAlt />} title="Supporting Documents" subtitle="Upload your blood bank license and government authorization documents" />
            <div className="bloodbank-form__grid">
              <FileUploadField
                id="licenseDoc"
                label="Blood Bank License / Registration Certificate"
                file={form.licenseDoc}
                error={fieldErrors.licenseDoc}
                previewUrl={previews.license}
                onFileChange={handleChange}
                onRemove={() => removeFile('licenseDoc', 'license')}
              />
              <FileUploadField
                id="authorizationDoc"
                label="Government Authorization Document"
                file={form.authorizationDoc}
                error={fieldErrors.authorizationDoc}
                previewUrl={previews.authorization}
                onFileChange={handleChange}
                onRemove={() => removeFile('authorizationDoc', 'authorization')}
              />
            </div>
          </div>

          <div className="bloodbank-form__group">
            <SectionTitle icon={<FaLock />} title="Account Security" subtitle="Set a password to access your blood bank portal" />
            <div className="bloodbank-form__grid">
              <Field label="Password *" htmlFor="password" error={fieldErrors.password}>
                <div className={`bloodbank-form__input-wrapper${fieldErrors.password ? ' bloodbank-form__input-wrapper--error' : ''}`}>
                  <FaLock className="bloodbank-form__input-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    className="bloodbank-form__input--password"
                    placeholder="Create a password (min 6 characters)"
                    value={form.password}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    className="bloodbank-form__input-eye"
                    aria-label="Toggle password visibility"
                    onClick={() => setShowPassword((prev) => !prev)}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                {form.password && passwordStrength && (
                  <span className={`bloodbank-form__strength bloodbank-form__strength--${passwordStrength.level}`}>
                    Password strength: {passwordStrength.label}
                  </span>
                )}
              </Field>
              <Field label="Confirm Password *" htmlFor="confirmPassword" error={fieldErrors.confirmPassword}>
                <div className={`bloodbank-form__input-wrapper${fieldErrors.confirmPassword ? ' bloodbank-form__input-wrapper--error' : ''}`}>
                  <FaLock className="bloodbank-form__input-icon" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    name="confirmPassword"
                    className="bloodbank-form__input--password"
                    placeholder="Re-enter your password"
                    value={form.confirmPassword}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    className="bloodbank-form__input-eye"
                    aria-label="Toggle confirm password visibility"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                  >
                    {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </Field>
            </div>
          </div>

          <div className="bloodbank-form__group">
            <div className="bloodbank-form__field bloodbank-form__field--full">
              <label className="bloodbank-form__checkbox">
                <input
                  type="checkbox"
                  name="terms"
                  checked={form.terms}
                  onChange={handleChange}
                />
                <span className="bloodbank-form__checkbox-mark" />
                <span className="bloodbank-form__checkbox-text">
                  I confirm that the information provided is accurate and that I am authorized to register this blood bank.
                </span>
              </label>
              {fieldErrors.terms && <span className="bloodbank-form__field-error">{fieldErrors.terms}</span>}
            </div>
          </div>

          {submitError && <p className="bloodbank-form__submit-error">{submitError}</p>}

          <button
            type="submit"
            className="bloodbank-form__submit"
            disabled={!canSubmit || isSubmitting}
          >
            {isSubmitting ? 'Registering…' : 'Register Blood Bank'}
          </button>
        </form>
      </div>
    </section>
  )

  return (
    <div className="bloodbank-page">
      <Navbar />
      <button
        type="button"
        className="bloodbank-back-btn"
        onClick={() => navigate('/')}
      >
        <FaArrowLeft /> Back
      </button>
      <main className="bloodbank-main">
        {renderForm()}
      </main>
      <Footer />
    </div>
  )
}

export default BloodBankRegister
