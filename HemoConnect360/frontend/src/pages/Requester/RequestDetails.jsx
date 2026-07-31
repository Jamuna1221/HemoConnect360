import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FaArrowLeft, FaTint, FaUser, FaHospital, FaCalendarAlt, FaPhone, FaMapMarkerAlt, FaCheckCircle, FaClock, FaExclamationCircle, FaTimes } from 'react-icons/fa'
import { useRequester } from '../../context/RequesterContext'
import RequesterNavbar from '../../components/Requester/RequesterNavbar'
import './RequestDetails.css'

const TIMELINE_STEPS = [
  { key: 'submitted', label: 'Request Submitted', icon: <FaCheckCircle /> },
  { key: 'searching', label: 'Searching Donors', icon: <FaClock /> },
  { key: 'notified', label: 'Nearby Donors Notified', icon: <FaClock /> },
  { key: 'accepted', label: 'Donor Accepted', icon: <FaClock /> },
  { key: 'donated', label: 'Blood Donated', icon: <FaClock /> },
  { key: 'completed', label: 'Completed', icon: <FaCheckCircle /> },
]

const RequestDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, requests, cancelRequest } = useRequester()
  const [req, setReq] = useState(null)

  useEffect(() => { if (!user) navigate('/requester/login') }, [user, navigate])

  useEffect(() => {
    const found = requests.find((r) => r.id === id)
    setReq(found || null)
  }, [id, requests])

  if (!user) return null
  if (!req) return (
    <div className="req-detail-page"><RequesterNavbar />
      <main className="req-detail-main"><div className="req-detail-container"><div className="req-detail-empty"><p>Request not found.</p><button onClick={() => navigate('/requester/history')}>Back to History</button></div></div></main>
    </div>
  )

  const currentStep = req.timeline ? req.timeline.findIndex((t) => !t.completed) : 0
  const progress = req.timeline ? ((req.timeline.filter((t) => t.completed).length / req.timeline.length) * 100) : 0

  return (
    <div className="req-detail-page">
      <RequesterNavbar />
      <main className="req-detail-main">
        <motion.div className="req-detail-container" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="req-detail-top">
            <button className="req-detail-back" onClick={() => navigate(-1)}><FaArrowLeft /> Back</button>
            <h1>Request Details</h1>
            <span className="req-detail-id">{req.id}</span>
          </div>

          <div className="req-detail-progress-bar"><div className="req-detail-progress-fill" style={{ width: `${progress}%` }}></div></div>

          <div className="req-detail-grid">
            <div className="req-detail-timeline-card">
              <h2>Timeline</h2>
              {req.timeline && (
                <div className="req-detail-timeline">
                  {req.timeline.map((step, i) => (
                    <div key={i} className={`req-detail-step ${step.completed ? 'req-detail-step--completed' : ''} ${i === currentStep ? 'req-detail-step--current' : ''}`}>
                      <div className="req-detail-step-marker">
                        <div className="req-detail-step-icon">{step.completed ? <FaCheckCircle /> : <FaClock />}</div>
                        {i < req.timeline.length - 1 && <div className="req-detail-step-line"></div>}
                      </div>
                      <div className="req-detail-step-content">
                        <h4>{step.label}</h4>
                        {step.time && <span>{step.time}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="req-detail-info-cards">
              <div className="req-detail-card">
                <h3><FaUser /> Patient Information</h3>
                <div className="req-detail-fields">
                  <div><span>Name</span><strong>{req.patientName}</strong></div>
                  <div><span>Age/Gender</span><strong>{req.patientAge} / {req.patientGender || 'N/A'}</strong></div>
                  <div><span>Blood Group</span><strong className="req-detail-blood">{req.bloodGroup}</strong></div>
                  <div><span>Units</span><strong>{req.units}</strong></div>
                  <div><span>Priority</span><strong className={`req-detail-priority req-detail-priority--${req.priority}`}>{req.priority}</strong></div>
                </div>
              </div>

              <div className="req-detail-card">
                <h3><FaHospital /> Hospital Details</h3>
                <div className="req-detail-fields">
                  <div><span>Hospital</span><strong>{req.hospitalName}</strong></div>
                  <div><span>City</span><strong><FaMapMarkerAlt /> {req.city}</strong></div>
                  <div><span>Address</span><strong>{req.address}</strong></div>
                  <div><span>Required By</span><strong><FaCalendarAlt /> {req.requiredBy}</strong></div>
                </div>
              </div>

              <div className="req-detail-card">
                <h3><FaPhone /> Contact</h3>
                <div className="req-detail-fields">
                  <div><span>Contact Name</span><strong>{req.contactName}</strong></div>
                  <div><span>Phone</span><strong><FaPhone /> {req.contactPhone}</strong></div>
                  {req.contactEmail && <div><span>Email</span><strong>{req.contactEmail}</strong></div>}
                  {req.notes && <div><span>Notes</span><strong>{req.notes}</strong></div>}
                </div>
              </div>

              {(req.status === 'submitted' || req.status === 'searching_donors') && (
                <div className="req-detail-card req-detail-card--action">
                  <button className="req-detail-cancel-btn" onClick={() => { cancelRequest(req.id); navigate('/requester/history') }}>
                    <FaTimes /> Cancel Request
                  </button>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  )
}

export default RequestDetails
