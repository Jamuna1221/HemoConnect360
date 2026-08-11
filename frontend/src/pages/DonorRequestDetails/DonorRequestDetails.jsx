import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { FaArrowLeft, FaCalendarAlt, FaCheckCircle, FaClipboardCheck, FaHospital, FaPhone, FaTimes, FaTint, FaUsers } from 'react-icons/fa'
import Navbar from '../../components/Navbar/Navbar'
import Footer from '../../components/Footer/Footer'
import { acceptDonorRequest, fetchDonorRequests, recordDonorOutcome, rejectDonorRequest } from '../../services/donorService'
import './DonorRequestDetails.css'

const DonorRequestDetails = () => {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const [request, setRequest] = useState(null)
  const [loading, setLoading] = useState(true)
  const [working, setWorking] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadRequest = async () => {
      try {
        const requests = await fetchDonorRequests()
        setRequest(requests.find((item) => item.id === id) || null)
      } catch (err) {
        setError(err.message || 'Unable to load this request.')
      } finally {
        setLoading(false)
      }
    }

    loadRequest()
  }, [id])

  const response = location.state?.historyStatus === 'ineligible'
    ? 'ineligible_after_donation'
    : location.state?.historyStatus === 'not_donated'
      ? 'declined'
      : location.state?.historyStatus === 'rejected'
        ? 'rejected'
        : request?.donorResponse

  const activity = request ? [
    request.matchedAt && { label: 'Request matched to you', date: request.matchedAt, tone: 'complete' },
    ['accepted', 'donated', 'declined'].includes(response) && { label: response === 'accepted' ? 'You accepted this request' : response === 'donated' ? 'Blood donation completed' : 'You reported that blood was not donated', date: request.matchedAt, tone: response === 'declined' ? 'closed' : 'complete' },
    response === 'rejected' && { label: 'You rejected this request', date: request.matchedAt, tone: 'closed' },
    response === 'ineligible_after_donation' && { label: 'Closed because you completed another donation', date: request.matchedAt, tone: 'closed' },
  ].filter(Boolean) : []

  const respond = async (action) => {
    setWorking(true)
    setError('')
    try {
      const result = action === 'accept' ? await acceptDonorRequest(id) : await rejectDonorRequest(id)
      setRequest((current) => ({
        ...current,
        donorResponse: action === 'accept' ? 'accepted' : 'rejected',
        acceptedCount: result?.accepted_count ?? current.acceptedCount,
      }))
    } catch (err) {
      setError(err.message || 'Unable to update your response.')
    } finally {
      setWorking(false)
    }
  }

  const recordOutcome = async (donated) => {
    setWorking(true)
    setError('')
    try {
      const result = await recordDonorOutcome(id, donated)
      setRequest((current) => ({
        ...current,
        donorResponse: donated ? 'donated' : 'declined',
        requestStatus: donated ? 'completed' : current.requestStatus,
        acceptedCount: result?.accepted_count ?? current.acceptedCount,
      }))
    } catch (err) {
      setError(err.message || 'Unable to record the donation outcome.')
    } finally {
      setWorking(false)
    }
  }

  return (
    <div className="donor-request-detail-page">
      <Navbar />
      <main className="donor-request-detail-main">
        <div className="donor-request-detail-container">
          <button type="button" className="donor-request-detail-back" onClick={() => navigate(location.state?.from || '/donor/requests')}><FaArrowLeft /> {location.state?.from === '/donor/donations' ? 'Donation History' : 'All Requests'}</button>
          {loading && <div className="donor-request-detail-state">Loading request...</div>}
          {!loading && !request && <div className="donor-request-detail-state">This request is no longer available to you.</div>}
          {!loading && request && (
            <>
              <div className={`donor-request-detail-hero donor-request-detail-hero--${request.priority}`}>
                <div>
                  <span className="donor-request-detail-badge"><FaTint /> Potentially Compatible</span>
                  <h1>{request.hospitalName}</h1>
                  <p>{request.priority} blood request · {request.bloodGroup} · {request.units} unit(s)</p>
                </div>
                <FaHospital />
              </div>
              {error && <div className="donor-request-detail-error">{error}</div>}
              <div className="donor-request-detail-grid">
                <section className="donor-request-detail-card">
                  <h2><FaTint /> Patient Details</h2>
                  <p><strong>Name:</strong> {request.patientName || '—'}</p>
                  <p><strong>Age:</strong> {request.patientAge || '—'}</p>
                  <p><strong>Gender:</strong> {request.patientGender || '—'}</p>
                  <p><strong>Blood group:</strong> {request.bloodGroup}</p>
                  <p><strong>Units required:</strong> {request.units}</p>
                </section>
                <section className="donor-request-detail-card donor-request-detail-activity">
                  <h2><FaClipboardCheck /> Your Donor Activity</h2>
                  {activity.length === 0 ? <p>No response activity recorded yet.</p> : (
                    <div className="donor-request-detail-timeline">
                      {activity.map((event, index) => (
                        <div className={`donor-request-detail-event donor-request-detail-event--${event.tone}`} key={`${event.label}-${index}`}>
                          <span className="donor-request-detail-event-dot" />
                          <div><strong>{event.label}</strong><small>{event.date ? new Date(event.date).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : 'Date not available'}</small></div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
                <section className="donor-request-detail-card">
                  <h2><FaHospital /> Hospital Details</h2>
                  <p><strong>Hospital:</strong> {request.hospitalName}</p>
                  <p><strong>City:</strong> {request.city || '—'}</p>
                  <p><strong>Address:</strong> {request.address || '—'}</p>
                  <p><strong>Distance:</strong> {request.distanceKm ?? '—'} km</p>
                  <p><strong>Distance tier:</strong> {request.distanceBand || '—'}</p>
                  <p><strong>Required by:</strong> <FaCalendarAlt /> {request.requiredBy || 'Immediate'}</p>
                  <p><strong>Contact:</strong> <FaPhone /> {request.contactName || '—'} · {request.contactPhone || '—'}</p>
                  {request.notes && <p><strong>Notes:</strong> {request.notes}</p>}
                </section>
                <section className="donor-request-detail-card">
                  <h2><FaUsers /> Donor Responses</h2>
                  <div className="donor-request-detail-count">{request.acceptedCount || 0} / {request.maxAccepted || 5}</div>
                  <p>Donors accepted this request.</p>
                  <p className="donor-request-detail-note">A maximum of five donors can accept one request.</p>
                </section>
              </div>
              <section className="donor-request-detail-card donor-request-detail-response">
                <p className="donor-request-detail-disclaimer">This is a potential match based on blood group, donation interval, and distance. Final compatibility must be confirmed by the blood bank.</p>
                {response === 'accepted' ? (
                  <>
                    <div className="donor-request-detail-status donor-request-detail-status--accepted"><FaCheckCircle /> You accepted this request. Did the blood bank complete the donation?</div>
                    <div className="donor-request-detail-actions">
                      <button type="button" className="donor-request-detail-accept" onClick={() => recordOutcome(true)} disabled={working}><FaCheckCircle /> Blood Donated: Yes</button>
                      <button type="button" className="donor-request-detail-reject" onClick={() => recordOutcome(false)} disabled={working}><FaTimes /> Blood Donated: No</button>
                    </div>
                  </>
                ) : response === 'donated' ? (
                  <div className="donor-request-detail-status donor-request-detail-status--accepted"><FaCheckCircle /> Blood donated. Request completed.</div>
                ) : response === 'rejected' ? (
                  <div className="donor-request-detail-status donor-request-detail-status--rejected"><FaTimes /> You rejected this request.</div>
                ) : response === 'declined' ? (
                  <div className="donor-request-detail-status donor-request-detail-status--rejected"><FaTimes /> You reported that the blood was not donated. The slot is available again.</div>
                ) : response === 'ineligible_after_donation' ? (
                  <div className="donor-request-detail-status donor-request-detail-status--rejected"><FaTimes /> This request was closed because you completed another donation. No response is required.</div>
                ) : (
                  <div className="donor-request-detail-actions">
                    <button type="button" className="donor-request-detail-accept" onClick={() => respond('accept')} disabled={working || request.acceptedCount >= request.maxAccepted}>
                      <FaCheckCircle /> {request.acceptedCount >= request.maxAccepted ? 'Acceptance Limit Reached' : 'Accept Request'}
                    </button>
                    <button type="button" className="donor-request-detail-reject" onClick={() => respond('reject')} disabled={working}><FaTimes /> Reject</button>
                  </div>
                )}
              </section>
            </>
          )}
          <Link to="/donor/dashboard" className="donor-request-detail-dashboard">Back to Dashboard</Link>
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default DonorRequestDetails
