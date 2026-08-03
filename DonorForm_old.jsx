import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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
  FaTimes,
  FaImage,
} from 'react-icons/fa'

const INITIAL_FORM = {
  fullName: '',
  dob: '',
  gender: '',
  bloodGroup: '',
  phone: '',
  email: '',
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

const formatDateDisplay = (iso) => {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  return `${d}-${m}-${y}`
}

const DonorForm = () => {
  const [formData, setFormData] = useState(INITIAL_FORM)
  const [dateErrors, setDateErrors] = useState({ dob: '', lastDonation: '' })
  const [previewUrl, setPreviewUrl] = useState(null)
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
  const isPdf = (file) => file && file.type === 'application/pdf'

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

  const handleSubmit = (e) => {
    e.preventDefault()

    const requiredFields = [
      'fullName', 'dob', 'gender', 'bloodGroup',
      'phone', 'email', 'address', 'city', 'state',
      'pincode', 'weight', 'hemoglobin',
    ]

    for (const field of requiredFields) {
      if (!formData[field]) return
    }

    if (!formData.terms) return

    const dobErr = validateDob(formData.dob)
    const lastDonErr = validateLastDonation(formData.lastDonation, formData.dob)
    if (dobErr || lastDonErr) {
      setDateErrors({ dob: dobErr, lastDonation: lastDonErr })
      return
    }

    navigate('/donor/dashboard')
  }

  return (
    <section className="donor-form">
      <h2 className="donor-form__title">Donor Registration Form</h2>
      <form className="donor-form__form" onSubmit={handleSubmit}>
        <div className="donor-form__grid">
          <div className="donor-form__field">
            <label htmlFor="fullName">Full Name</label>
            <div className="donor-form__input-wrapper">
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
          </div>

          <div className="donor-form__field">
            <label htmlFor="dob">Date of Birth</label>
            <div className="donor-form__input-wrapper donor-form__input-wrapper--date">
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
          </div>

          <div className="donor-form__field">
            <label htmlFor="gender">Gender</label>
            <div className="donor-form__input-wrapper">
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
          </div>

          <div className="donor-form__field">
            <label htmlFor="bloodGroup">Blood Group</label>
            <div className="donor-form__input-wrapper">
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
          </div>

          <div className="donor-form__field">
            <label htmlFor="phone">Phone Number</label>
            <div className="donor-form__input-wrapper">
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
          </div>

          <div className="donor-form__field">
            <label htmlFor="email">Email</label>
            <div className="donor-form__input-wrapper">
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
          </div>

          <div className="donor-form__field donor-form__field--full">
            <label htmlFor="address">Address</label>
            <div className="donor-form__input-wrapper">
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
          </div>

          <div className="donor-form__field">
            <label htmlFor="city">City</label>
            <div className="donor-form__input-wrapper">
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
          </div>

          <div className="donor-form__field">
            <label htmlFor="state">State</label>
            <div className="donor-form__input-wrapper">
              <input
                type="text"
                id="state"
                name="state"
                placeholder="Enter state"
                value={formData.state}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="donor-form__field">
            <label htmlFor="pincode">Pincode</label>
            <div className="donor-form__input-wrapper">
              <input
                type="text"
                id="pincode"
                name="pincode"
                placeholder="Enter pincode"
                value={formData.pincode}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="donor-form__field">
            <label htmlFor="weight">Weight (kg)</label>
            <div className="donor-form__input-wrapper">
              <FaWeight className="donor-form__input-icon" />
              <input
                type="number"
                id="weight"
                name="weight"
                placeholder="Enter weight"
                value={formData.weight}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="donor-form__field">
            <label htmlFor="hemoglobin">Hemoglobin (g/dL)</label>
            <div className="donor-form__input-wrapper">
              <FaHeartbeat className="donor-form__input-icon" />
              <input
                type="number"
                id="hemoglobin"
                name="hemoglobin"
                placeholder="Enter hemoglobin level"
                step="0.1"
                value={formData.hemoglobin}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="donor-form__field">
            <label htmlFor="lastDonation">Last Donation Date</label>
            <div className="donor-form__input-wrapper donor-form__input-wrapper--date">
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
          </div>
        </div>

        <button type="submit" className="donor-form__submit">
          Register as Donor
        </button>
      </form>
    </section>
  )
}

export default DonorForm
