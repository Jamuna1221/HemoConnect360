import { apiRequest } from './api'
import { getSupabase } from '../lib/supabase'

const getAdminSession = () => {
  try {
    const raw = localStorage.getItem('admin_session')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

const adminHeaders = () => {
  const session = getAdminSession()
  const headers = {}
  if (session) {
    headers['Authorization'] = `Bearer ${session.token || 'admin-mock-token'}`
    if (session.email) headers['x-admin-email'] = session.email
  }
  return headers
}

export const getAdminEmail = () => getAdminSession()?.email || 'admin@hemoconnect360.com'

const post = async (path, body) => {
  const res = await apiRequest(path, {
    method: 'POST',
    headers: adminHeaders(),
    body: JSON.stringify(body || {}),
  })
  return res.data
}

const patch = async (path, body) => {
  const res = await apiRequest(path, {
    method: 'PATCH',
    headers: adminHeaders(),
    body: JSON.stringify(body || {}),
  })
  return res.data
}

const get = async (path) => {
  const res = await apiRequest(path, { headers: adminHeaders() })
  return res.data
}

export const fetchAllBloodBanks = () => get('/blood-banks/')
export const verifyBloodBank = (id, status, notes) => patch(`/blood-banks/${id}/verify`, { status, notes })

export const fetchAdminOverview = () => get('/admin/overview')
export const updateBloodRequestStatus = (id, status) => patch(`/admin/blood-requests/${id}/status`, { status })

export const fetchAdminVerification = () => get('/admin/verification')

export const approveVerification = (type, id) =>
  post('/admin/verification/approve', { type, id })

export const rejectVerification = (type, id, reason) =>
  post('/admin/verification/reject', { type, id, reason })

export const requestReverification = (type, id, reason) =>
  post('/admin/verification/reverify', { type, id, reason })

const mapFlagStatus = (flag) => {
  const status = flag.status || 'FLAGGED'
  if (status === 'FLAGGED') return 'pending'
  if (status === 'UNDER_REVIEW') return 'reviewed'
  if (status === 'DISMISSED') return 'dismissed'
  if (status === 'RESOLVED') return flag.adminAction === 'resolve' ? 'resolved' : 'action_taken'
  return String(status).toLowerCase()
}

const stringifyDetails = (details) => {
  if (details == null) return ''
  return typeof details === 'object' ? JSON.stringify(details) : String(details)
}

export const fetchSecurityFlags = async () => {
  const flags = await get('/admin/security')
  return {
    flags: flags.map((flag) => ({
      id: flag.id,
      userId: flag.userId,
      userName: flag.user || 'Unknown',
      email: flag.email || '',
      userType: flag.userType || 'donor',
      activityType: flag.activityType || '',
      severity: flag.riskLevel || 'medium',
      reason: flag.reasonFlagged || '',
      details: stringifyDetails(flag.details),
      status: mapFlagStatus(flag),
      detectedAt: flag.createdAt || '',
    })),
  }
}

export const applySecurityAction = (type, id, action) =>
  post('/admin/security/action', {
    id,
    action,
    note: action === 'warn' ? 'Warning issued by system administrator.' : undefined,
  })

export const fetchNotifications = () => get('/admin/notifications')

export const markNotificationRead = (id) => post('/admin/notifications/read', { id })

export const markAllNotificationsRead = () => post('/admin/notifications/read-all', {})

export const publishAnnouncement = (title, message, audience = 'all', priority = 'normal') => {
  const input =
    title && typeof title === 'object'
      ? title
      : { title, message, audience, priority }
  return post('/admin/notifications/announcement', {
    title: input.title,
    message: input.message,
    audience: input.audience || 'all',
    priority: input.priority || 'normal',
  })
}

export const getAuditLogs = () => get('/admin/audit-logs')

export const fetchAuditLogs = () => get('/admin/audit-logs')

export const fetchAdminProfile = () => get('/admin/profile')

export const updateAdminProfile = async (input) => {
  const res = await apiRequest('/admin/profile', {
    method: 'PUT',
    headers: adminHeaders(),
    body: JSON.stringify(input || {}),
  })
  return res.data
}

export const getDocumentUrl = (bucket, pathOrUrl) => {
  if (!pathOrUrl) return ''
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl
  const supabase = getSupabase()
  const { data } = supabase.storage.from(bucket || 'donor-docs').getPublicUrl(pathOrUrl)
  return data?.publicUrl || pathOrUrl
}

export const getNotifications = () => get('/admin/notifications')

export const getOverview = fetchAdminOverview

export const readNotification = markNotificationRead

export const readAllNotifications = markAllNotificationsRead

export const getProfile = fetchAdminProfile

export const updateProfile = updateAdminProfile

export const changeAdminPassword = async (currentPassword, newPassword) => {
  const supabase = getSupabase()
  const session = getAdminSession()
  if (!session?.email) throw new Error('Admin session not found. Please sign in again.')
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: session.email,
    password: currentPassword,
  })
  if (signInError) {
    throw new Error('Current password is incorrect. Please try again.')
  }
  const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
  if (updateError) {
    throw new Error(updateError.message || 'Unable to update password. Please try again.')
  }
  return true
}
