import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { registerDonor } from '../../services/donorService'

import {
  FaUser,
  FaCalendarAlt,
  FaTint,
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaCity,
  FaWeight,
  FaHeartbeat,
  FaClock,
  FaUpload,
  FaFilePdf,
  FaEye,
  FaEyeSlash,
  FaLock,
  FaTimes,
} from 'react-icons/fa'

const INITIAL_FORM = {
  fullName: '',
  dob: '',
  gender: '',
  bloodGroup: '',
  phone: '',
  email: '',
  password: '',
  confirmPassword: '',
  address: '',
  city: '',
  state: '',
  pincode: '',
  weight: '',
  hemoglobin: '',
  lastDonation: '',
  idProof: null,
  terms: false,
}

const getToday = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const DonorForm = () => {
  const [formData, setFormData] = useState(INITIAL_FORM)
  const [dateErrors, setDateErrors] = useState({ dob: '', lastDonation: '' })
  const [fieldErrors, setFieldErrors] = useState({})
  const [previewUrl, setPreviewUrl] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const dobRef = useRef(null)
  const lastDonationRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl) }
  }, [previewUrl])

  const openPicker = (ref) => {
    if (ref.current) {
      ref.current.showPicker?.()
      ref.current.focus()
    }
  }

  const removeFile = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
    setFormData((prev) => ({ ...prev, idProof: null }))
    const fileInput = document.getElementById('idProof')
    if (fileInput) fileInput.value = ''
  }

  const isImage = (file) => file && file.type.startsWith('image/')

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / 1048576).toFixed(1) + ' MB'
  }

  const validateDob = (value) => {
    if (!value) return ''
    const today = new Date()
    const birth = new Date(value)
    if (birth > today) return 'Date of birth cannot be in the future'
    let age = today.getFullYear() - birth.getFullYear()
    const m = today.getMonth() - birth.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
    if (age < 18) return 'Donor must be at least 18 years old'
    if (age > 65) return 'Donor must be 65 years or younger'
    return ''
  }

  const validateLastDonation = (value, dob) => {
    if (!value) return ''
    const today = new Date()
    const donation = new Date(value)
    if (donation > today) return 'Last donation date cannot be in the future'
    if (dob && donation < new Date(dob)) return 'Cannot be earlier than date of birth'
    return ''
  }

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target
    const newValue = type === 'checkbox' ? checked : type === 'file' ? files[0] : value

    if (type === 'file') {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      if (files[0] && files[0].type.startsWith('image/')) {
        setPreviewUrl(URL.createObjectURL(files[0]))
      } else {
        setPreviewUrl(null)
      }
    }

    setFieldErrors((prev) => ({ ...prev, [name]: '' }))

    setFormData((prev) => {
      const updated = { ...prev, [name]: newValue }
      if (name === 'dob') {
        setDateErrors((prev) => ({ ...prev, dob: validateDob(value) }))
      }
      if (name === 'lastDonation') {
        setDateErrors((prev) => ({ ...prev, lastDonation: validateLastDonation(value, updated.dob) }))
      }
      if (name === 'dob' && prev.lastDonation) {
        setDateErrors((prev) => ({ ...prev, lastDonation: validateLastDonation(prev.lastDonation, value) }))
      }
      return updated
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitError('')

    const errors = {}
    if (!formData.fullName.trim())   errors.fullName   = 'Full name is required'
    if (!formData.dob)               errors.dob        = 'Date of birth is required'
    if (!formData.gender)            errors.gender     = 'Please select a gender'
    if (!formData.bloodGroup)        errors.bloodGroup = 'Please select a blood group'
    if (!formData.phone.trim())      errors.phone      = 'Phone number is required'
    else if (!/^\d{10}$/.test(formData.phone.trim())) errors.phone = 'Phone number must be 10 digits'
    if (!formData.email.trim())      errors.email      = 'Email is required'
    else if (!/^\S+@\S+\.\S+$/.test(formData.email.trim())) errors.email = 'Enter a valid email address'
    if (!formData.password)          errors.password   = 'Password is required'
    else if (formData.password.length < 6) errors.password = 'Password must be at least 6 characters'
    if (!formData.confirmPassword)   errors.confirmPassword = 'Please confirm your password'
    else if (formData.confirmPassword !== formData.password) errors.confirmPassword = 'Passwords do not match'
    if (!formData.address.trim())    errors.address    = 'Address is required'
    if (!formData.city.trim())       errors.city       = 'City is required'
    if (!formData.state.trim())      errors.state      = 'State is required'
    if (!formData.pincode.trim())    errors.pincode    = 'Pincode is required'
    if (!formData.weight)            errors.weight     = 'Weight is required'
    else if (Number(formData.weight) < 45) errors.weight = 'Minimum weight is 45 kg'
    if (!formData.hemoglobin)        errors.hemoglobin = 'Hemoglobin is required'
    else if (Number(formData.hemoglobin) < 12.5) errors.hemoglobin = 'Hemoglobin must be ≥ 12.5 g/dL'

    const dobErr = validateDob(formData.dob)
    const lastDonErr = validateLastDonation(formData.lastDonation, formData.dob)
    if (dobErr) errors.dob = dobErr
    if (lastDonErr) errors.lastDonation = lastDonErr

    if (!formData.terms) errors.terms = 'You must accept the Terms & Conditions'

    setFieldErrors(errors)
    setDateErrors({ dob: errors.dob || '', lastDonation: errors.lastDonation || '' })

    if (Object.keys(errors).length > 0) {
      const firstErrEl = document.querySelector('.donor-form__field-error')
      if (firstErrEl) firstErrEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }

    setIsSubmitting(true)
    try {
      const donor = await registerDonor({
        email: formData.email,
        password: formData.password,
        idProof: formData.idProof,
        profile: {
          fullName:     formData.fullName,
          dob:          formData.dob,
          gender:       formData.gender,
          bloodGroup:   formData.bloodGroup,
          phone:        formData.phone,
          email:        formData.email,
          address:      formData.address,
          city:         formData.city,
          state:        formData.state,
          pincode:      formData.pincode,
          weight:       formData.weight,
          hemoglobin:   formData.hemoglobin,
          lastDonation: formData.lastDonation || null,
        },
      })
      // created_at is set only when the donor row was inserted immediately
      // (email confirmation disabled) -> no verification email to wait for.
      if (donor.created_at) {
        navigate('/donor/thank-you', { replace: true })
        return
      }

      navigate('/verify-email', {
        replace: true,
        state: {
          email: donor.email || formData.email,
          donor: {
            id: donor.id,
            full_name: donor.full_name,
            blood_group: donor.blood_group,
            phone: donor.phone,
            city: donor.city,
            state: donor.state,
            created_at: donor.created_at,
          },
        },
      })
    } catch (err) {
      setSubmitError(err.message || 'Registration failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="donor-form">
      <h2 className="donor-form__title">Donor Registration Form</h2>
      <form className="donor-form__form" onSubmit={handleSubmit}>
        <div className="donor-form__grid">
          <div className="donor-form__field">
            <label htmlFor="fullName">Full Name</label>
            <div className={`donor-form__input-wrapper${fieldErrors.fullName ? ' donor-form__input-wrapper--error' : ''}`}>
              <FaUser className="donor-form__input-icon" />
              <input
                type="text"
                id="fullName"
                name="fullName"
                placeholder="Enter your full name"
                value={formData.fullName}
                onChange={handleChange}
              />
            </div>
            {fieldErrors.fullName && <span className="donor-form__field-error">{fieldErrors.fullName}</span>}
          </div>

          <div className="donor-form__field">
            <label htmlFor="dob">Date of Birth</label>
            <div className={`donor-form__input-wrapper donor-form__input-wrapper--date${fieldErrors.dob ? ' donor-form__input-wrapper--error' : ''}`}>
              <FaCalendarAlt className="donor-form__input-icon" />
              <input
                ref={dobRef}
                type="date"
                id="dob"
                name="dob"
                value={formData.dob}
                onChange={handleChange}
                max={getToday()}
              />
              <FaCalendarAlt
                className="donor-form__date-picker-icon"
                onClick={() => openPicker(dobRef)}
              />
            </div>
            {dateErrors.dob && <span className="donor-form__date-error">{dateErrors.dob}</span>}
            {!dateErrors.dob && fieldErrors.dob && <span className="donor-form__field-error">{fieldErrors.dob}</span>}
          </div>

          <div className="donor-form__field">
            <label htmlFor="gender">Gender</label>
            <div className={`donor-form__input-wrapper${fieldErrors.gender ? ' donor-form__input-wrapper--error' : ''}`}>
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            {fieldErrors.gender && <span className="donor-form__field-error">{fieldErrors.gender}</span>}
          </div>

          <div className="donor-form__field">
            <label htmlFor="bloodGroup">Blood Group</label>
            <div className={`donor-form__input-wrapper${fieldErrors.bloodGroup ? ' donor-form__input-wrapper--error' : ''}`}>
              <FaTint className="donor-form__input-icon" />
              <select
                id="bloodGroup"
                name="bloodGroup"
                value={formData.bloodGroup}
                onChange={handleChange}
              >
                <option value="">Select blood group</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>
            {fieldErrors.bloodGroup && <span className="donor-form__field-error">{fieldErrors.bloodGroup}</span>}
          </div>

          <div className="donor-form__field">
            <label htmlFor="phone">Phone Number</label>
            <div className={`donor-form__input-wrapper${fieldErrors.phone ? ' donor-form__input-wrapper--error' : ''}`}>
              <FaPhone className="donor-form__input-icon" />
              <input
                type="tel"
                id="phone"
                name="phone"
                placeholder="Enter phone number"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>
            {fieldErrors.phone && <span className="donor-form__field-error">{fieldErrors.phone}</span>}
          </div>

          <div className="donor-form__field">
            <label htmlFor="email">Email</label>
            <div className={`donor-form__input-wrapper${fieldErrors.email ? ' donor-form__input-wrapper--error' : ''}`}>
              <FaEnvelope className="donor-form__input-icon" />
              <input
                type="email"
                id="email"
                name="email"
                placeholder="Enter email address"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            {fieldErrors.email && <span className="donor-form__field-error">{fieldErrors.email}</span>}
          </div>

          <div className="donor-form__field">
            <label htmlFor="password">Password</label>
            <div className={`donor-form__input-wrapper${fieldErrors.password ? ' donor-form__input-wrapper--error' : ''}`}>
              <FaLock className="donor-form__input-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                className="donor-form__input--password"
                placeholder="Create a password (min 6 characters)"
                value={formData.password}
                onChange={handleChange}
              />
              <button
                type="button"
                className="donor-form__input-eye"
                aria-label="Toggle password visibility"
                onClick={() => setShowPassword((prev) => !prev)}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            {fieldErrors.password && <span className="donor-form__field-error">{fieldErrors.password}</span>}
          </div>

          <div className="donor-form__field">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <div className={`donor-form__input-wrapper${fieldErrors.confirmPassword ? ' donor-form__input-wrapper--error' : ''}`}>
              <FaLock className="donor-form__input-icon" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                className="donor-form__input--password"
                placeholder="Re-enter your password"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
              <button
                type="button"
                className="donor-form__input-eye"
                aria-label="Toggle confirm password visibility"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
              >
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            {fieldErrors.confirmPassword && <span className="donor-form__field-error">{fieldErrors.confirmPassword}</span>}
          </div>

          <div className="donor-form__field donor-form__field--full">
            <label htmlFor="address">Address</label>
            <div className={`donor-form__input-wrapper${fieldErrors.address ? ' donor-form__input-wrapper--error' : ''}`}>
              <FaMapMarkerAlt className="donor-form__input-icon" />
              <input
                type="text"
                id="address"
                name="address"
                placeholder="Enter your address"
                value={formData.address}
                onChange={handleChange}
              />
            </div>
            {fieldErrors.address && <span className="donor-form__field-error">{fieldErrors.address}</span>}
          </div>

          <div className="donor-form__field">
            <label htmlFor="city">City</label>
            <div className={`donor-form__input-wrapper${fieldErrors.city ? ' donor-form__input-wrapper--error' : ''}`}>
              <FaCity className="donor-form__input-icon" />
              <input
                type="text"
                id="city"
                name="city"
                placeholder="Enter city"
                value={formData.city}
                onChange={handleChange}
              />
            </div>
            {fieldErrors.city && <span className="donor-form__field-error">{fieldErrors.city}</span>}
          </div>

          <div className="donor-form__field">
            <label htmlFor="state">State</label>
            <div className={`donor-form__input-wrapper${fieldErrors.state ? ' donor-form__input-wrapper--error' : ''}`}>
              <input
                type="text"
                id="state"
                name="state"
                placeholder="Enter state"
                value={formData.state}
                onChange={handleChange}
              />
            </div>
            {fieldErrors.state && <span className="donor-form__field-error">{fieldErrors.state}</span>}
          </div>

          <div className="donor-form__field">
            <label htmlFor="pincode">Pincode</label>
            <div className={`donor-form__input-wrapper${fieldErrors.pincode ? ' donor-form__input-wrapper--error' : ''}`}>
              <input
                type="text"
                id="pincode"
                name="pincode"
                placeholder="Enter pincode"
                value={formData.pincode}
                onChange={handleChange}
              />
            </div>
            {fieldErrors.pincode && <span className="donor-form__field-error">{fieldErrors.pincode}</span>}
          </div>

          <div className="donor-form__field">
            <label htmlFor="weight">Weight (kg)</label>
            <div className={`donor-form__input-wrapper${fieldErrors.weight ? ' donor-form__input-wrapper--error' : ''}`}>
              <FaWeight className="donor-form__input-icon" />
              <input
                type="number"
                id="weight"
                name="weight"
                placeholder="Enter weight (min 45 kg)"
                value={formData.weight}
                onChange={handleChange}
              />
            </div>
            {fieldErrors.weight && <span className="donor-form__field-error">{fieldErrors.weight}</span>}
          </div>

          <div className="donor-form__field">
            <label htmlFor="hemoglobin">Hemoglobin (g/dL)</label>
            <div className={`donor-form__input-wrapper${fieldErrors.hemoglobin ? ' donor-form__input-wrapper--error' : ''}`}>
              <FaHeartbeat className="donor-form__input-icon" />
              <input
                type="number"
                id="hemoglobin"
                name="hemoglobin"
                placeholder="Enter hemoglobin (min 12.5)"
                step="0.1"
                value={formData.hemoglobin}
                onChange={handleChange}
              />
            </div>
            {fieldErrors.hemoglobin && <span className="donor-form__field-error">{fieldErrors.hemoglobin}</span>}
          </div>

          <div className="donor-form__field">
            <label htmlFor="lastDonation">Last Donation Date</label>
            <div className={`donor-form__input-wrapper donor-form__input-wrapper--date${fieldErrors.lastDonation ? ' donor-form__input-wrapper--error' : ''}`}>
              <FaClock className="donor-form__input-icon" />
              <input
                ref={lastDonationRef}
                type="date"
                id="lastDonation"
                name="lastDonation"
                value={formData.lastDonation}
                onChange={handleChange}
                max={getToday()}
                min={formData.dob || undefined}
              />
              <FaCalendarAlt
                className="donor-form__date-picker-icon"
                onClick={() => openPicker(lastDonationRef)}
              />
            </div>
            {dateErrors.lastDonation && <span className="donor-form__date-error">{dateErrors.lastDonation}</span>}
            {!dateErrors.lastDonation && fieldErrors.lastDonation && <span className="donor-form__field-error">{fieldErrors.lastDonation}</span>}
          </div>

          <div className="donor-form__field donor-form__field--full">
            <label htmlFor="idProof">Upload ID Proof</label>
            <div className="donor-form__input-wrapper donor-form__input-wrapper--file">
              <FaUpload className="donor-form__input-icon" />
              <input
                type="file"
                id="idProof"
                name="idProof"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleChange}
              />
              <span className="donor-form__file-label">
                {formData.idProof ? formData.idProof.name : 'Choose file (PDF, JPG, PNG)'}
              </span>
            </div>
            {formData.idProof && (
              <div className="donor-form__preview">
                <div className="donor-form__preview-thumb">
                  {isImage(formData.idProof) && previewUrl ? (
                    <img src={previewUrl} alt="Preview" className="donor-form__preview-image" />
                  ) : (
                    <FaFilePdf className="donor-form__preview-pdf-icon" />
                  )}
                </div>
                <div className="donor-form__preview-details">
                  <span className="donor-form__preview-name">{formData.idProof.name}</span>
                  <span className="donor-form__preview-size">{formatFileSize(formData.idProof.size)}</span>
                </div>
                <div className="donor-form__preview-actions">
                  <span
                    className="donor-form__preview-btn donor-form__preview-btn--view"
                    onClick={() => {
                      const url = URL.createObjectURL(formData.idProof)
                      window.open(url, '_blank')
                    }}
                  >
                    <FaEye /> View
                  </span>
                  <button type="button" className="donor-form__preview-btn donor-form__preview-btn--remove" onClick={removeFile}>
                    <FaTimes /> Remove
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="donor-form__field donor-form__field--full">
            <label className="donor-form__checkbox">
              <input
                type="checkbox"
                name="terms"
                checked={formData.terms}
                onChange={handleChange}
              />
              <span className="donor-form__checkbox-mark"></span>
              <span className="donor-form__checkbox-text">
                I have read and agree to the{' '}
                <Link to="/terms-and-conditions" className="donor-form__terms-link">
                  Terms & Conditions
                </Link>{' '}
                and Privacy Policy.
              </span>
            </label>
            {fieldErrors.terms && <span className="donor-form__field-error">{fieldErrors.terms}</span>}
          </div>
        </div>

        <button
          type="submit"
          className="donor-form__submit"
          disabled={isSubmitting}
          style={{ opacity: isSubmitting ? 0.7 : 1, cursor: isSubmitting ? 'not-allowed' : 'pointer' }}
        >
          {isSubmitting ? 'Registering…' : 'Register as Donor'}
        </button>
        {submitError && (
          <p style={{ color: '#e53e3e', marginTop: '0.75rem', textAlign: 'center', fontSize: '0.9rem' }}>
            {submitError}
          </p>
        )}
      </form>
    </section>
  )
}

export default DonorForm
