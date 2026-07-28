import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { FaUser, FaPhone, FaCalendarAlt, FaVenusMars, FaCity, FaMapMarkerAlt, FaArrowLeft, FaTint, FaShieldAlt, FaHospital, FaHandHoldingHeart } from 'react-icons/fa'
import { useRequester } from '../../context/RequesterContext'
import './RequesterRegister.css'

const RequesterRegister = () => {
  const navigate = useNavigate()
  const { loginUser } = useRequester()

  const [form, setForm] = useState({ fullName: '', phone: '', age: '', gender: '', city: '', address: '', bloodNeededFor: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: name === 'phone' ? value.replace(/\D/g, '') : value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const validate = () => {
    const errs = {}
    if (!form.fullName.trim()) errs.fullName = 'Full name is required'
    if (!/^\d{10}$/.test(form.phone.trim())) errs.phone = 'Valid 10-digit phone number is required'
    if (!form.age || form.age < 1) errs.age = 'Valid age is required'
    if (!form.gender) errs.gender = 'Gender is required'
    if (!form.city.trim()) errs.city = 'City is required'
    if (!form.address.trim()) errs.address = 'Address is required'
    if (!form.bloodNeededFor.trim()) errs.bloodNeededFor = 'This field is required'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const user = { ...form, isLoggedIn: true }
      await loginUser(user)
      setLoading(false)
      navigate('/requester/dashboard')
    } catch {
      setLoading(false)
    }
  }

  return (
    <div className="req-register-page">
      <Link to="/" className="req-register-back"><FaArrowLeft /> Back to Home</Link>
      <div className="req-register-container">
        <div className="req-register-left">
          <div className="req-register-brand">
            <div className="req-register-logo"><FaTint /></div>
            <h1>HemoConnect360</h1>
            <p>Requester Portal</p>
          </div>
          <div className="req-register-features">
            <div className="req-register-feature"><FaShieldAlt /><span>Safe &amp; secure blood requests</span></div>
            <div className="req-register-feature"><FaHospital /><span>Connected with 120+ hospitals</span></div>
            <div className="req-register-feature"><FaHandHoldingHeart /><span>24/7 donor network</span></div>
          </div>
        </div>
        <div className="req-register-right">
          <div className="req-register-card">
            <h2>Create Account</h2>
            <p className="req-register-subtitle">Register as a blood requester</p>
            <form onSubmit={handleSubmit}>
              <div className="req-register-grid">
                <div className="req-register-field">
                  <label><FaUser /> Full Name *</label>
                  <input name="fullName" value={form.fullName} onChange={handleChange} placeholder="Enter full name" />
                  {errors.fullName && <span className="req-register-error">{errors.fullName}</span>}
                </div>
                <div className="req-register-field">
                  <label><FaPhone /> Phone Number *</label>
                  <input name="phone" value={form.phone} onChange={handleChange} placeholder="10-digit phone" maxLength={10} />
                  {errors.phone && <span className="req-register-error">{errors.phone}</span>}
                </div>
                <div className="req-register-field">
                  <label><FaCalendarAlt /> Age *</label>
                  <input name="age" type="number" min="1" value={form.age} onChange={handleChange} placeholder="Age" />
                  {errors.age && <span className="req-register-error">{errors.age}</span>}
                </div>
                <div className="req-register-field">
                  <label><FaVenusMars /> Gender *</label>
                  <select name="gender" value={form.gender} onChange={handleChange}>
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                  {errors.gender && <span className="req-register-error">{errors.gender}</span>}
                </div>
                <div className="req-register-field">
                  <label><FaCity /> City *</label>
                  <input name="city" value={form.city} onChange={handleChange} placeholder="City" />
                  {errors.city && <span className="req-register-error">{errors.city}</span>}
                </div>
                <div className="req-register-field">
                  <label><FaMapMarkerAlt /> Address *</label>
                  <input name="address" value={form.address} onChange={handleChange} placeholder="Full address" />
                  {errors.address && <span className="req-register-error">{errors.address}</span>}
                </div>
                <div className="req-register-field req-register-field--full">
                  <label>Blood Needed For *</label>
                  <input name="bloodNeededFor" value={form.bloodNeededFor} onChange={handleChange} placeholder="e.g. Surgery, Accident, Thalassemia" />
                  {errors.bloodNeededFor && <span className="req-register-error">{errors.bloodNeededFor}</span>}
                </div>
              </div>
              <button type="submit" className="req-register-btn" disabled={loading}>
                {loading ? 'Creating Account...' : 'Register'}
              </button>
            </form>
            <p className="req-register-login">Already have an account? <Link to="/requester/login">Sign In</Link></p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RequesterRegister
