import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { FaHeart, FaCheckCircle, FaUserCircle, FaBookOpen, FaShieldAlt, FaHandHoldingHeart } from 'react-icons/fa'
import Navbar from '../../components/Navbar/Navbar'
import Footer from '../../components/Footer/Footer'
import bloodDropSuccess from '../../assets/donor-success/blood-drop-success.png'
import celebrationConfetti from '../../assets/donor-success/celebration-confetti.svg'
import heroOutline from '../../assets/donor-success/hero-outline.svg'
import './DonorThankYou.css'

const VERIFIED_ITEMS = [
  { icon: <FaCheckCircle />, label: 'Account Activated' },
  { icon: <FaCheckCircle />, label: 'Email Verified' },
  { icon: <FaCheckCircle />, label: 'Ready to Donate' },
]

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.5, ease: 'easeOut' },
  }),
}

const DonorThankYou = () => {
  return (
    <div className="donor-thankyou-page">
      <Navbar />
      <main className="donor-thankyou-main">
        <div className="donor-thankyou-container">
          <motion.div
            className="donor-thankyou-card"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <img src={heroOutline} alt="" className="donor-thankyou-outline" />

            <motion.div
              className="donor-thankyou-illustration"
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.55, type: 'spring', stiffness: 160 }}
            >
              <div className="donor-thankyou-glow" />
              <img src={celebrationConfetti} alt="" className="donor-thankyou-confetti" />
              <motion.img
                src={bloodDropSuccess}
                alt="Successful verification"
                className="donor-thankyou-blood"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              />
              <motion.div
                className="donor-thankyou-heart-burst"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4, type: 'spring', stiffness: 240 }}
              >
                <FaHeart />
              </motion.div>
            </motion.div>

            <motion.span
              className="donor-thankyou-badge"
              variants={fadeUp}
              initial="hidden"
              animate="show"
              custom={1}
            >
              <FaShieldAlt /> Account Verified
            </motion.span>

            <motion.h1
              className="donor-thankyou-title"
              variants={fadeUp}
              initial="hidden"
              animate="show"
              custom={2}
            >
              Thank You for Becoming a{' '}
              <span className="donor-thankyou-title--accent">Hero!</span>
              <FaHeart className="donor-thankyou-title-heart" />
            </motion.h1>

            <motion.p
              className="donor-thankyou-text"
              variants={fadeUp}
              initial="hidden"
              animate="show"
              custom={3}
            >
              Your email has been verified successfully. Welcome to the HemoConnect360 community.
            </motion.p>
            <motion.p
              className="donor-thankyou-text donor-thankyou-text--muted"
              variants={fadeUp}
              initial="hidden"
              animate="show"
              custom={4}
            >
              Every donation you make has the power to save lives.
            </motion.p>

            <motion.div
              className="donor-thankyou-checks"
              variants={fadeUp}
              initial="hidden"
              animate="show"
              custom={5}
            >
              {VERIFIED_ITEMS.map((item) => (
                <div className="donor-thankyou-check" key={item.label}>
                  <span className="donor-thankyou-check-icon">{item.icon}</span>
                  {item.label}
                </div>
              ))}
            </motion.div>

            <motion.div
              className="donor-thankyou-actions"
              variants={fadeUp}
              initial="hidden"
              animate="show"
              custom={6}
            >
              <Link to="/donor/dashboard" className="donor-thankyou-btn donor-thankyou-btn--primary">
                <FaUserCircle /> Go to Dashboard
              </Link>
              <Link to="/how-it-works" className="donor-thankyou-btn donor-thankyou-btn--secondary">
                <FaBookOpen /> Learn How It Works
              </Link>
            </motion.div>

            <motion.p
              className="donor-thankyou-footer-note"
              variants={fadeUp}
              initial="hidden"
              animate="show"
              custom={7}
            >
              <FaHandHoldingHeart /> Welcome to the community. Your journey as a lifesaver begins now.
            </motion.p>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default DonorThankYou
