import { Routes, Route } from 'react-router-dom'
import { RequesterProvider } from './context/RequesterContext'
import Home from './pages/Home/Home'
import Donor from './pages/Donor/Donor'
import DonorSuccess from './pages/DonorSuccess/DonorSuccess'
import TermsConditions from './pages/TermsConditions/TermsConditions'
import RequesterLogin from './pages/Requester/RequesterLogin'
import RequesterRegistration from './pages/Requester/RequesterRegister'
import RequesterDashboard from './pages/Requester/RequesterDashboard'
import RequestBlood from './pages/Requester/RequestBlood'
import RequestConfirmation from './pages/Requester/RequestConfirmation'
import TrackRequest from './pages/Requester/TrackRequest'
import RequestHistory from './pages/Requester/RequestHistory'
import RequestDetails from './pages/Requester/RequestDetails'
import RequesterProfile from './pages/Requester/RequesterProfile'

function App() {
  return (
    <RequesterProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/donor/registration" element={<Donor />} />
        <Route path="/donor/success" element={<DonorSuccess />} />
        <Route path="/terms-and-conditions" element={<TermsConditions />} />

        <Route path="/requester/login" element={<RequesterLogin />} />
        <Route path="/requester/register" element={<RequesterRegistration />} />
        <Route path="/requester/dashboard" element={<RequesterDashboard />} />
        <Route path="/requester/request-blood" element={<RequestBlood />} />
        <Route path="/requester/confirmation" element={<RequestConfirmation />} />
        <Route path="/requester/track" element={<TrackRequest />} />
        <Route path="/requester/history" element={<RequestHistory />} />
        <Route path="/requester/request-details/:id" element={<RequestDetails />} />
        <Route path="/requester/profile" element={<RequesterProfile />} />
        <Route path="/donor/success" element={<DonorSuccess />} />
        <Route path="/terms-and-conditions" element={<TermsConditions />} />
      </Routes>
    </RequesterProvider>
  )
}

export default App