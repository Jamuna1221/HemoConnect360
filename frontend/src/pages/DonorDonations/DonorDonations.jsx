import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FaArrowLeft, FaCalendarAlt, FaCheckCircle, FaMapMarkerAlt, FaTint } from 'react-icons/fa'
import Navbar from '../../components/Navbar/Navbar'
import Footer from '../../components/Footer/Footer'
import { fetchDonorProfile, fetchDonationHistory, fetchDonorRequests } from '../../services/donorService'
import { getSupabase } from '../../lib/supabase'
import './DonorDonations.css'

const formatDate = (value) => value
  ? new Date(value).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
  : '—'

const getNextEligible = (lastDonation, gender) => {
  if (!lastDonation) return null
  const date = new Date(lastDonation)
  if (Number.isNaN(date.getTime())) return null
  date.setDate(date.getDate() + (String(gender).toLowerCase() === 'male' ? 90 : 120))
  return date
}

const DonorDonations = () => {
  const navigate = useNavigate()
  const [donor, setDonor] = useState(null)
  const [donations, setDonations] = useState([])
  const [requestHistory, setRequestHistory] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentTime] = useState(() => Date.now())

  useEffect(() => {
    const load = async () => {
      try {
        const supabase = getSupabase()
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user) { navigate('/donor/login', { replace: true }); return }
        const profile = await fetchDonorProfile(supabase, session.user.id)
        if (profile.error) throw profile.error
        setDonor(profile.donor)
        const [history, requests] = await Promise.all([fetchDonationHistory(), fetchDonorRequests()])
        setDonations(history)
        setRequestHistory(requests.filter((request) => ['declined', 'rejected', 'ineligible_after_donation'].includes(request.donorResponse)))
      } catch (err) {
        setError(err.message || 'Unable to load donation history.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [navigate])

  const totalUnits = donations.reduce((sum, donation) => sum + (Number(donation.units) || 0), 0)
  const nextEligible = donor && getNextEligible(donor.last_donation, donor.gender)
  const daysLeft = nextEligible
    ? Math.max(0, Math.ceil((nextEligible.getTime() - currentTime) / (1000 * 60 * 60 * 24)))
    : 0
  const historyItems = [
    ...donations.map((donation) => ({
      id: `donation-${donation.id}`,
      date: donation.donation_date,
      title: donation.blood_bank,
      city: donation.city,
      units: donation.units,
      notes: donation.notes,
      status: 'donated',
    })),
     ...requestHistory.map((request) => ({
       id: `request-${request.id}`,
       requestId: request.id,
      date: request.matchedAt || request.requiredBy,
      title: request.hospitalName,
      city: request.city,
      units: request.units,
      notes: request.donorResponse === 'declined'
        ? 'Accepted donor reported: blood was not donated'
        : request.donorResponse === 'ineligible_after_donation'
          ? 'Closed because the donor completed another donation'
          : 'Request rejected by donor',
      status: request.donorResponse === 'declined'
        ? 'not_donated'
        : request.donorResponse === 'ineligible_after_donation'
          ? 'ineligible'
          : 'rejected',
    })),
  ]
  const visibleHistory = historyItems.filter((item) => filter === 'all' || item.status === filter)

  return (
    <div className="donor-donations-page">
      <Navbar />
      <main className="donor-donations-main">
        <div className="donor-donations-container">
          <Link to="/donor/dashboard" className="donor-donations-back"><FaArrowLeft /> Dashboard</Link>
          <div className="donor-donations-heading">
            <div><span><FaTint /> Donor contribution</span><h1>Donation History</h1><p>Your completed donations determine your next eligible date.</p></div>
            <div className="donor-donations-total"><strong>{totalUnits}</strong><small>unit{totalUnits === 1 ? '' : 's'} donated</small></div>
          </div>

          {loading && <div className="donor-donations-state">Loading your donation history...</div>}
          {!loading && error && <div className="donor-donations-state donor-donations-state--error">{error}</div>}
          {!loading && !error && donor && (
            <>
              <section className={`donor-donations-eligibility ${daysLeft > 0 ? 'donor-donations-eligibility--waiting' : ''}`}>
                <div className="donor-donations-eligibility-icon"><FaCalendarAlt /></div>
                <div><span>Next eligible donation</span><strong>{nextEligible ? formatDate(nextEligible) : 'Eligible now'}</strong><small>{daysLeft > 0 ? `${daysLeft} day${daysLeft === 1 ? '' : 's'} remaining · ${donor.gender === 'female' ? '120' : '90'}-day interval` : 'You are currently eligible to donate'}</small></div>
              </section>
              <div className="donor-donations-filters" role="tablist" aria-label="Donation history filter">
                {[['all', 'All History'], ['donated', 'Donated: Yes'], ['not_donated', 'Donated: No'], ['rejected', 'Rejected Requests'], ['ineligible', 'Closed: Donor Ineligible']].map(([value, label]) => (
                  <button type="button" key={value} className={filter === value ? 'donor-donations-filter--active' : ''} onClick={() => setFilter(value)}>{label}</button>
                ))}
              </div>
              {visibleHistory.length === 0 ? (
                <div className="donor-donations-state">No records match this filter.</div>
              ) : (
                <div className="donor-donations-list">
                   {visibleHistory.map((item) => (
                     <article
                       className={`donor-donation-row donor-donation-row--${item.status} ${item.requestId ? 'donor-donation-row--clickable' : ''}`}
                       key={item.id}
                       onClick={item.requestId ? () => navigate(`/donor/requests/${item.requestId}`, { state: { from: '/donor/donations', historyStatus: item.status } }) : undefined}
                       onKeyDown={item.requestId ? (event) => {
                         if (event.key === 'Enter' || event.key === ' ') {
                           event.preventDefault()
                           navigate(`/donor/requests/${item.requestId}`, { state: { from: '/donor/donations', historyStatus: item.status } })
                         }
                       } : undefined}
                       role={item.requestId ? 'link' : undefined}
                       tabIndex={item.requestId ? 0 : undefined}
                     >
                      <div className="donor-donation-date"><strong>{new Date(item.date).getDate()}</strong><span>{new Date(item.date).toLocaleDateString('en-US', { month: 'short' })}</span></div>
                      <div className="donor-donation-info"><div><h2>{item.title}</h2><span><FaMapMarkerAlt /> {item.city || 'Location not provided'}</span></div><p>{item.units} unit{Number(item.units) === 1 ? '' : 's'} · {formatDate(item.date)}</p>{item.notes && <small>{item.notes}</small>}</div>
                      <span className={`donor-donation-status donor-donation-status--${item.status}`}>{item.status === 'donated' ? 'Donated: Yes' : item.status === 'not_donated' ? 'Donated: No' : item.status === 'ineligible' ? 'Donor Ineligible' : 'Rejected'}</span>
                    </article>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default DonorDonations
