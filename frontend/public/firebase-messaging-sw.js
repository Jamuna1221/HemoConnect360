/* Firebase public web configuration. The service-account key must never be here. */
importScripts('https://www.gstatic.com/firebasejs/12.17.1/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/12.17.1/firebase-messaging-compat.js')

firebase.initializeApp({
  apiKey: 'AIzaSyBg-GpOMpIDNWv4udrLtEk_rFVpiaDEBQ4',
  authDomain: 'hemoconnect-2e1d5.firebaseapp.com',
  projectId: 'hemoconnect-2e1d5',
  storageBucket: 'hemoconnect-2e1d5.firebasestorage.app',
  messagingSenderId: '540641644272',
  appId: '1:540641644272:web:cd82d26c7763185fb7bc35',
})

const messaging = firebase.messaging()

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || 'HemoConnect360'
  const options = {
    body: payload.notification?.body || 'You have a new blood request update.',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    data: payload.data || {},
  }
  self.registration.showNotification(title, options)
})

const getNotificationTarget = (data) => {
  const type = data?.type || ''
  if (type === 'blood_request') return '/donor/requests'
  if (type === 'donors_matched' || type === 'donation_outcome' || type === 'blood_bank_update') {
    return '/requester/track'
  }
  return '/'
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = getNotificationTarget(event.notification.data || {})
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.navigate(url)
          return client.focus()
        }
      }
      return self.clients.openWindow(url)
    })
  )
})
