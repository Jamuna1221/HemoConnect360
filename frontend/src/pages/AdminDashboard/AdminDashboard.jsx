import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getSupabase } from '../../lib/supabase'
import {
  FaSignOutAlt,
  FaUsers,
  FaHeartbeat,
  FaShieldAlt,
  FaTint,
  FaHospital,
  FaDatabase,
  FaIdCard,
  FaExclamationTriangle,
  FaChartBar,
  FaBroadcastTower,
  FaHistory,
  FaUserCog
} from 'react-icons/fa'
import './AdminDashboard.css'

// Modular tab components
import DashboardOverview from './components/DashboardOverview'
import DonorManagement from './components/DonorManagement'
import RequesterManagement from './components/RequesterManagement'
import BloodRequests from './components/BloodRequests'
import BloodBankManagement from './components/BloodBankManagement'
import BloodStock from './components/BloodStock'
import VerificationCenter from './components/VerificationCenter'
import SecurityPanel from './components/SecurityPanel'
import ReportsAnalytics from './components/ReportsAnalytics'
import NotificationsCenter from './components/NotificationsCenter'
import AuditLogsPanel from './components/AuditLogsPanel'
import AdminProfile from './components/AdminProfile'

const AdminDashboard = () => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [searchQuery, setSearchQuery] = useState('')
  const [bloodFilter, setBloodFilter] = useState('all')

  // Datasets state
  const [donors, setDonors] = useState([])
  const [requesters, setRequesters] = useState([])
  const [requests, setRequests] = useState([])
  const [bloodBanks, setBloodBanks] = useState(() => {
    const local = localStorage.getItem('admin_blood_banks')
    if (local) return JSON.parse(local)
    return [
      { id: 'BB-1', name: 'Chennai Central Blood Bank', city: 'Chennai', phone: '044-28340101', email: 'chennaibb@gmail.com', verificationStatus: 'verified', availableUnits: 119, accountStatus: 'active', stock: [
        { group: 'A+', available: 25, reserved: 4 },
        { group: 'A-', available: 8, reserved: 2 },
        { group: 'B+', available: 18, reserved: 5 },
        { group: 'B-', available: 3, reserved: 1 },
        { group: 'O+', available: 35, reserved: 8 },
        { group: 'O-', available: 12, reserved: 3 },
        { group: 'AB+', available: 16, reserved: 2 },
        { group: 'AB-', available: 2, reserved: 0 },
      ]},
      { id: 'BB-2', name: 'Mumbai Red Cross', city: 'Mumbai', phone: '022-26450202', email: 'mumbaibb@gmail.com', verificationStatus: 'verified', availableUnits: 154, accountStatus: 'active', stock: [
        { group: 'A+', available: 30, reserved: 6 },
        { group: 'A-', available: 12, reserved: 3 },
        { group: 'B+', available: 22, reserved: 4 },
        { group: 'B-', available: 5, reserved: 1 },
        { group: 'O+', available: 40, reserved: 10 },
        { group: 'O-', available: 15, reserved: 4 },
        { group: 'AB+', available: 26, reserved: 3 },
        { group: 'AB-', available: 4, reserved: 1 },
      ]},
      { id: 'BB-3', name: 'Delhi Lions Blood Center', city: 'Delhi', phone: '011-25360303', email: 'delhibb@gmail.com', verificationStatus: 'pending', availableUnits: 72, accountStatus: 'active', stock: [
        { group: 'A+', available: 15, reserved: 2 },
        { group: 'A-', available: 4, reserved: 1 },
        { group: 'B+', available: 10, reserved: 2 },
        { group: 'B-', available: 1, reserved: 0 },
        { group: 'O+', available: 20, reserved: 5 },
        { group: 'O-', available: 6, reserved: 1 },
        { group: 'AB+', available: 15, reserved: 1 },
        { group: 'AB-', available: 1, reserved: 0 },
      ]},
    ]
  })
  const [verifications, setVerifications] = useState([])
  const [securityAlerts, setSecurityAlerts] = useState([])
  const [notifications, setNotifications] = useState([])
  const [auditLogs, setAuditLogs] = useState(() => {
    const local = localStorage.getItem('admin_audit_logs')
    if (local) return JSON.parse(local)
    return [
      { id: 'L-1', admin: 'admin@hemoconnect360.com', action: 'Donor Approval', target: 'Sneha Patel', description: 'Approved donor verification documents', timestamp: '2026-08-10', status: 'Success' },
      { id: 'L-2', admin: 'admin@hemoconnect360.com', action: 'User Suspension', target: 'Vikram Singh', description: 'Suspended donor account due to inactivity', timestamp: '2026-08-10', status: 'Success' },
      { id: 'L-3', admin: 'admin@hemoconnect360.com', action: 'Blood Bank Verification', target: 'Chennai Central Blood Bank', description: 'Verified credentials and partner authorization', timestamp: '2026-08-09', status: 'Success' },
      { id: 'L-4', admin: 'admin@hemoconnect360.com', action: 'Blood Request Rejection', target: 'REQ-05', description: 'Rejected request due to missing prescription details', timestamp: '2026-08-08', status: 'Failed' },
    ]
  })

  // Profile Form State
  const [profileForm, setProfileForm] = useState({ name: 'System Admin', email: 'admin@hemoconnect360.com', currentPassword: '', newPassword: '' })
  const [profileMsg, setProfileMsg] = useState('')

  // Broadcast Alert Form State
  const [alertForm, setAlertForm] = useState({ targetGroup: 'all', targetCity: '', message: '' })
  const [broadcastMsg, setBroadcastMsg] = useState('')

  useEffect(() => {
    const session = localStorage.getItem('admin_session')
    if (!session) {
      navigate('/admin/login', { replace: true })
      return
    }

    const fetchData = async () => {
      try {
        const supabase = getSupabase()

        // 1. Fetch Donors from Database
        const { data: donorData, error: donorErr } = await supabase
          .from('donors')
          .select('*')

        if (donorErr) console.error('[admin] Error fetching donors:', donorErr)
        else if (donorData) {
          setDonors(donorData.map(d => ({
            id: d.id,
            fullName: d.full_name,
            bloodGroup: d.blood_group,
            phone: d.phone,
            city: d.city,
            email: d.email || '',
            status: d.status || 'active'
          })))
        }

        // 2. Fetch Blood Requests from Database
        const { data: requestData, error: requestErr } = await supabase
          .from('blood_requests')
          .select('*')

        if (requestErr) console.error('[admin] Error fetching blood requests:', requestErr)
        else if (requestData) {
          setRequests(requestData.map(r => ({
            id: r.id,
            patientName: r.patient_name || 'Anonymous',
            bloodGroup: r.blood_group,
            units: r.units_required,
            city: r.city,
            status: r.status,
            priority: r.priority || 'normal',
            hospitalName: r.hospital_name || 'N/A'
          })))
        }

        // 3. Fetch Requesters (users table with role='requester')
        const { data: requesterData, error: reqErr } = await supabase
          .from('users')
          .select('*')
          .eq('role', 'requester')

        if (reqErr) console.error('[admin] Error fetching requesters:', reqErr)
        else if (requesterData) {
          setRequesters(requesterData.map(r => {
            const activeCount = requestData 
              ? requestData.filter(req => req.requester_id === r.id && req.status !== 'completed' && req.status !== 'cancelled').length 
              : 0
            return {
              id: r.id,
              fullName: r.full_name || 'Anonymous Requester',
              phone: r.phone,
              city: r.city || 'N/A',
              email: r.email || '',
              activeRequests: activeCount,
              status: 'active'
            }
          }))
        }

      } catch (err) {
        console.error('[admin] Failed to fetch database records:', err)
      }
    }

    fetchData()
  }, [navigate])

  useEffect(() => {
    localStorage.setItem('admin_blood_banks', JSON.stringify(bloodBanks))
  }, [bloodBanks])

  useEffect(() => {
    localStorage.setItem('admin_audit_logs', JSON.stringify(auditLogs))
  }, [auditLogs])



  const handleLogout = () => {
    localStorage.removeItem('admin_session')
    navigate('/admin/login', { replace: true })
  }

  // Toggle Donor Status
  const toggleDonorStatus = (id) => {
    const updated = donors.map(d => {
      if (d.id === id) {
        const nextStatus = d.status === 'active' ? 'suspended' : 'active'
        const logAction = nextStatus === 'active' ? 'User Activation' : 'User Suspension'
        const desc = `${nextStatus === 'active' ? 'Activated' : 'Suspended'} donor account: ${d.fullName}`
        setAuditLogs(prev => [{ id: `L-${Date.now()}`, admin: profileForm.email, action: logAction, target: d.fullName, description: desc, timestamp: new Date().toISOString().split('T')[0], status: 'Success' }, ...prev])
        return { ...d, status: nextStatus }
      }
      return d
    })
    setDonors(updated)
  }

  // Toggle Requester Status
  const toggleRequesterStatus = (id) => {
    const updated = requesters.map(r => {
      if (r.id === id) {
        const nextStatus = r.status === 'active' ? 'flagged' : 'active'
        const logAction = nextStatus === 'active' ? 'User Activation' : 'User Suspension'
        const desc = `${nextStatus === 'active' ? 'Cleared' : 'Flagged'} requester account: ${r.fullName}`
        setAuditLogs(prev => [{ id: `L-${Date.now()}`, admin: profileForm.email, action: logAction, target: r.fullName, description: desc, timestamp: new Date().toISOString().split('T')[0], status: 'Success' }, ...prev])
        return { ...r, status: nextStatus }
      }
      return r
    })
    setRequesters(updated)
  }

  // Handle Verification Actions
  const handleVerification = (id, approve) => {
    const target = verifications.find(v => v.id === id)
    if (!target) return
    const logAction = approve ? 'Donor Approval' : 'Donor Rejection'
    const desc = `${approve ? 'Approved' : 'Rejected'} verification document for donor: ${target.donorName}`
    setAuditLogs(prev => [{ id: `L-${Date.now()}`, admin: profileForm.email, action: logAction, target: target.donorName, description: desc, timestamp: new Date().toISOString().split('T')[0], status: 'Success' }, ...prev])

    setVerifications(prev => prev.filter(v => v.id !== id))
  }

  // Handle Security Action (Resolve Alert)
  const handleResolveAlert = (id) => {
    const target = securityAlerts.find(s => s.id === id)
    if (!target) return
    const logAction = 'Resolve Security Threat'
    const desc = `Resolved flagged alert: ${target.type} for user ${target.user}`
    setAuditLogs(prev => [{ id: `L-${Date.now()}`, admin: profileForm.email, action: logAction, target: target.user, description: desc, timestamp: new Date().toISOString().split('T')[0], status: 'Success' }, ...prev])

    setSecurityAlerts(prev => prev.map(s => s.id === id ? { ...s, status: 'resolved' } : s))
  }

  // Handle Verify Bank Actions
  const handleVerifyBank = (id, verifyStatus) => {
    const updated = bloodBanks.map(b => {
      if (b.id === id) {
        const logAction = 'Blood Bank Verification'
        const desc = `Verified blood bank ${b.name} as ${verifyStatus}`
        setAuditLogs(prev => [{ id: `L-${Date.now()}`, admin: profileForm.email, action: logAction, target: b.name, description: desc, timestamp: new Date().toISOString().split('T')[0], status: 'Success' }, ...prev])
        return { ...b, verificationStatus: verifyStatus }
      }
      return b
    })
    setBloodBanks(updated)
  }

  // Handle Toggle Bank Account Status
  const handleToggleBankStatus = (id) => {
    const updated = bloodBanks.map(b => {
      if (b.id === id) {
        const nextStatus = b.accountStatus === 'active' ? 'deactivated' : 'active'
        const logAction = nextStatus === 'active' ? 'Blood Bank Activation' : 'Blood Bank Deactivation'
        const desc = `${nextStatus === 'active' ? 'Activated' : 'Deactivated'} blood bank account: ${b.name}`
        setAuditLogs(prev => [{ id: `L-${Date.now()}`, admin: profileForm.email, action: logAction, target: b.name, description: desc, timestamp: new Date().toISOString().split('T')[0], status: 'Success' }, ...prev])
        return { ...b, accountStatus: nextStatus }
      }
      return b
    })
    setBloodBanks(updated)
  }

  // Handle Stock Update per Blood Bank
  const handleStockUpdate = (bankId, group, type, change) => {
    setBloodBanks(prev => prev.map(b => {
      if (b.id === bankId) {
        const updatedStock = b.stock.map(s => {
          if (s.group === group) {
            const currentVal = s[type] || 0
            const newVal = Math.max(0, currentVal + change)
            return { ...s, [type]: newVal }
          }
          return s
        })
        const newAvailableUnits = updatedStock.reduce((acc, curr) => acc + curr.available, 0)
        return { ...b, stock: updatedStock, availableUnits: newAvailableUnits }
      }
      return b
    }))
  }

  // Handle Send Broadcast Alert
  const handleSendBroadcast = (e) => {
    e.preventDefault()
    if (!alertForm.message.trim() || !alertForm.targetCity.trim()) {
      setBroadcastMsg('Please fill in target city and message content.')
      return
    }

    const newNotification = {
      id: `N-${Date.now()}`,
      targetGroup: alertForm.targetGroup,
      targetCity: alertForm.targetCity,
      message: alertForm.message,
      sentAt: new Date().toLocaleString()
    }

    setNotifications(prev => [newNotification, ...prev])
    setAuditLogs(prev => [{
      id: `L-${Date.now()}`,
      admin: profileForm.email,
      action: 'Emergency Alert Broadcast',
      target: `${alertForm.targetGroup} / ${alertForm.targetCity}`,
      description: `Emergency blood request broadcasted to ${alertForm.targetGroup} donors in ${alertForm.targetCity}`,
      timestamp: new Date().toISOString().split('T')[0],
      status: 'Success'
    }, ...prev])

    setAlertForm({ targetGroup: 'all', targetCity: '', message: '' })
    setBroadcastMsg('Emergency alert broadcasted successfully!')
    setTimeout(() => setBroadcastMsg(''), 3000)
  }

  // Save Settings Form
  const handleSaveProfile = (e) => {
    e.preventDefault()
    setProfileMsg('Settings and credentials updated successfully!')
    setTimeout(() => setProfileMsg(''), 3000)
  }

  // Helper to change tab reset filters
  const navigateTab = (tabName) => {
    setActiveTab(tabName)
    setSearchQuery('')
    setBloodFilter('all')
  }

  return (
    <div className="admin-dashboard-page">
      {/* Sidebar navigation */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-brand">
          <div className="admin-logo">
            <FaShieldAlt />
          </div>
          <div>
            <h3>HemoConnect360</h3>
            <span>Control Panel</span>
          </div>
        </div>

        <nav className="admin-sidebar-nav">
          <button className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => navigateTab('dashboard')}><FaDatabase /> Dashboard</button>
          <button className={`nav-item ${activeTab === 'donors' ? 'active' : ''}`} onClick={() => navigateTab('donors')}><FaUsers /> Donor Management</button>
          <button className={`nav-item ${activeTab === 'requesters' ? 'active' : ''}`} onClick={() => navigateTab('requesters')}><FaUsers /> Requester Management</button>
          <button className={`nav-item ${activeTab === 'requests' ? 'active' : ''}`} onClick={() => navigateTab('requests')}><FaHeartbeat /> Blood Requests</button>
          <button className={`nav-item ${activeTab === 'banks' ? 'active' : ''}`} onClick={() => navigateTab('banks')}><FaHospital /> Blood Bank Management</button>
          <button className={`nav-item ${activeTab === 'stock' ? 'active' : ''}`} onClick={() => navigateTab('stock')}><FaTint /> Blood Stock</button>
          <button className={`nav-item ${activeTab === 'verification' ? 'active' : ''}`} onClick={() => navigateTab('verification')}><FaIdCard /> Verification</button>
          <button className={`nav-item ${activeTab === 'security' ? 'active' : ''}`} onClick={() => navigateTab('security')}><FaExclamationTriangle /> Security</button>
          <button className={`nav-item ${activeTab === 'reports' ? 'active' : ''}`} onClick={() => navigateTab('reports')}><FaChartBar /> Reports</button>
          <button className={`nav-item ${activeTab === 'notifications' ? 'active' : ''}`} onClick={() => navigateTab('notifications')}><FaBroadcastTower /> Notifications</button>
          <button className={`nav-item ${activeTab === 'audit' ? 'active' : ''}`} onClick={() => navigateTab('audit')}><FaHistory /> Audit Logs</button>
          <button className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => navigateTab('profile')}><FaUserCog /> Profile</button>
        </nav>

        <button className="admin-logout-btn" onClick={handleLogout}>
          <FaSignOutAlt /> Sign Out
        </button>
      </aside>

      {/* Main content pane */}
      <main className="admin-main">
        <header className="admin-header">
          <h1>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Control Panel</h1>
          <span className="admin-current-user">Logged in: {profileForm.email}</span>
        </header>

        {/* Tab Panel Content */}
        {activeTab === 'dashboard' && (
          <DashboardOverview
            donors={donors}
            requesters={requesters}
            requests={requests}
            bloodBanks={bloodBanks}
            stock={[]}
            auditLogs={auditLogs}
            onNavigateTab={navigateTab}
          />
        )}

        {activeTab === 'donors' && (
          <DonorManagement
            donors={donors}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            bloodFilter={bloodFilter}
            setBloodFilter={setBloodFilter}
            onToggleStatus={toggleDonorStatus}
          />
        )}

        {activeTab === 'requesters' && (
          <RequesterManagement
            requesters={requesters}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onToggleStatus={toggleRequesterStatus}
          />
        )}

        {activeTab === 'requests' && (
          <BloodRequests
            requests={requests}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            bloodFilter={bloodFilter}
            setBloodFilter={setBloodFilter}
          />
        )}

        {activeTab === 'banks' && (
          <BloodBankManagement
            bloodBanks={bloodBanks}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onVerify={handleVerifyBank}
            onToggleStatus={handleToggleBankStatus}
          />
        )}

        {activeTab === 'stock' && (
          <BloodStock
            bloodBanks={bloodBanks}
            onStockUpdate={handleStockUpdate}
          />
        )}

        {activeTab === 'verification' && (
          <VerificationCenter
            verifications={verifications}
            onVerify={handleVerification}
          />
        )}

        {activeTab === 'security' && (
          <SecurityPanel
            alerts={securityAlerts}
            onResolve={handleResolveAlert}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsAnalytics />
        )}

        {activeTab === 'notifications' && (
          <NotificationsCenter
            notifications={notifications}
            alertForm={alertForm}
            setAlertForm={setAlertForm}
            broadcastMsg={broadcastMsg}
            onSendBroadcast={handleSendBroadcast}
          />
        )}

        {activeTab === 'audit' && (
          <AuditLogsPanel
            auditLogs={auditLogs}
          />
        )}

        {activeTab === 'profile' && (
          <AdminProfile
            profileForm={profileForm}
            setProfileForm={setProfileForm}
            profileMsg={profileMsg}
            onSaveProfile={handleSaveProfile}
          />
        )}
      </main>
    </div>
  )
}

export default AdminDashboard
