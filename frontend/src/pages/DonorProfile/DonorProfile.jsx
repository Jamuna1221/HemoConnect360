import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FaArrowLeft, FaCalendarAlt, FaEnvelope, FaHeartbeat, FaIdCard, FaMapMarkerAlt, FaPhone, FaTint, FaUser, FaWeight } from 'react-icons/fa'
import Navbar from '../../components/Navbar/Navbar'
import Footer from '../../components/Footer/Footer'
import { fetchDonorProfile } from '../../services/donorService'
import { getSupabase } from '../../lib/supabase'
import './DonorProfile.css'

const DonorProfile = () => {
  const navigate = useNavigate()
  const [donor, setDonor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const supabase = getSupabase()
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user) { navigate('/donor/login', { replace: true }); return }
        const result = await fetchDonorProfile(supabase, session.user.id)
        if (result.error) throw result.error
        setDonor(result.donor)
      } catch (err) {
        setError(err.message || 'Unable to load your profile.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [navigate])

  return (
    <div className="donor-profile-page">
      <Navbar />
      <main className="donor-profile-main">
        <div className="donor-profile-container">
          <Link to="/donor/dashboard" className="donor-profile-back"><FaArrowLeft /> Dashboard</Link>
          <h1>Donor Profile</h1>
          {loading && <div className="donor-profile-state">Loading profile...</div>}
          {!loading && error && <div className="donor-profile-state donor-profile-state--error">{error}</div>}
          {!loading && donor && (
            <>
              <section className="donor-profile-hero">
                <div className="donor-profile-avatar">{donor.full_name?.slice(0, 2).toUpperCase()}</div>
                <div><h2>{donor.full_name}</h2><p>{donor.blood_group} · {donor.status || 'active'} donor</p></div>
                <span className="donor-profile-id"><FaIdCard /> {donor.id?.slice(0, 8).toUpperCase()}</span>
              </section>
              <section className="donor-profile-grid">
                <div className="donor-profile-card"><FaEnvelope /><span>Email</span><strong>{donor.email || '—'}</strong></div>
                <div className="donor-profile-card"><FaPhone /><span>Phone</span><strong>{donor.phone || '—'}</strong></div>
                <div className="donor-profile-card"><FaMapMarkerAlt /><span>Location</span><strong>{donor.city || '—'}{donor.state ? `, ${donor.state}` : ''}</strong></div>
                <div className="donor-profile-card"><FaUser /><span>Gender</span><strong>{donor.gender || '—'}</strong></div>
                <div className="donor-profile-card"><FaWeight /><span>Weight</span><strong>{donor.weight ? `${donor.weight} kg` : '—'}</strong></div>
                <div className="donor-profile-card"><FaHeartbeat /><span>Hemoglobin</span><strong>{donor.hemoglobin ? `${donor.hemoglobin} g/dL` : '—'}</strong></div>
                <div className="donor-profile-card"><FaCalendarAlt /><span>Last Donation</span><strong>{donor.last_donation || 'Not yet donated'}</strong></div>
                <div className="donor-profile-card"><FaTint /><span>Blood Group</span><strong>{donor.blood_group}</strong></div>
              </section>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default DonorProfile
