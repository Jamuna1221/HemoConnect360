import { Navigate } from 'react-router-dom'
import { useAuthContext } from '../../context/useAuthContext'
import './ProtectedRoute.css'

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuthContext()

  if (loading) {
    return (
      <div className="protected-route">
        <div className="protected-route__spinner" />
        <p>Checking your session...</p>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/donor/login" replace />
  }

  return children
}

export default ProtectedRoute
