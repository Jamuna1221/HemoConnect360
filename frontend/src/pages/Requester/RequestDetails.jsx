import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FaArrowLeft, FaUser, FaHospital, FaCalendarAlt, FaPhone, FaMapMarkerAlt, FaCheckCircle, FaClock, FaTimes, FaUserFriends } from 'react-icons/fa'
import { useRequester } from '../../context/RequesterContext'
import { getBloodRequestMatches } from '../../services/requesterService'
import RequesterNavbar from '../../components/Requester/RequesterNavbar'
import './RequestDetails.css'

const RequestDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, requests, cancelRequest } = useRequester()
  const [req, setReq] = useState(null)
  const [matches, setMatches] = useState(null)
  const [matchesError, setMatchesError] = useState('')

  useEffect(() => { if (!user) navigate('/requester/login') }, [user, navigate])

  useEffect(() => {
    const found = requests.find((r) => r.id === id)
    setReq(found || null)
  }, [id, requests])

  useEffect(() => {
    let active = true
    let timer
    const fetchMatches = async () => {
      try {
        const data = await getBloodRequestMatches(id)
        if (active) {
          setMatches(data)
          setMatchesError('')
        }
      } catch {
        if (active) setMatchesError('Unable to load matched donors right now.')
      }
    }

    fetchMatches()
    timer = setInterval(fetchMatches, 8000)
    return () => { active = false; clearInterval(timer) }
  }, [id])

  if (!user) return null
  if (!req) return (
    <div className="req-detail-page"><RequesterNavbar />
      <main className="req-detail-main"><div className="req-detail-container"><div className="req-detail-empty"><p>Request not found.</p><button onClick={() => navigate('/requester/history')}>Back to History</button></div></div></main>
    </div>
  )

  const displayTimeline = req.timeline?.map((step) => ({
    ...step,
    completed: step.step === 'notified' && matches?.length > 0
      ? true
      : step.step === 'accepted' && matches?.some((match) => match.status === 'accepted')
        ? true
        : step.completed,
    time: step.step === 'notified' && matches?.length > 0 && !step.time
      ? 'Donors matched and notified'
      : step.step === 'accepted' && matches?.some((match) => match.status === 'accepted') && !step.time
        ? 'A donor accepted this request'
        : step.time,
  })) || []
  const currentStep = displayTimeline.findIndex((t) => !t.completed)
  const progress = displayTimeline.length
    ? ((displayTimeline.filter((t) => t.completed).length / displayTimeline.length) * 100)
    : 0

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
              {displayTimeline.length > 0 && (
                <div className="req-detail-timeline">
                  {displayTimeline.map((step, i) => (
                    <div key={i} className={`req-detail-step ${step.completed ? 'req-detail-step--completed' : ''} ${i === currentStep ? 'req-detail-step--current' : ''}`}>
                      <div className="req-detail-step-marker">
                        <div className="req-detail-step-icon">{step.completed ? <FaCheckCircle /> : <FaClock />}</div>
                        {i < displayTimeline.length - 1 && <div className="req-detail-step-line"></div>}
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

              <div className="req-detail-card">
                <h3><FaUserFriends /> Matched Donors</h3>
                {matchesError && <p className="req-detail-matches-error">{matchesError}</p>}
                {!matchesError && matches && (
                  <p className="req-detail-matches-count">
                    Accepted donors: <strong>{matches[0]?.acceptedCount || 0}</strong> / {matches[0]?.maxAccepted || 5}
                  </p>
                )}
                {!matchesError && !matches && <p className="req-detail-matches-empty">Loading matched donors…</p>}
                {!matchesError && matches && matches.length === 0 && (
                  <p className="req-detail-matches-empty">
                    No nearby eligible donors found yet. Matching runs when the request includes a location.
                  </p>
                )}
                {!matchesError && matches && matches.length > 0 && (
                  <div className="req-detail-matches-list">
                    {matches.map((m) => (
                      <div key={m.donorId} className="req-detail-match">
                        <div className="req-detail-match-avatar">{m.fullName?.charAt(0) || 'D'}</div>
                        <div className="req-detail-match-info">
                          <strong>{m.fullName}</strong>
                          <span>{m.bloodGroup} &bull; {m.city || 'City N/A'}</span>
                          <span className="req-detail-match-distance">
                            <FaMapMarkerAlt /> {(m.distanceKm ?? 0).toFixed(1)} km away
                          </span>
                        </div>
                        <a className="req-detail-match-call" href={`tel:${m.phone}`}>
                          <FaPhone /> Call
                        </a>
                      </div>
                    ))}
                  </div>
                )}
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
