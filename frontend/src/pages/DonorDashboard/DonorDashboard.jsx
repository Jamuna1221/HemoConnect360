import { Link } from 'react-router-dom'
import Navbar from '../../components/Navbar/Navbar'
import Footer from '../../components/Footer/Footer'
import heroPattern from '../../assets/donor-dashboard/hero-pattern.png'
import donorHero from '../../assets/donor-dashboard/donor-hero.png'
import bloodBag from '../../assets/donor-dashboard/blood-bag.png'
import {
  FaHeart,
  FaTint,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaClock,
  FaBell,
  FaShieldAlt,
  FaHandHoldingHeart,
  FaCheckCircle,
  FaPhoneAlt,
  FaEnvelope,
  FaWhatsapp,
  FaHospital,
  FaClipboardList,
  FaAward,
  FaFire,
  FaUsers,
  FaHeartbeat,
  FaIdCard,
  FaExclamationTriangle,
  FaStar,
  FaMapPin,
  FaChevronRight
} from 'react-icons/fa'
import './DonorDashboard.css'

const QUICK_ACTIONS = [
  { icon: <FaClipboardList />, title: 'Update Profile', desc: 'Keep your information current', path: '/donor/registration', color: '#E53935' },
  { icon: <FaMapMarkerAlt />, title: 'Find Blood Bank', desc: 'Locate nearest donation center', path: '/', color: '#22C55E' },
  { icon: <FaCalendarAlt />, title: 'Schedule Donation', desc: 'Book your next appointment', path: '/', color: '#3B82F6' },
  { icon: <FaBell />, title: 'Alert Preferences', desc: 'Manage notification settings', path: '/', color: '#F59E0B' }
]

const DONATION_HISTORY = [
  { id: 1, date: '2026-06-15', bloodBank: 'Central Blood Bank', units: 1, status: 'completed', location: 'Colombo' },
  { id: 2, date: '2026-03-20', bloodBank: 'Red Cross Society', units: 1, status: 'completed', location: 'Kandy' },
  { id: 3, date: '2025-12-10', bloodBank: 'National Blood Centre', units: 1, status: 'completed', location: 'Galle' }
]

const HERO_STATS = [
  { icon: <FaHeart />, value: '3', label: 'Lives Impacted', color: '#E53935' },
  { icon: <FaTint />, value: '3', label: 'Total Donations', color: '#22C55E' },
  { icon: <FaAward />, value: '750', label: 'Reward Points', color: '#F59E0B' }
]

const HEALTH_TIPS = [
  { icon: <FaTint />, title: 'Stay Hydrated', desc: 'Drink plenty of water before and after donation to help your body recover quickly.' },
  { icon: <FaHeart />, title: 'Eat Iron-Rich Foods', desc: 'Include spinach, beans, and red meat in your diet to maintain healthy iron levels.' },
  { icon: <FaShieldAlt />, title: 'Rest Well', desc: 'Get adequate sleep the night before donation and avoid strenuous activity afterward.' }
]

const BLOOD_REQUESTS = [
  { id: 1, bloodGroup: 'O+', hospital: 'Central Hospital', distance: '2.3 km', priority: 'urgent', date: '2026-07-25' },
  { id: 2, bloodGroup: 'A+', hospital: 'City Medical Center', distance: '5.1 km', priority: 'high', date: '2026-07-26' },
  { id: 3, bloodGroup: 'B+', hospital: 'St. Mary\'s Hospital', distance: '8.7 km', priority: 'normal', date: '2026-07-28' },
  { id: 4, bloodGroup: 'AB-', hospital: 'National Blood Bank', distance: '3.4 km', priority: 'urgent', date: '2026-07-29' }
]

const DONATION_CAMPS = [
  { id: 1, name: 'Community Blood Drive', date: '2026-08-10', time: '9:00 AM - 4:00 PM', location: 'Central Hospital Grounds', organizer: 'Red Cross Society' },
  { id: 2, name: 'Corporate Blood Camp', date: '2026-08-22', time: '10:00 AM - 3:00 PM', location: 'Tech Park Auditorium', organizer: 'HemoConnect360' },
  { id: 3, name: 'University Blood Drive', date: '2026-09-05', time: '8:00 AM - 2:00 PM', location: 'State University Campus', organizer: 'Youth Red Cross' }
]

const REWARDS = [
  { id: 1, title: 'First Donation', desc: 'Completed your first blood donation', icon: <FaHeart />, earned: true },
  { id: 2, title: 'Life Saver', desc: 'Saved 3 lives through donations', icon: <FaAward />, earned: true },
  { id: 3, title: 'Regular Donor', desc: 'Donated 3 times in one year', icon: <FaStar />, earned: false },
  { id: 4, title: 'Hero Badge', desc: 'Reach 10 total donations', icon: <FaShieldAlt />, earned: false }
]

const EMERGENCY_ALERTS = [
  { id: 1, title: 'Critical O- Shortage', message: 'Immediate O- blood donors needed at City Hospital. Only 2 units remaining.', time: '2 hours ago', severity: 'critical' },
  { id: 2, title: 'Blood Camp This Weekend', message: 'Community blood drive at Central Hospital on Aug 10. Your support needed!', time: '1 day ago', severity: 'info' }
]

const DonorDashboard = () => {
  return (
    <div className="donor-dash-page">
      <Navbar />
      <main className="donor-dash-main">
        <div className="donor-dash-container">

          <div className="donor-dash-hero">
            <div className="donor-dash-hero-left">
              <span className="donor-dash-badge"><FaHeart /> Registered Donor</span>
              <h1 className="donor-dash-hero-heading">
                Welcome back, <span className="donor-dash-hero-name">Donor!</span>
              </h1>
              <p className="donor-dash-hero-appreciation">
                Thank you for being a life saver. Your generous donations are making a real difference in people's lives.
              </p>
              <div className="donor-dash-hero-stats">
                {HERO_STATS.map((stat) => (
                  <div key={stat.label} className="donor-dash-hero-stat-card">
                    <div className="donor-dash-hero-stat-icon" style={{ background: `${stat.color}15`, color: stat.color }}>
                      {stat.icon}
                    </div>
                    <div className="donor-dash-hero-stat-info">
                      <span className="donor-dash-hero-stat-value">{stat.value}</span>
                      <span className="donor-dash-hero-stat-label">{stat.label}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="donor-dash-hero-right">
              <div className="donor-dash-hero-pattern" style={{ backgroundImage: `url(${heroPattern})` }}></div>
              <img src={donorHero} alt="Donor Hero" className="donor-dash-hero-illustration" />
            </div>
          </div>

          <div className="donor-dash-info-grid">
            <div className="donor-dash-info-card">
              <div className="donor-dash-info-icon donor-dash-info-icon--blue">
                <FaCalendarAlt />
              </div>
              <div className="donor-dash-info-content">
                <span className="donor-dash-info-label">Next Eligible Donation</span>
                <span className="donor-dash-info-value">Sep 15, 2026</span>
                <span className="donor-dash-info-sub">45 days remaining</span>
              </div>
            </div>
            <div className="donor-dash-info-card">
              <div className="donor-dash-info-icon donor-dash-info-icon--red">
                <FaTint />
              </div>
              <div className="donor-dash-info-content">
                <span className="donor-dash-info-label">Blood Group</span>
                <span className="donor-dash-info-value">O+</span>
                <span className="donor-dash-info-sub">Universal donor</span>
              </div>
            </div>
            <div className="donor-dash-info-card">
              <div className="donor-dash-info-icon donor-dash-info-icon--purple">
                <FaIdCard />
              </div>
              <div className="donor-dash-info-content">
                <span className="donor-dash-info-label">Donor ID</span>
                <span className="donor-dash-info-value">DNR-2026-0458</span>
                <span className="donor-dash-info-sub">Registered donor</span>
              </div>
            </div>
            <div className="donor-dash-info-card">
              <div className="donor-dash-info-icon donor-dash-info-icon--green">
                <FaHeartbeat />
              </div>
              <div className="donor-dash-info-content">
                <span className="donor-dash-info-label">Health Status</span>
                <span className="donor-dash-info-value">Excellent</span>
                <span className="donor-dash-info-sub">Cleared to donate</span>
              </div>
            </div>
          </div>

          <div className="donor-dash-section">
            <div className="donor-dash-section-header">
              <h2>Quick Actions</h2>
            </div>
            <div className="donor-dash-actions-grid">
              {QUICK_ACTIONS.map((action) => (
                <Link key={action.title} to={action.path} className="donor-dash-action-card">
                  <div className="donor-dash-action-icon" style={{ background: `${action.color}15`, color: action.color }}>
                    {action.icon}
                  </div>
                  <h3>{action.title}</h3>
                  <p>{action.desc}</p>
                  <span className="donor-dash-action-arrow"><FaChevronRight /></span>
                </Link>
              ))}
            </div>
          </div>

          <div className="donor-dash-two-col">
            <div className="donor-dash-section">
              <div className="donor-dash-section-header">
                <h2><FaClock /> Donation History</h2>
                <Link to="/" className="donor-dash-view-all">View All <FaChevronRight /></Link>
              </div>
              <div className="donor-dash-timeline">
                {DONATION_HISTORY.map((donation, idx) => (
                  <div key={donation.id} className="donor-dash-timeline-item">
                    <div className="donor-dash-timeline-line">
                      <div className="donor-dash-timeline-dot"></div>
                      {idx < DONATION_HISTORY.length - 1 && <div className="donor-dash-timeline-connector"></div>}
                    </div>
                    <div className="donor-dash-timeline-card">
                      <div className="donor-dash-timeline-top">
                        <span className="donor-dash-timeline-date">{new Date(donation.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        <span className="donor-dash-timeline-badge donor-dash-timeline-badge--completed"><FaCheckCircle /> Completed</span>
                      </div>
                      <h4 className="donor-dash-timeline-title">{donation.bloodBank}</h4>
                      <p className="donor-dash-timeline-meta"><FaMapMarkerAlt /> {donation.location} &bull; {donation.units} unit donated</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="donor-dash-section">
              <div className="donor-dash-section-header">
                <h2><FaHospital /> Recent Blood Requests</h2>
                <Link to="/" className="donor-dash-view-all">View All <FaChevronRight /></Link>
              </div>
              <div className="donor-dash-requests-list">
                {BLOOD_REQUESTS.map((req) => (
                  <div key={req.id} className="donor-dash-request-card">
                    <div className="donor-dash-request-top">
                      <span className="donor-dash-request-blood-group">
                        <FaTint /> {req.bloodGroup}
                      </span>
                      <span className={`donor-dash-request-priority donor-dash-request-priority--${req.priority}`}>
                        {req.priority}
                      </span>
                    </div>
                    <h4 className="donor-dash-request-hospital">{req.hospital}</h4>
                    <div className="donor-dash-request-bottom">
                      <span className="donor-dash-request-distance"><FaMapMarkerAlt /> {req.distance}</span>
                      <span className="donor-dash-request-date"><FaCalendarAlt /> {new Date(req.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    </div>
                  </div>
                ))}
              </div>
              <Link to="/" className="donor-dash-btn-outline">
                <FaChevronRight /> View All Blood Requests
              </Link>
            </div>
          </div>

          <div className="donor-dash-impact-section">
            <div className="donor-dash-impact-left">
              <span className="donor-dash-impact-tag"><FaHandHoldingHeart /> Your Impact</span>
              <h2 className="donor-dash-impact-heading">Making a Real Difference</h2>
              <p className="donor-dash-impact-desc">
                Every donation you make helps save lives and strengthen communities. Track your contribution and see the positive impact you've created.
              </p>
              <div className="donor-dash-impact-stats-grid">
                <div className="donor-dash-impact-stat-card">
                  <div className="donor-dash-impact-stat-icon donor-dash-impact-stat-icon--red"><FaHeart /></div>
                  <div className="donor-dash-impact-stat-num">3</div>
                  <div className="donor-dash-impact-stat-text">Lives Saved</div>
                </div>
                <div className="donor-dash-impact-stat-card">
                  <div className="donor-dash-impact-stat-icon donor-dash-impact-stat-icon--green"><FaTint /></div>
                  <div className="donor-dash-impact-stat-num">3L</div>
                  <div className="donor-dash-impact-stat-text">Blood Donated</div>
                </div>
                <div className="donor-dash-impact-stat-card">
                  <div className="donor-dash-impact-stat-icon donor-dash-impact-stat-icon--blue"><FaUsers /></div>
                  <div className="donor-dash-impact-stat-num">3</div>
                  <div className="donor-dash-impact-stat-text">Families Helped</div>
                </div>
                <div className="donor-dash-impact-stat-card">
                  <div className="donor-dash-impact-stat-icon donor-dash-impact-stat-icon--purple"><FaAward /></div>
                  <div className="donor-dash-impact-stat-num">750</div>
                  <div className="donor-dash-impact-stat-text">Reward Points</div>
                </div>
              </div>
            </div>
            <div className="donor-dash-impact-right">
              <img src={bloodBag} alt="Your Impact" className="donor-dash-impact-image" />
            </div>
          </div>

          <div className="donor-dash-section">
            <div className="donor-dash-section-header">
              <h2><FaHeartbeat /> Health Tips for Donors</h2>
            </div>
            <div className="donor-dash-tips-grid">
              {HEALTH_TIPS.map((tip) => (
                <div key={tip.title} className="donor-dash-tip-card">
                  <div className="donor-dash-tip-icon">{tip.icon}</div>
                  <h4>{tip.title}</h4>
                  <p>{tip.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="donor-dash-section">
            <div className="donor-dash-section-header">
              <h2><FaPhoneAlt /> Emergency Contact</h2>
            </div>
            <div className="donor-dash-contact-grid">
              <a href="tel:18001801234" className="donor-dash-contact-card">
                <FaPhoneAlt />
                <h4>24/7 Helpline</h4>
                <p>1800-180-1234</p>
              </a>
              <a href="mailto:support@hemoconnect360.com" className="donor-dash-contact-card">
                <FaEnvelope />
                <h4>Email Support</h4>
                <p>support@hemoconnect360.com</p>
              </a>
              <a href="https://wa.me/94771234567" className="donor-dash-contact-card" target="_blank" rel="noopener noreferrer">
                <FaWhatsapp />
                <h4>WhatsApp</h4>
                <p>Chat with us</p>
              </a>
            </div>
          </div>

          <div className="donor-dash-bottom-grid">

            <div className="donor-dash-section">
              <div className="donor-dash-section-header">
                <h2><FaCalendarAlt /> Upcoming Donation Camps</h2>
              </div>
              <div className="donor-dash-camps-list">
                {DONATION_CAMPS.map((camp) => (
                  <div key={camp.id} className="donor-dash-camp-card">
                    <div className="donor-dash-camp-top">
                      <div className="donor-dash-camp-date-block">
                        <span className="donor-dash-camp-month">{new Date(camp.date).toLocaleDateString('en-US', { month: 'short' })}</span>
                        <span className="donor-dash-camp-day">{new Date(camp.date).getDate()}</span>
                      </div>
                      <div className="donor-dash-camp-info">
                        <h4>{camp.name}</h4>
                        <p className="donor-dash-camp-meta"><FaClock /> {camp.time}</p>
                        <p className="donor-dash-camp-meta"><FaMapPin /> {camp.location}</p>
                        <p className="donor-dash-camp-organizer"><FaUsers /> {camp.organizer}</p>
                      </div>
                    </div>
                    <button className="donor-dash-camp-register">Register</button>
                  </div>
                ))}
              </div>
            </div>

            <div className="donor-dash-section">
              <div className="donor-dash-section-header">
                <h2><FaAward /> Rewards & Badges</h2>
              </div>
              <div className="donor-dash-rewards-list">
                {REWARDS.map((reward) => (
                  <div key={reward.id} className={`donor-dash-reward-card ${reward.earned ? 'donor-dash-reward-card--earned' : 'donor-dash-reward-card--locked'}`}>
                    <div className="donor-dash-reward-icon">
                      {reward.icon}
                      {reward.earned && <span className="donor-dash-reward-check"><FaCheckCircle /></span>}
                    </div>
                    <div className="donor-dash-reward-info">
                      <h4>{reward.title}</h4>
                      <p>{reward.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link to="/" className="donor-dash-btn-outline">
                <FaChevronRight /> View All Rewards
              </Link>
            </div>

            <div className="donor-dash-section">
              <div className="donor-dash-section-header">
                <h2><FaExclamationTriangle /> Emergency Alerts</h2>
              </div>
              <div className="donor-dash-alerts-list">
                {EMERGENCY_ALERTS.map((alert) => (
                  <div key={alert.id} className={`donor-dash-alert-card donor-dash-alert-card--${alert.severity}`}>
                    <div className="donor-dash-alert-header">
                      <span className={`donor-dash-alert-badge donor-dash-alert-badge--${alert.severity}`}>
                        {alert.severity === 'critical' ? <FaExclamationTriangle /> : <FaBell />}
                        {alert.severity}
                      </span>
                      <span className="donor-dash-alert-time">{alert.time}</span>
                    </div>
                    <h4>{alert.title}</h4>
                    <p>{alert.message}</p>
                  </div>
                ))}
              </div>
              <button className="donor-dash-btn-help" onClick={() => window.location.href = 'tel:18001801234'}>
                <FaPhoneAlt /> Help Now
              </button>
            </div>

          </div>

          <div className="donor-dash-thankyou">
            <div className="donor-dash-thankyou-left">
              <div className="donor-dash-thankyou-icon">
                <FaHeart />
              </div>
              <div className="donor-dash-thankyou-text">
                <h2>Thank you for being a lifesaver!</h2>
                <p>Your generosity brings hope and healing to those in need. Every drop counts, and your contribution makes a lasting impact on the community.</p>
              </div>
            </div>
            <div className="donor-dash-thankyou-right">
              <Link to="/" className="donor-dash-thankyou-btn">
                <FaUsers /> Refer a Friend
              </Link>
            </div>
          </div>

        </div>
      </main>
      <Footer />
    </div>
  )
}

export default DonorDashboard
