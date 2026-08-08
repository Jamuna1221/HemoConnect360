import { RequesterProvider } from './context/RequesterContext'
import AppRoutes from './routes/AppRoutes'

function App() {
  return (
    <RequesterProvider>
      <AppRoutes />
    </RequesterProvider>
  )
}

export default App
