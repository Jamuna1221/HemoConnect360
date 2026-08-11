import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { RequesterProvider } from './context/RequesterContext'
import { AuthProvider } from './context/AuthContext.jsx'
import './index.css'
import App from './App.jsx'

const registerFcmServiceWorker = async () => {
  if (!('serviceWorker' in navigator)) return
  try {
    await navigator.serviceWorker.register('/firebase-messaging-sw.js', { updateViaCache: 'none' })
  } catch (error) {
    console.warn('[fcm] Service worker registration failed', error)
  }
}

registerFcmServiceWorker()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <RequesterProvider>
          <App />
        </RequesterProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
