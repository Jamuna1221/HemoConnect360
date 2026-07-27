import Navbar from '../../components/Navbar/Navbar'
import HeroSection from '../../components/Donor/HeroSection'
import Eligibility from '../../components/Donor/Eligibility'
import Benefits from '../../components/Donor/Benefits'
import DonorForm from '../../components/Donor/DonorForm'
import Statistics from '../../components/Donor/Statistics'
import CTASection from '../../components/Donor/CTASection'
import Footer from '../../components/Footer/Footer'
import './Donor.css'

const Donor = () => {
  return (
    <div className="donor-page">
      <Navbar />
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
