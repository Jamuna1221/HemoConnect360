import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FaTint, FaUser, FaHospital, FaExclamationCircle, FaPhoneAlt, FaStickyNote, FaCalendarAlt, FaEnvelope, FaArrowLeft, FaPaperPlane, FaCrosshairs } from 'react-icons/fa'
import RequesterNavbar from '../../components/Requester/RequesterNavbar'
import { useRequester } from '../../context/RequesterContext'
import { getCurrentPosition } from '../../lib/geolocation'
import './RequestBlood.css'

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
const GENDERS = ['Male', 'Female', 'Other']
const PRIORITIES = [
  { value: 'critical', label: 'Critical', icon: <FaExclamationCircle />, desc: 'Life-threatening situation' },
  { value: 'urgent', label: 'Urgent', icon: <FaExclamationCircle />, desc: 'Needs blood within 24 hours' },
  { value: 'standard', label: 'Standard', icon: <FaExclamationCircle />, desc: 'Scheduled procedure' },
]

const INITIAL_FORM = {
  patientName: '', patientAge: '', patientGender: '', bloodGroup: '', unitsNeeded: '',
  hospitalName: '', city: '', address: '', requiredBy: '',
  priority: 'standard',
  contactName: '', contactPhone: '', contactEmail: '',
  latitude: '', longitude: '',
  notes: '',
}

const RequestBlood = () => {
const navigate = useNavigate()
  const { addRequest, user } = useRequester()
  const [form, setForm] = useState(() => ({ ...INITIAL_FORM, contactName: user?.fullName || '', contactPhone: user?.phone || '' }))
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [isLocating, setIsLocating] = useState(false)
  const [locationStatus, setLocationStatus] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  useEffect(() => {
    if (!user) navigate('/requester/login')
  }, [user, navigate])

  const validate = () => {
    const errs = {}
    if (!form.patientName.trim()) errs.patientName = 'Patient name is required'
    if (!form.patientAge || form.patientAge < 1 || form.patientAge > 120) errs.patientAge = 'Valid age is required (1-120)'
    if (!form.patientGender) errs.patientGender = 'Gender is required'
    if (!form.bloodGroup) errs.bloodGroup = 'Blood group is required'
    if (!form.unitsNeeded || form.unitsNeeded < 1) errs.unitsNeeded = 'At least 1 unit is required'
    if (!form.hospitalName.trim()) errs.hospitalName = 'Hospital name is required'
    if (!form.city.trim()) errs.city = 'City is required'
    if (!form.address.trim()) errs.address = 'Address is required'
    if (!form.requiredBy) errs.requiredBy = 'Required date is required'
    if (!form.contactName.trim()) errs.contactName = 'Contact name is required'
    if (!form.contactPhone.trim()) errs.contactPhone = 'Phone number is required'
    if (form.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail)) errs.contactEmail = 'Invalid email format'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const newRequest = await addRequest({
        patientName: form.patientName,
        patientAge: Number(form.patientAge),
        patientGender: form.patientGender,
        bloodGroup: form.bloodGroup,
        units: Number(form.unitsNeeded),
        hospitalName: form.hospitalName,
        city: form.city,
        address: form.address,
        requiredBy: form.requiredBy,
        priority: form.priority,
        contactName: form.contactName,
        contactPhone: form.contactPhone,
        requesterPhone: user.phone,
        contactEmail: form.contactEmail,
        latitude: form.latitude || null,
        longitude: form.longitude || null,
        notes: form.notes,
      })
      setLoading(false)
      navigate('/requester/confirmation', { state: { request: newRequest } })
    } catch {
      setLoading(false)
    }
  }

  const detectLocation = async () => {
    if (isLocating) return
    setIsLocating(true)
    setLocationStatus('')
    setErrors((prev) => ({ ...prev, latitude: '', longitude: '' }))
    try {
      const coords = await getCurrentPosition()
      setForm((prev) => ({
        ...prev,
        latitude: coords.latitude.toFixed(6),
        longitude: coords.longitude.toFixed(6),
      }))
      setLocationStatus('Hospital location captured — nearby eligible donors will be matched immediately.')
    } catch (err) {
      setErrors((prev) => ({ ...prev, latitude: err.message, longitude: err.message }))
    } finally {
      setIsLocating(false)
    }
  }

  if (!user) return null

  return (
    <div className="req-blood-page">
      <RequesterNavbar />
      <main className="req-blood-main">
        <div className="req-blood-container">
          <div className="req-blood-top">
            <button className="req-track-back" onClick={() => navigate(-1)}>
              <FaArrowLeft /> Back
            </button>
            <h1><FaTint /> Request Blood</h1>
          </div>

          <form className="req-blood-form" onSubmit={handleSubmit} noValidate>
            <section className="req-blood-section">
              <h2><FaUser /> Patient Details</h2>
              <div className="req-blood-grid">
                <div className="req-blood-field">
                  <label>Patient Name *</label>
                  <input name="patientName" value={form.patientName} onChange={handleChange} placeholder="Enter patient name" />
                  {errors.patientName && <span className="req-blood-error">{errors.patientName}</span>}
                </div>
                <div className="req-blood-field">
                  <label>Age *</label>
                  <input name="patientAge" type="number" min="1" max="120" value={form.patientAge} onChange={handleChange} placeholder="Age" />
                  {errors.patientAge && <span className="req-blood-error">{errors.patientAge}</span>}
                </div>
                <div className="req-blood-field">
                  <label>Gender *</label>
                  <select name="patientGender" value={form.patientGender} onChange={handleChange}>
                    <option value="">Select Gender</option>
                    {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
                  </select>
                  {errors.patientGender && <span className="req-blood-error">{errors.patientGender}</span>}
                </div>
                <div className="req-blood-field">
                  <label>Blood Group *</label>
                  <select name="bloodGroup" value={form.bloodGroup} onChange={handleChange}>
                    <option value="">Select Blood Group</option>
                    {BLOOD_GROUPS.map((bg) => <option key={bg} value={bg}>{bg}</option>)}
                  </select>
                  {errors.bloodGroup && <span className="req-blood-error">{errors.bloodGroup}</span>}
                </div>
                <div className="req-blood-field">
                  <label>Units Needed *</label>
                  <input name="unitsNeeded" type="number" min="1" value={form.unitsNeeded} onChange={handleChange} placeholder="Number of units" />
                  {errors.unitsNeeded && <span className="req-blood-error">{errors.unitsNeeded}</span>}
                </div>
              </div>
            </section>

            <section className="req-blood-section">
              <h2><FaHospital /> Hospital Details</h2>
              <div className="req-blood-grid">
                <div className="req-blood-field">
                  <label>Hospital Name *</label>
                  <input name="hospitalName" value={form.hospitalName} onChange={handleChange} placeholder="Enter hospital name" />
                  {errors.hospitalName && <span className="req-blood-error">{errors.hospitalName}</span>}
                </div>
                <div className="req-blood-field">
                  <label>City *</label>
                  <input name="city" value={form.city} onChange={handleChange} placeholder="Enter city" />
                  {errors.city && <span className="req-blood-error">{errors.city}</span>}
                </div>
                <div className="req-blood-field req-blood-field--full">
                  <label>Address *</label>
                  <input name="address" value={form.address} onChange={handleChange} placeholder="Full hospital address" />
                  {errors.address && <span className="req-blood-error">{errors.address}</span>}
                </div>
                <div className="req-blood-field">
                  <label><FaCalendarAlt /> Required By *</label>
                  <input name="requiredBy" type="date" value={form.requiredBy} onChange={handleChange} />
                  {errors.requiredBy && <span className="req-blood-error">{errors.requiredBy}</span>}
                </div>
                <div className="req-blood-field req-blood-field--full">
                  <label><FaCrosshairs /> Hospital Location</label>
                  <button
                    type="button"
                    className="req-blood-locate-btn"
                    onClick={detectLocation}
                    disabled={isLocating}
                  >
                    <FaCrosshairs className={isLocating ? 'req-blood-locate-icon--spin' : ''} />
                    {isLocating ? 'Detecting…' : 'Detect Hospital Location'}
                  </button>
                  {locationStatus && <span className="req-blood-locate-status">{locationStatus}</span>}
                  {(errors.latitude || errors.longitude) && (
                    <span className="req-blood-error">{errors.latitude || errors.longitude}</span>
                  )}
                  {form.latitude && form.longitude && (
                    <span className="req-blood-locate-coords">{form.latitude}, {form.longitude}</span>
                  )}
                </div>
              </div>
            </section>

            <section className="req-blood-section">
              <h2><FaExclamationCircle /> Priority Level</h2>
              <div className="req-blood-priority-group">
                {PRIORITIES.map((p) => (
                  <label key={p.value} className={`req-blood-priority-card ${form.priority === p.value ? 'req-blood-priority-card--active' : ''}`}>
                    <input type="radio" name="priority" value={p.value} checked={form.priority === p.value} onChange={handleChange} className="req-blood-priority-radio" />
                    <div className="req-blood-priority-icon">{p.icon}</div>
                    <div className="req-blood-priority-info">
                      <strong>{p.label}</strong>
                      <span>{p.desc}</span>
                    </div>
                  </label>
                ))}
              </div>
            </section>

            <section className="req-blood-section">
              <h2><FaPhoneAlt /> Contact Information</h2>
              <div className="req-blood-grid">
                <div className="req-blood-field">
                  <label>Contact Name *</label>
                  <input name="contactName" value={form.contactName} onChange={handleChange} placeholder="Contact person name" />
                  {errors.contactName && <span className="req-blood-error">{errors.contactName}</span>}
                </div>
                <div className="req-blood-field">
                  <label><FaPhoneAlt /> Phone Number *</label>
                  <input name="contactPhone" value={form.contactPhone} onChange={handleChange} placeholder="Phone number" />
                  {errors.contactPhone && <span className="req-blood-error">{errors.contactPhone}</span>}
                </div>
                <div className="req-blood-field req-blood-field--full">
                  <label><FaEnvelope /> Email (Optional)</label>
                  <input name="contactEmail" type="email" value={form.contactEmail} onChange={handleChange} placeholder="Email address" />
                  {errors.contactEmail && <span className="req-blood-error">{errors.contactEmail}</span>}
                </div>
              </div>
            </section>

            <section className="req-blood-section">
              <h2><FaStickyNote /> Additional Notes</h2>
              <div className="req-blood-field">
                <textarea name="notes" value={form.notes} onChange={handleChange} rows="4" placeholder="Any special instructions or medical notes..." className="req-blood-textarea" />
              </div>
            </section>

            <button type="submit" className="req-blood-submit" disabled={loading}>
              {loading ? (<><div className="req-blood-spinner"></div> Submitting Request...</>) : (<><FaPaperPlane /> Submit Blood Request</>)}
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}

export default RequestBlood
