import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { RequesterProvider } from './context/RequesterContext'
import { AuthProvider } from './context/AuthContext.jsx'
import './index.css'
import App from './App.jsx'

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
