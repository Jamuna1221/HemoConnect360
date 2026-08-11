import { useEffect, useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { FaHospital } from 'react-icons/fa'
import { fetchBloodBankProfile } from '../../services/bloodBankService'
import { getSupabase } from '../../lib/supabase'
import BloodBankSidebar from './BloodBankSidebar'
import BloodBankHeader from './BloodBankHeader'
import './BloodBankLayout.css'

const BloodBankLayout = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [profile, setProfile] = useState(location.state?.bloodBank || null)
  const [loading, setLoading] = useState(!profile)
  const [error, setError] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (profile) return
    let active = true

    const load = async () => {
      try {
        const { bloodBank } = await fetchBloodBankProfile()
        if (!active) return
        setProfile(bloodBank)
      } catch (err) {
        if (!active) return
        if (err.status === 401) {
          navigate('/blood-bank/login', { replace: true })
          return
        }
        setError(err.message || 'Unable to load your blood bank profile.')
      } finally {
        if (active) setLoading(false)
      }
    }

    load()

    return () => {
      active = false
    }
  }, [navigate, profile])

  const handleLogout = async () => {
    await getSupabase().auth.signOut().catch(() => {})
    navigate('/blood-bank/login', { replace: true })
  }

  if (loading) {
    return (
      <div className="bloodbank-layout-state">
        <div>
          <div className="bloodbank-layout-spinner" />
          <p>Loading your blood bank portal...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bloodbank-layout-state">
        <div className="bloodbank-layout-state-card">
          <div className="bloodbank-layout-state-icon"><FaHospital /></div>
          <h2>Unable to Load Profile</h2>
          <p>{error}</p>
          <Link to="/blood-bank/login" className="bloodbank-layout-btn">Go to Login</Link>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="bloodbank-layout-state">
        <div className="bloodbank-layout-state-card">
          <div className="bloodbank-layout-state-icon"><FaHospital /></div>
          <h2>No Blood Bank Profile</h2>
          <p>No blood bank profile was found for this account. Please register your blood bank first.</p>
          <Link to="/blood-bank/register" className="bloodbank-layout-btn">Register Blood Bank</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="bloodbank-layout">
      <BloodBankSidebar
        profile={profile}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={handleLogout}
      />
      <div className="bloodbank-layout-main">
        <BloodBankHeader profile={profile} onMenuClick={() => setSidebarOpen(true)} />
        <main className="bloodbank-layout-content">
          <Outlet context={{ bloodBank: profile }} />
        </main>
      </div>
    </div>
  )
}

export default BloodBankLayout
