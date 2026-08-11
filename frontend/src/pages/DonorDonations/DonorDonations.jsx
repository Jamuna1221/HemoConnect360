import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FaArrowLeft, FaCalendarAlt, FaCheckCircle, FaMapMarkerAlt, FaTint } from 'react-icons/fa'
import Navbar from '../../components/Navbar/Navbar'
import Footer from '../../components/Footer/Footer'
import { fetchDonorProfile, fetchDonationHistory } from '../../services/donorService'
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
        setDonations(await fetchDonationHistory())
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
              {donations.length === 0 ? (
                <div className="donor-donations-state">No completed donations recorded yet.</div>
              ) : (
                <div className="donor-donations-list">
                  {donations.map((donation) => (
                    <article className="donor-donation-row" key={donation.id}>
                      <div className="donor-donation-date"><strong>{new Date(donation.donation_date).getDate()}</strong><span>{new Date(donation.donation_date).toLocaleDateString('en-US', { month: 'short' })}</span></div>
                      <div className="donor-donation-info"><div><h2>{donation.blood_bank}</h2><span><FaMapMarkerAlt /> {donation.city || 'Location not provided'}</span></div><p>{donation.units} unit{Number(donation.units) === 1 ? '' : 's'} · {formatDate(donation.donation_date)}</p>{donation.notes && <small>{donation.notes}</small>}</div>
                      <FaCheckCircle className="donor-donation-check" />
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
