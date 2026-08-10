import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from '../components/ProtectedRoute/ProtectedRoute'
import Home from '../pages/Home/Home'
import Donor from '../pages/Donor/Donor'
import DonorSuccess from '../pages/DonorSuccess/DonorSuccess'
import DonorThankYou from '../pages/DonorThankYou/DonorThankYou'
import VerifyEmail from '../pages/VerifyEmail/VerifyEmail'
import AuthCallback from '../pages/AuthCallback/AuthCallback'
import TermsConditions from '../pages/TermsConditions/TermsConditions'
import DonorDashboard from '../pages/DonorDashboard/DonorDashboard'
import DonorLogin from '../pages/DonorLogin/DonorLogin'
import DonorRequests from '../pages/DonorRequests/DonorRequests'
import DonorRequestDetails from '../pages/DonorRequestDetails/DonorRequestDetails'
import DonorProfile from '../pages/DonorProfile/DonorProfile'
import HowItWorks from '../pages/HowItWorks/HowItWorks'
import RequesterLogin from '../pages/Requester/RequesterLogin'
import RequesterRegistration from '../pages/Requester/RequesterRegister'
import RequesterDashboard from '../pages/Requester/RequesterDashboard'
import RequestBlood from '../pages/Requester/RequestBlood'
import RequestConfirmation from '../pages/Requester/RequestConfirmation'
import TrackRequest from '../pages/Requester/TrackRequest'
import RequestHistory from '../pages/Requester/RequestHistory'
import RequestDetails from '../pages/Requester/RequestDetails'
import RequesterProfile from '../pages/Requester/RequesterProfile'

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/donor/register" element={<Donor />} />
      <Route path="/donor/registration" element={<Navigate to="/donor/register" replace />} />
      <Route path="/donor/success" element={<ProtectedRoute><DonorSuccess /></ProtectedRoute>} />
      <Route path="/donor/thank-you" element={<ProtectedRoute><DonorThankYou /></ProtectedRoute>} />
      <Route path="/donor/dashboard" element={<ProtectedRoute><DonorDashboard /></ProtectedRoute>} />
      <Route path="/donor/requests" element={<ProtectedRoute><DonorRequests /></ProtectedRoute>} />
      <Route path="/donor/requests/:id" element={<ProtectedRoute><DonorRequestDetails /></ProtectedRoute>} />
      <Route path="/donor/profile" element={<ProtectedRoute><DonorProfile /></ProtectedRoute>} />
      <Route path="/donor/login" element={<DonorLogin />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/how-it-works" element={<HowItWorks />} />
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
    </Routes>
  )
}

export default AppRoutes
