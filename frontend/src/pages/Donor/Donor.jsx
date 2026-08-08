import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FaArrowLeft } from 'react-icons/fa'
import Navbar from '../../components/Navbar/Navbar'
import HeroSection from '../../components/Donor/HeroSection'
import Eligibility from '../../components/Donor/Eligibility'
import Benefits from '../../components/Donor/Benefits'
import DonorForm from '../../components/Donor/DonorForm'
import Statistics from '../../components/Donor/Statistics'
import CTASection from '../../components/Donor/CTASection'
import Footer from '../../components/Footer/Footer'
import { useAuthContext } from '../../context/useAuthContext'
import './Donor.css'

const Donor = () => {
  const navigate = useNavigate()
  const { user, donor, loading } = useAuthContext()

  useEffect(() => {
    if (!loading && user && donor) {
      navigate('/donor/dashboard', { replace: true })
    }
  }, [user, donor, loading, navigate])

  if (loading) {
    return (
      <div className="donor-page">
        <Navbar />
        <main className="donor-main">
          <div className="protected-route">
            <div className="protected-route__spinner" />
            <p>Checking your account...</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="donor-page">
      <Navbar />
      <button
        type="button"
        className="donor-back-btn"
        onClick={() => navigate('/')}
      >
        <FaArrowLeft /> Back
      </button>
      <main className="donor-main">
        <HeroSection />
        <section className="donor-form-section">
          <div className="donor-form-section__left">
            <Eligibility />
            <Benefits />
          </div>
          <div className="donor-form-section__right">
            <DonorForm />
          </div>
        </section>
        <Statistics />
        <CTASection />
      </main>
      <Footer />
    </div>
  )
}

export default Donor
