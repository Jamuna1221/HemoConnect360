import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home/Home'
import Donor from './pages/Donor/Donor'
import DonorSuccess from './pages/DonorSuccess/DonorSuccess'
import TermsConditions from './pages/TermsConditions/TermsConditions'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/donor/registration" element={<Donor />} />
      <Route path="/donor/success" element={<DonorSuccess />} />
      <Route path="/terms-and-conditions" element={<TermsConditions />} />
    </Routes>
  )
}

export default App
