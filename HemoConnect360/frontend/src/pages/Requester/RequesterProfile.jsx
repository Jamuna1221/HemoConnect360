import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FaUser, FaPhone, FaCalendarAlt, FaVenusMars, FaCity, FaMapMarkerAlt, FaHeartbeat, FaSignOutAlt, FaHospital, FaEdit, FaShieldAlt } from 'react-icons/fa'
import { useRequester } from '../../context/RequesterContext'
import RequesterNavbar from '../../components/Requester/RequesterNavbar'
import Footer from '../../components/Footer/Footer'
import './RequesterProfile.css'

const SAVED_HOSPITALS = [
  { name: 'Apollo Hospital', address: 'Shafee Mohammed Road, Chennai' },
  { name: 'Fortis Malar Hospital', address: 'Adyar, Chennai' },
]

const RequesterProfile = () => {
  const navigate = useNavigate()
  const { user, logoutUser, saveProfile } = useRequester()
  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm] = useState({ fullName: '', age: '', gender: '', city: '', address: '', bloodNeededFor: '', email: '' })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => { if (!user) navigate('/requester/login') }, [user, navigate])

  useEffect(() => {
    if (!user) return
    setForm({
      fullName: user.fullName || '',
      age: user.age || '',
      gender: user.gender || '',
      city: user.city || '',
      address: user.address || '',
      bloodNeededFor: user.bloodNeededFor || '',
      email: user.email || '',
    })
  }, [user])

  if (!user) return null

  const handleLogout = () => { logoutUser(); navigate('/') }
  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  const handleCancel = () => { setIsEditing(false); setMessage('') }
  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')
    const result = await saveProfile(form)
    setSaving(false)
    setIsEditing(false)
    setMessage(result.success ? 'Profile saved successfully.' : 'Profile saved locally. Backend sync failed.')
  }

  return (
    <div className="req-profile-page">
      <RequesterNavbar />
      <main className="req-profile-main">
        <motion.div className="req-profile-container" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="req-profile-header"><h1>My Profile</h1><p>Manage your account and preferences</p></div>
          <div className="req-profile-grid">
            <div className="req-profile-card req-profile-card--main">
              <div className="req-profile-avatar"><FaUser className="req-profile-avatar-icon" /></div>
              <h2>{user.fullName || 'Requester User'}</h2>
              <p className="req-profile-phone"><FaPhone /> {user.phone || '+91 98765 43210'}</p>
              <button className="req-profile-edit-btn" onClick={() => { setIsEditing(true); setMessage('') }}><FaEdit /> Edit Profile</button>
              {message && <p className="req-profile-message">{message}</p>}
            </div>

            {isEditing && (
              <form className="req-profile-card req-profile-edit-card" onSubmit={handleSubmit}>
                <div className="req-profile-card-header"><h3><FaEdit /> Edit Profile</h3></div>
                <div className="req-profile-edit-grid">
                  <label>Full Name<input name="fullName" value={form.fullName} onChange={handleChange} placeholder="Full name" /></label>
                  <label>Age<input name="age" type="number" min="1" max="120" value={form.age} onChange={handleChange} placeholder="Age" /></label>
                  <label>Gender<select name="gender" value={form.gender} onChange={handleChange}><option value="">Select</option><option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option></select></label>
                  <label>City<input name="city" value={form.city} onChange={handleChange} placeholder="City" /></label>
                  <label>Address<input name="address" value={form.address} onChange={handleChange} placeholder="Address" /></label>
                  <label>Blood Needed For<input name="bloodNeededFor" value={form.bloodNeededFor} onChange={handleChange} placeholder="Reason" /></label>
                  <label className="req-profile-edit-full">Email<input name="email" type="email" value={form.email} onChange={handleChange} placeholder="Email" /></label>
                </div>
                <div className="req-profile-edit-actions">
                  <button type="button" className="req-profile-cancel-btn" onClick={handleCancel} disabled={saving}>Cancel</button>
                  <button type="submit" className="req-profile-save-btn" disabled={saving}>{saving ? 'Saving...' : 'Save Profile'}</button>
                </div>
              </form>
            )}

            <div className="req-profile-card">
              <div className="req-profile-card-header"><h3><FaUser /> Personal Details</h3></div>
              <div className="req-profile-fields">
                {[{ icon: <FaUser />, label: 'Full Name', value: user.fullName }, { icon: <FaPhone />, label: 'Phone Number', value: user.phone }, { icon: <FaCalendarAlt />, label: 'Age', value: user.age }, { icon: <FaVenusMars />, label: 'Gender', value: user.gender }, { icon: <FaCity />, label: 'City', value: user.city }, { icon: <FaMapMarkerAlt />, label: 'Address', value: user.address }, { icon: <FaHeartbeat />, label: 'Blood Needed For', value: user.bloodNeededFor }].map((f) => (
                  <div key={f.label} className="req-profile-field"><div className="req-profile-field-icon">{f.icon}</div><div><span>{f.label}</span><strong>{f.value || 'Not provided'}</strong></div></div>
                ))}
              </div>
            </div>

            <div className="req-profile-card">
              <div className="req-profile-card-header"><h3><FaShieldAlt /> Emergency Contact</h3></div>
              <div className="req-profile-fields">
                <div className="req-profile-field"><div className="req-profile-field-icon"><FaPhone /></div><div><span>Emergency Helpline</span><strong><a href="tel:18001801234">1800-180-1234</a></strong></div></div>
                <div className="req-profile-field"><div className="req-profile-field-icon"><FaHospital /></div><div><span>Partner Hospitals</span><strong>120+ across India</strong></div></div>
              </div>
            </div>

            <div className="req-profile-card">
              <div className="req-profile-card-header"><h3><FaHospital /> Saved Hospitals</h3></div>
              <div className="req-profile-hospitals">
                {SAVED_HOSPITALS.map((h) => (
                  <div key={h.name} className="req-profile-hospital"><div className="req-profile-hospital-icon"><FaHospital /></div><div><h4>{h.name}</h4><p>{h.address}</p></div></div>
                ))}
              </div>
            </div>

            <div className="req-profile-card">
              <div className="req-profile-card-header"><h3><FaShieldAlt /> Account Access</h3></div>
              <div className="req-profile-fields">
                <div className="req-profile-field"><div className="req-profile-field-icon"><FaPhone /></div><div><span>Primary Account Key</span><strong>{user.phone}</strong></div></div>
                <div className="req-profile-field"><div className="req-profile-field-icon"><FaShieldAlt /></div><div><span>Requester Access</span><strong className="req-profile-badge">Phone-only login</strong></div></div>
              </div>
            </div>

            <div className="req-profile-card req-profile-card--logout">
              <button className="req-profile-logout-btn" onClick={handleLogout}><FaSignOutAlt /> Logout</button>
            </div>
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  )
}

export default RequesterProfile
