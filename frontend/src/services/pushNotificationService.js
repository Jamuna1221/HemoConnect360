import { getToken, onMessage } from 'firebase/messaging'
import { getFirebaseMessaging } from '../lib/firebase'
import { getSupabase } from '../lib/supabase'
import { apiRequest } from './api'
import { getRequesterToken } from './requesterService'

const getServiceWorkerRegistration = async () => {
  if (!('serviceWorker' in navigator)) return null
  await navigator.serviceWorker.register('/firebase-messaging-sw.js', { updateViaCache: 'none' })
  return navigator.serviceWorker.ready
}

export const enableDonorNotifications = async () => {
  const token = await getBrowserPushToken()

  const supabase = getSupabase()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user?.id) throw new Error('You must be signed in as a donor.')

  const { error } = await supabase
    .from('donor_push_tokens')
    .upsert({ donor_id: user.id, token, platform: 'web', last_seen_at: new Date().toISOString() }, { onConflict: 'token' })

  if (error) throw new Error(`Unable to save notification device: ${error.message}`)
  return token
}

export const getBrowserPushToken = async () => {
  if (!('Notification' in window)) throw new Error('This browser does not support notifications.')
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') throw new Error('Notification permission was not granted.')

  const messaging = await getFirebaseMessaging()
  if (!messaging) throw new Error('Firebase messaging is not supported in this browser.')
  const registration = await getServiceWorkerRegistration()
  const token = await getToken(messaging, {
    vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
    serviceWorkerRegistration: registration,
  })
  if (!token) throw new Error('Firebase did not return a notification token.')
  return token
}

export const enableRequesterNotifications = async () => {
  const token = await getBrowserPushToken()
  const requesterToken = getRequesterToken()
  if (!requesterToken) throw new Error('You must be signed in as a requester.')

  await apiRequest('/requesters/me/push-token', {
    method: 'POST',
    headers: { Authorization: `Bearer ${requesterToken}` },
    body: JSON.stringify({ token }),
  })
  return token
}

export const subscribeToForegroundNotifications = async (onNotification) => {
  const messaging = await getFirebaseMessaging()
  if (!messaging) return () => {}
  return onMessage(messaging, (payload) => onNotification(payload))
}
