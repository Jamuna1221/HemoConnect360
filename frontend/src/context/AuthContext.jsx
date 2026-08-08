import { AuthContext } from './useAuthContext'
import { useAuth } from '../hooks/useAuth'

export const AuthProvider = ({ children }) => {
  const auth = useAuth()

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  )
}
