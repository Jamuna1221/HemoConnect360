import { RequesterProvider } from './context/RequesterContext'
import AppRoutes from './routes/AppRoutes'
import GoogleTranslate from './components/Common/GoogleTranslate'

function App() {
  return (
    <RequesterProvider>
      <AppRoutes />
      <GoogleTranslate />
    </RequesterProvider>
  )
}

export default App
