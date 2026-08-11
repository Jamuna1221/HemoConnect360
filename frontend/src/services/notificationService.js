import { getSupabase } from '../lib/supabase'
import { apiRequest } from './api'
import { getRequesterToken } from './requesterService'

export const fetchDonorNotifications = async () => {
  const supabase = getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.id) return []
  const { data, error } = await supabase
    .from('notifications')
    .select('id, type, title, message, read_at, created_at')
    .eq('recipient_type', 'donor')
    .eq('recipient_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)
  if (error) throw error
  return data || []
}

export const markDonorNotificationRead = async (id) => {
  const supabase = getSupabase()
  await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', id)
}

export const fetchRequesterNotifications = async () => {
  const token = getRequesterToken()
  if (!token) return []
  const payload = await apiRequest('/requesters/me/notifications', {
    headers: { Authorization: `Bearer ${token}` },
  })
  return payload.data || []
}
