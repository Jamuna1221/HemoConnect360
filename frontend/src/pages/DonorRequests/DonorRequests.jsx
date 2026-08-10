import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FaArrowLeft, FaCalendarAlt, FaHospital, FaMapMarkerAlt, FaTint, FaUsers } from 'react-icons/fa'
import Navbar from '../../components/Navbar/Navbar'
import Footer from '../../components/Footer/Footer'
import { fetchDonorRequests } from '../../services/donorService'
import './DonorRequests.css'

const DonorRequests = () => {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    fetchDonorRequests()
      .then((data) => { if (active) setRequests(data) })
      .catch((err) => { if (active) setError(err.message || 'Unable to load requests.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  return (
    <div className="donor-requests-page">
      <Navbar />
      <main className="donor-requests-main">
        <div className="donor-requests-container">
          <Link to="/donor/dashboard" className="donor-requests-back"><FaArrowLeft /> Dashboard</Link>
          <div className="donor-requests-heading">
            <div>
              <span className="donor-requests-eyebrow"><FaUsers /> Donor Network</span>
              <h1>Blood Requests For You</h1>
              <p>These requests passed blood-group, donation-interval, and location checks.</p>
            </div>
            <FaTint className="donor-requests-heading-icon" />
          </div>

          {loading && <div className="donor-requests-state">Loading eligible requests...</div>}
          {!loading && error && <div className="donor-requests-state donor-requests-state--error">{error}</div>}
          {!loading && !error && requests.length === 0 && (
            <div className="donor-requests-state">No eligible blood requests are available right now.</div>
          )}
          {!loading && !error && requests.length > 0 && (
            <div className="donor-requests-grid">
              {requests.map((request) => (
                <Link
                  to={`/donor/requests/${request.id}`}
                  key={request.id}
                  className={`donor-request-card donor-request-card--${request.priority}`}
                >
                  <div className="donor-request-card-top">
                    <span className="donor-request-blood"><FaTint /> {request.bloodGroup}</span>
                    <span className="donor-request-priority">{request.priority}</span>
                  </div>
                  <h2>{request.hospitalName}</h2>
                  <p className="donor-request-location"><FaMapMarkerAlt /> {request.city || 'Location unavailable'}</p>
                  <div className="donor-request-meta">
                    <span><FaCalendarAlt /> {request.requiredBy || 'Immediate'}</span>
                    <span><FaMapMarkerAlt /> {request.distanceKm ?? '—'} km</span>
                  </div>
                  <div className="donor-request-footer">
                    <span><FaUsers /> {request.acceptedCount || 0}/{request.maxAccepted || 5} accepted</span>
                    <span>{request.donorResponse === 'accepted' ? 'Accepted' : 'View details'}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default DonorRequests
