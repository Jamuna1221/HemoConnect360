import { useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FaTint, FaMapMarkerAlt, FaHistory, FaUser, FaExclamationTriangle, FaPlus, FaStethoscope, FaHeartbeat, FaNewspaper, FaCalendarAlt } from 'react-icons/fa'
import { useRequester } from '../../context/RequesterContext'
import RequesterNavbar from '../../components/Requester/RequesterNavbar'
import Footer from '../../components/Footer/Footer'
import './RequesterDashboard.css'

const ACTION_CARDS = [
  { icon: <FaTint />, title: 'Request Blood', desc: 'Submit a new blood request for a patient', path: '/requester/request-blood', color: '#E53935' },
  { icon: <FaMapMarkerAlt />, title: 'Track Request', desc: 'Track your active blood request status', path: '/requester/track', color: '#22C55E' },
  { icon: <FaHistory />, title: 'Request History', desc: 'View all your past blood requests', path: '/requester/history', color: '#3B82F6' },
  { icon: <FaUser />, title: 'My Profile', desc: 'Manage your account and preferences', path: '/requester/profile', color: '#8B5CF6' },
]

const HEALTH_TIPS = [
  { icon: <FaHeartbeat />, title: 'Stay Hydrated', desc: 'Drink at least 8 glasses of water daily to maintain good health.' },
  { icon: <FaStethoscope />, title: 'Regular Checkups', desc: 'Schedule annual health checkups to detect issues early.' },
  { icon: <FaTint />, title: 'Know Your Blood Group', desc: 'Always carry your blood group information in emergencies.' },
]

const containerV = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } }
const itemV = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } }

const RequesterDashboard = () => {
  const navigate = useNavigate()
  const { user, requests, notifications } = useRequester()

  useEffect(() => { if (!user) navigate('/requester/login') }, [user, navigate])

  if (!user) return null

  const unreadCount = notifications.filter((n) => !n.read).length
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  const greeting = () => { const h = new Date().getHours(); return h < 12 ? 'Good Morning' : h < 17 ? 'Good Afternoon' : 'Good Evening' }

  return (
    <div className="req-dash-page">
      <RequesterNavbar />
      <main className="req-dash-main">
        <motion.div className="req-dash-container" variants={containerV} initial="hidden" animate="visible">
          <motion.div className="req-dash-header" variants={itemV}>
            <div className="req-dash-greeting">
              <h1>{greeting()}, {user.fullName || 'Requester'} 👋</h1>
              <p><FaCalendarAlt /> {today}</p>
            </div>
            {unreadCount > 0 && (
              <div className="req-dash-notif-badge">{unreadCount} new notifications</div>
            )}
          </motion.div>

          <motion.div className="req-dash-emergency" variants={itemV}>
            <FaExclamationTriangle className="req-dash-emergency-icon" />
            <div className="req-dash-emergency-content">
              <strong>Emergency Blood Needed?</strong>
              <p>For critical emergencies, call our 24/7 helpline at <a href="tel:18001801234">1800-180-1234</a></p>
            </div>
            <button className="req-dash-emergency-btn" onClick={() => navigate('/requester/request-blood')}><FaPlus /> Request Now</button>
          </motion.div>

          <motion.div className="req-dash-actions" variants={itemV}>
            {ACTION_CARDS.map((card) => (
              <motion.div key={card.title} className="req-dash-action-card" whileHover={{ y: -6, boxShadow: '0 12px 32px rgba(0,0,0,0.1)' }} whileTap={{ scale: 0.98 }} onClick={() => navigate(card.path)}>
                <div className="req-dash-action-icon" style={{ background: `${card.color}15`, color: card.color }}>{card.icon}</div>
                <h3>{card.title}</h3><p>{card.desc}</p>
              </motion.div>
            ))}
          </motion.div>

          <motion.div className="req-dash-section" variants={itemV}>
            <div className="req-dash-section-header"><h2>Recent Requests</h2><Link to="/requester/history" className="req-dash-view-all">View All</Link></div>
            {requests.length === 0 ? (
              <div className="req-dash-empty"><FaTint className="req-dash-empty-icon" /><p>No requests yet. Submit your first blood request.</p><button onClick={() => navigate('/requester/request-blood')} className="req-dash-empty-btn">Request Blood</button></div>
            ) : (
              <div className="req-dash-requests">
                {requests.slice(0, 3).map((req) => (
                    <div key={req.id} className="req-dash-request-card" onClick={() => navigate(`/requester/request-details/${req.id}`)}>
                    <div className="req-dash-request-left">
                      <div className={`req-dash-request-priority req-dash-request-priority--${req.priority}`}>{req.priority}</div>
                      <div><h4>{req.id}</h4><p>{req.hospitalName} &bull; {req.bloodGroup} &bull; {req.units} units</p></div>
                    </div>
                    <div className={`req-dash-request-status req-dash-request-status--${req.status}`}>{req.status.replace(/_/g, ' ')}</div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          <motion.div className="req-dash-section" variants={itemV}>
            <div className="req-dash-section-header"><h2><FaNewspaper /> Health Tips</h2></div>
            <div className="req-dash-tips">
              {HEALTH_TIPS.map((tip) => (
                <div key={tip.title} className="req-dash-tip-card"><div className="req-dash-tip-icon">{tip.icon}</div><h4>{tip.title}</h4><p>{tip.desc}</p></div>
              ))}
            </div>
          </motion.div>

          {notifications.length > 0 && (
            <motion.div className="req-dash-section" variants={itemV}>
              <div className="req-dash-section-header"><h2>Notifications</h2></div>
              <div className="req-dash-notifications">
                {notifications.slice(0, 4).map((notif) => (
                  <div key={notif.id} className={`req-dash-notif-item ${!notif.read ? 'req-dash-notif-item--unread' : ''}`}>
                    <div className="req-dash-notif-dot"></div>
                    <div><h4>{notif.text}</h4><span>{notif.time}</span></div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>
      </main>
      <Footer />
    </div>
  )
}

export default RequesterDashboard
