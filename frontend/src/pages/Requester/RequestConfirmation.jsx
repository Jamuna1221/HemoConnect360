import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FaCheck, FaTint, FaHospital, FaMapMarkerAlt, FaUser, FaCalendarAlt, FaPhone, FaHeartbeat } from 'react-icons/fa'
import RequesterNavbar from '../../components/Requester/RequesterNavbar'
import Footer from '../../components/Footer/Footer'
import { useRequester } from '../../context/RequesterContext'
import './RequestConfirmation.css'

const RequestConfirmation = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useRequester()
  const requestData = location.state?.request || location.state?.requestData

  useEffect(() => {
    if (!user) {
      navigate('/requester/login')
    }
  }, [user, navigate])

  if (!user) return null

  return (
    <div className="req-confirm-page">
      <RequesterNavbar />
      <main className="req-confirm-main">
        <motion.div
          className="req-confirm-container req-confirm-container--visible"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            className="req-confirm-success"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, duration: 0.4, type: 'spring', stiffness: 200 }}
          >
            <div className="req-confirm-check-circle">
              <FaCheck className="req-confirm-check-icon" />
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            Request Submitted Successfully!
          </motion.h1>
          <motion.p
            className="req-confirm-subtitle"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            Your blood request has been received and donors are being searched.
          </motion.p>

          <motion.div
            className="req-confirm-donor-counter"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
          >
            <FaTint className="req-confirm-donor-icon" />
            <span className="req-confirm-donor-number">{requestData?.units || '?'}</span>
            <p>Units of {requestData?.bloodGroup || 'blood'} requested</p>
          </motion.div>

          <motion.div
            className="req-confirm-details"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
          >
            <h2>Request Summary</h2>
            <div className="req-confirm-grid">
              <div className="req-confirm-detail">
                <FaTint className="req-confirm-detail-icon" />
                <div>
                  <span>Blood Group</span>
                  <strong>{requestData?.bloodGroup}</strong>
                </div>
              </div>
              <div className="req-confirm-detail">
                <FaUser className="req-confirm-detail-icon" />
                <div>
                  <span>Patient</span>
                  <strong>{requestData?.patientName}</strong>
                </div>
              </div>
              <div className="req-confirm-detail">
                <FaHospital className="req-confirm-detail-icon" />
                <div>
                  <span>Hospital</span>
                  <strong>{requestData?.hospitalName}</strong>
                </div>
              </div>
              <div className="req-confirm-detail">
                <FaMapMarkerAlt className="req-confirm-detail-icon" />
                <div>
                  <span>City</span>
                  <strong>{requestData?.city}</strong>
                </div>
              </div>
              <div className="req-confirm-detail">
                <FaCalendarAlt className="req-confirm-detail-icon" />
                <div>
                  <span>Required By</span>
                  <strong>{requestData?.requiredBy}</strong>
                </div>
              </div>
              <div className="req-confirm-detail">
                <FaHeartbeat className="req-confirm-detail-icon" />
                <div>
                  <span>Priority</span>
                  <strong>{requestData?.priority}</strong>
                </div>
              </div>
              <div className="req-confirm-detail">
                <FaPhone className="req-confirm-detail-icon" />
                <div>
                  <span>Contact</span>
                  <strong>{requestData?.contactName}</strong>
                </div>
              </div>
              <div className="req-confirm-detail">
                <FaTint className="req-confirm-detail-icon" />
                <div>
                  <span>Request ID</span>
                  <strong>{requestData?.id}</strong>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="req-confirm-actions"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
          >
            <button
              className="req-confirm-btn req-confirm-btn--primary"
              onClick={() => navigate('/requester/track', { state: { request: requestData } })}
            >
              Track Request
            </button>
            <button
              className="req-confirm-btn req-confirm-btn--secondary"
              onClick={() => navigate('/requester/dashboard')}
            >
              Go to Dashboard
            </button>
          </motion.div>
        </motion.div>
      </main>
      <Footer />
    </div>
  )
}

export default RequestConfirmation