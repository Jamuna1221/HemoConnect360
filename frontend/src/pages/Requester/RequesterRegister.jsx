import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { FaUser, FaPhone, FaLock, FaCalendarAlt, FaVenusMars, FaCity, FaMapMarkerAlt, FaArrowLeft, FaTint, FaShieldAlt, FaHospital, FaHandHoldingHeart } from 'react-icons/fa'
import { useRequester } from '../../context/RequesterContext'
import './RequesterRegister.css'

const RequesterRegister = () => {
  const navigate = useNavigate()
  const { loginUser } = useRequester()

  const [form, setForm] = useState({ fullName: '', phone: '', age: '', gender: '', city: '', address: '', bloodNeededFor: '', password: '', confirmPassword: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const validate = () => {
    const errs = {}
    if (!form.fullName.trim()) errs.fullName = 'Full name is required'
    if (!form.phone.trim() || form.phone.length < 10) errs.phone = 'Valid phone number is required'
    if (!form.age || form.age < 1) errs.age = 'Valid age is required'
    if (!form.gender) errs.gender = 'Gender is required'
    if (!form.city.trim()) errs.city = 'City is required'
    if (!form.address.trim()) errs.address = 'Address is required'
    if (!form.bloodNeededFor.trim()) errs.bloodNeededFor = 'This field is required'
    if (!form.password || form.password.length < 6) errs.password = 'Password must be at least 6 characters'
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    setTimeout(() => {
      const user = { ...form, isLoggedIn: true }
      const existingUsers = JSON.parse(localStorage.getItem('requesterUsers') || '[]')
      existingUsers.push(user)
      localStorage.setItem('requesterUsers', JSON.stringify(existingUsers))
      loginUser(user)
      setLoading(false)
      navigate('/requester/dashboard')
    }, 1500)
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
                <div className="req-register-field">
                  <label><FaLock /> Password *</label>
                  <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="Min 6 characters" />
                  {errors.password && <span className="req-register-error">{errors.password}</span>}
                </div>
                <div className="req-register-field">
                  <label><FaLock /> Confirm Password *</label>
                  <input name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} placeholder="Confirm password" />
                  {errors.confirmPassword && <span className="req-register-error">{errors.confirmPassword}</span>}
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
