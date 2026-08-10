import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { FaArrowLeft, FaCalendarAlt, FaCheckCircle, FaHospital, FaMapMarkerAlt, FaPhone, FaTimes, FaTint, FaUsers } from 'react-icons/fa'
import Navbar from '../../components/Navbar/Navbar'
import Footer from '../../components/Footer/Footer'
import { acceptDonorRequest, fetchDonorRequests, recordDonorOutcome, rejectDonorRequest } from '../../services/donorService'
import './DonorRequestDetails.css'

const DonorRequestDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [request, setRequest] = useState(null)
  const [loading, setLoading] = useState(true)
  const [working, setWorking] = useState(false)
  const [error, setError] = useState('')

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

  useEffect(() => { loadRequest() }, [id])

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
          <button type="button" className="donor-request-detail-back" onClick={() => navigate('/donor/requests')}><FaArrowLeft /> All Requests</button>
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
                {request.donorResponse === 'accepted' ? (
                  <>
                    <div className="donor-request-detail-status donor-request-detail-status--accepted"><FaCheckCircle /> You accepted this request. Did the blood bank complete the donation?</div>
                    <div className="donor-request-detail-actions">
                      <button type="button" className="donor-request-detail-accept" onClick={() => recordOutcome(true)} disabled={working}><FaCheckCircle /> Blood Donated: Yes</button>
                      <button type="button" className="donor-request-detail-reject" onClick={() => recordOutcome(false)} disabled={working}><FaTimes /> Blood Donated: No</button>
                    </div>
                  </>
                ) : request.donorResponse === 'donated' ? (
                  <div className="donor-request-detail-status donor-request-detail-status--accepted"><FaCheckCircle /> Blood donated. Request completed.</div>
                ) : request.donorResponse === 'rejected' ? (
                  <div className="donor-request-detail-status donor-request-detail-status--rejected"><FaTimes /> You rejected this request.</div>
                ) : request.donorResponse === 'declined' ? (
                  <div className="donor-request-detail-status donor-request-detail-status--rejected"><FaTimes /> You reported that the blood was not donated. The slot is available again.</div>
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
