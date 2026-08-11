import { useState, useEffect, useCallback } from 'react'
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

import {
  getAdminEmail,
  fetchAdminOverview,
  fetchAdminVerification,
  approveVerification,
  rejectVerification,
  requestReverification,
  fetchSecurityFlags,
  applySecurityAction,
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  publishAnnouncement,
  fetchAuditLogs,
  fetchAdminProfile,
  updateAdminProfile,
  changeAdminPassword,
  fetchAllBloodBanks,
  verifyBloodBank,
} from '../../services/adminService'

const AdminDashboard = () => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [searchQuery, setSearchQuery] = useState('')
  const [bloodFilter, setBloodFilter] = useState('all')
  const [confirmLogout, setConfirmLogout] = useState(false)
  const [errorBanner, setErrorBanner] = useState('')

  // Datasets state (existing sections)
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

  // Admin API state (upgraded sections)
  const [overview, setOverview] = useState(null)
  const [overviewLoading, setOverviewLoading] = useState(false)
  const [overviewError, setOverviewError] = useState('')

  const [verificationData, setVerificationData] = useState(null)
  const [verificationLoading, setVerificationLoading] = useState(false)
  const [verificationError, setVerificationError] = useState('')

  const [securityData, setSecurityData] = useState(null)
  const [securityLoading, setSecurityLoading] = useState(false)
  const [securityError, setSecurityError] = useState('')

  const [notificationsData, setNotificationsData] = useState(null)
  const [notificationsLoading, setNotificationsLoading] = useState(false)
  const [notificationsError, setNotificationsError] = useState('')

  const [auditData, setAuditData] = useState(null)
  const [auditLoading, setAuditLoading] = useState(false)
  const [auditError, setAuditError] = useState('')

  const [profileData, setProfileData] = useState(null)
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileError, setProfileError] = useState('')

  const adminEmail = getAdminEmail()

  const runWithBanner = async (fn) => {
    try {
      await fn()
      return true
    } catch (err) {
      setErrorBanner(err?.message || 'Something went wrong. Please try again.')
      setTimeout(() => setErrorBanner(''), 4000)
      return false
    }
  }

  // Data loaders
  const loadOverview = useCallback(async () => {
    await Promise.resolve()
    setOverviewLoading(true)
    setOverviewError('')
    try {
      const res = await fetchAdminOverview()
      setOverview(res)
      if (res?.bloodBanks) {
        const mappedBanks = res.bloodBanks.map(b => {
          let verificationStatus = 'pending'
          const rawStatus = String(b.verificationStatus).toUpperCase()
          if (rawStatus === 'APPROVED' || rawStatus === 'VERIFIED' || rawStatus === 'SUCCESS') verificationStatus = 'verified'
          else if (rawStatus === 'REJECTED' || rawStatus === 'FAILED') verificationStatus = 'rejected'
          else verificationStatus = 'pending'

          return {
            ...b,
            verificationStatus
          }
        })
        setBloodBanks(mappedBanks)
      }
    } catch (err) {
      setOverviewError(err?.message || 'Failed to load overview.')
    } finally {
      setOverviewLoading(false)
    }
  }, [])

  const loadVerification = useCallback(async () => {
    await Promise.resolve()
    setVerificationLoading(true)
    setVerificationError('')
    try {
      const res = await fetchAdminVerification()
      setVerificationData(res)
    } catch (err) {
      setVerificationError(err?.message || 'Failed to load verification records.')
    } finally {
      setVerificationLoading(false)
    }
  }, [])

  const loadSecurity = useCallback(async () => {
    await Promise.resolve()
    setSecurityLoading(true)
    setSecurityError('')
    try {
      const res = await fetchSecurityFlags()
      setSecurityData(res)
    } catch (err) {
      setSecurityError(err?.message || 'Failed to load security flags.')
    } finally {
      setSecurityLoading(false)
    }
  }, [])

  const loadNotifications = useCallback(async () => {
    await Promise.resolve()
    setNotificationsLoading(true)
    setNotificationsError('')
    try {
      const res = await fetchNotifications()
      setNotificationsData(res)
    } catch (err) {
      setNotificationsError(err?.message || 'Failed to load notifications.')
    } finally {
      setNotificationsLoading(false)
    }
  }, [])

  const loadAudit = useCallback(async () => {
    await Promise.resolve()
    setAuditLoading(true)
    setAuditError('')
    try {
      const res = await fetchAuditLogs()
      setAuditData(res)
    } catch (err) {
      setAuditError(err?.message || 'Failed to load audit logs.')
    } finally {
      setAuditLoading(false)
    }
  }, [])

  const loadProfile = useCallback(async () => {
    await Promise.resolve()
    setProfileLoading(true)
    setProfileError('')
    try {
      const res = await fetchAdminProfile()
      setProfileData(res)
    } catch (err) {
      setProfileError(err?.message || 'Failed to load profile.')
    } finally {
      setProfileLoading(false)
    }
  }, [])

  const loadLegacyData = useCallback(async () => {
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
          requesterId: r.requester_id,
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
            status: r.account_status || 'active'
          }
        }))
      }

    } catch (err) {
      console.error('[admin] Failed to fetch database records:', err)
    }
  }, [])

  // Auth guard + initial data
  useEffect(() => {
    const session = localStorage.getItem('admin_session')
    if (!session) {
      navigate('/admin/login', { replace: true })
      return
    }

    loadLegacyData()
  }, [navigate, loadLegacyData])

  // Lazy-load admin API data per tab
  useEffect(() => {
    const timer = setTimeout(() => {
      if ((activeTab === 'dashboard' || activeTab === 'banks' || activeTab === 'stock' || activeTab === 'reports') && !overview) loadOverview()
      if (activeTab === 'verification' && !verificationData) loadVerification()
      if (activeTab === 'security' && !securityData) loadSecurity()
      if (activeTab === 'notifications' && !notificationsData) loadNotifications()
      if (activeTab === 'audit' && !auditData) loadAudit()
      if (activeTab === 'profile' && !profileData) loadProfile()
    }, 0)
    return () => clearTimeout(timer)
  }, [activeTab, overview, verificationData, securityData, notificationsData, auditData, profileData, loadOverview, loadVerification, loadSecurity, loadNotifications, loadAudit, loadProfile])

  // Persist legacy datasets
  useEffect(() => {
    localStorage.setItem('admin_blood_banks', JSON.stringify(bloodBanks))
  }, [bloodBanks])

  const confirmSignOut = () => {
    localStorage.removeItem('admin_session')
    navigate('/admin/login', { replace: true })
  }

  // Toggle Donor Status
  const toggleDonorStatus = (id) => {
    setDonors(prev => prev.map(d => {
      if (d.id === id) {
        return { ...d, status: d.status === 'active' ? 'suspended' : 'active' }
      }
      return d
    }))
  }

  // Toggle Requester Status
  const toggleRequesterStatus = (id) => {
    setRequesters(prev => prev.map(r => {
      if (r.id === id) {
        return { ...r, status: r.status === 'active' ? 'flagged' : 'active' }
      }
      return r
    }))
  }

  // Handle Verify Bank Actions
  const handleVerifyBank = (id, verifyStatus) =>
    runWithBanner(async () => {
      const dbStatus = verifyStatus === 'verified' ? 'APPROVED' : 'REJECTED'
      await verifyBloodBank(id, dbStatus, 'Updated via Admin Control Panel')
      await loadOverview()
    })

  // Handle Toggle Bank Account Status
  const handleToggleBankStatus = (id) => {
    setBloodBanks(prev => prev.map(b => {
      if (b.id === id) {
        return { ...b, accountStatus: b.accountStatus === 'active' ? 'deactivated' : 'active' }
      }
      return b
    }))
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

  // ---- Verification actions ----
  const handleApproveVerification = (type, id) =>
    runWithBanner(async () => {
      await approveVerification(type, id)
      await loadVerification()
      await loadLegacyData()
      await loadOverview()
    })

  const handleRejectVerification = (type, id, reason) =>
    runWithBanner(async () => {
      await rejectVerification(type, id, reason)
      await loadVerification()
      await loadLegacyData()
      await loadOverview()
    })

  const handleReverify = (type, id, reason) =>
    runWithBanner(async () => {
      await requestReverification(type, id, reason)
      await loadVerification()
      await loadLegacyData()
      await loadOverview()
    })

  // ---- Security actions ----
  const handleSecurityAction = (type, id, action) =>
    runWithBanner(async () => {
      await applySecurityAction(type, id, action)
      await loadSecurity()
    })

  // ---- Notification actions ----
  const handleMarkRead = (id) =>
    runWithBanner(async () => {
      await markNotificationRead(id)
      await loadNotifications()
    })

  const handleMarkAllRead = () =>
    runWithBanner(async () => {
      await markAllNotificationsRead()
      await loadNotifications()
    })

  const handleAnnouncement = (title, message, audience, priority) =>
    runWithBanner(async () => {
      await publishAnnouncement(title, message, audience, priority)
      await loadNotifications()
    })

  // ---- Profile actions ----
  const handleSaveProfile = (updates) =>
    runWithBanner(async () => {
      await updateAdminProfile(updates)
      await loadProfile()
    })

  const handleChangePassword = (current, next) => changeAdminPassword(current, next)

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
          <button className={`nav-item ${activeTab === 'reports' ? 'active' : ''}`} onClick={() => navigateTab('reports')}><FaChartBar /> Reports</button>
          <button className={`nav-item ${activeTab === 'notifications' ? 'active' : ''}`} onClick={() => navigateTab('notifications')}><FaBroadcastTower /> Notifications</button>
          <button className={`nav-item ${activeTab === 'audit' ? 'active' : ''}`} onClick={() => navigateTab('audit')}><FaHistory /> Audit Logs</button>
          <button className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => navigateTab('profile')}><FaUserCog /> Profile</button>
        </nav>

        <button className="admin-logout-btn" onClick={() => setConfirmLogout(true)}>
          <FaSignOutAlt /> Sign Out
        </button>
      </aside>

      {/* Main content pane */}
      <main className="admin-main">
        <header className="admin-header">
          <h1>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Control Panel</h1>
          <span className="admin-current-user">Logged in: {adminEmail}</span>
        </header>

        {errorBanner && <div className="admin-error-banner">{errorBanner}</div>}

        {/* Tab Panel Content */}
        {activeTab === 'dashboard' && (
          <DashboardOverview
            donors={donors}
            requesters={requesters}
            requests={requests}
            bloodBanks={bloodBanks}
            stock={[]}
            auditLogs={auditData || []}
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
            requests={requests}
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
            readOnly={true}
          />
        )}

        {activeTab === 'verification' && (
          <VerificationCenter
            data={verificationData}
            loading={verificationLoading}
            error={verificationError}
            onRetry={loadVerification}
            onApprove={handleApproveVerification}
            onReject={handleRejectVerification}
            onReverify={handleReverify}
          />
        )}


        {activeTab === 'reports' && (
          <ReportsAnalytics
            data={overview}
            loading={overviewLoading}
            error={overviewError}
            onRetry={loadOverview}
          />
        )}

        {activeTab === 'notifications' && (
          <NotificationsCenter
            data={notificationsData}
            loading={notificationsLoading}
            error={notificationsError}
            onRetry={loadNotifications}
            onMarkRead={handleMarkRead}
            onMarkAllRead={handleMarkAllRead}
            onAnnouncement={handleAnnouncement}
          />
        )}

        {activeTab === 'audit' && (
          <AuditLogsPanel
            data={auditData}
            loading={auditLoading}
            error={auditError}
            onRetry={loadAudit}
          />
        )}

        {activeTab === 'profile' && (
          <AdminProfile
            data={profileData}
            loading={profileLoading}
            error={profileError}
            onRetry={loadProfile}
            onSaveProfile={handleSaveProfile}
            onChangePassword={handleChangePassword}
          />
        )}
      </main>

      {/* Logout confirmation */}
      {confirmLogout && (
        <div className="admin-modal-overlay" onClick={() => setConfirmLogout(false)}>
          <div className="admin-modal-card confirm-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">Sign Out</h3>
            </div>
            <p className="confirm-modal-message">Are you sure you want to sign out of the Admin Control Panel?</p>
            <div className="admin-modal-footer">
              <button className="modal-action-close" onClick={() => setConfirmLogout(false)}>Cancel</button>
              <button className="confirm-action-btn confirm-action-btn--danger" onClick={confirmSignOut}>
                <FaSignOutAlt /> Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminDashboard
