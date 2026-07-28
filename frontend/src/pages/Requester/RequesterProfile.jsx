import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FaUser, FaPhone, FaCalendarAlt, FaVenusMars, FaCity, FaMapMarkerAlt, FaHeartbeat, FaSignOutAlt, FaHospital, FaEdit, FaShieldAlt, FaKey } from 'react-icons/fa'
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
  const { user, logoutUser } = useRequester()

  useEffect(() => { if (!user) navigate('/requester/login') }, [user, navigate])

  if (!user) return null

  const handleLogout = () => { logoutUser(); navigate('/') }

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
              <button className="req-profile-edit-btn"><FaEdit /> Edit Profile</button>
            </div>

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
              <div className="req-profile-card-header"><h3><FaKey /> Security</h3></div>
              <div className="req-profile-fields">
                <div className="req-profile-field"><div className="req-profile-field-icon"><FaKey /></div><div><span>Password</span><strong>{'\u2022'.repeat(8)}</strong></div></div>
                <div className="req-profile-field"><div className="req-profile-field-icon"><FaShieldAlt /></div><div><span>Two-Factor Auth</span><strong className="req-profile-badge">Enabled</strong></div></div>
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
