import Navbar from '../../components/Navbar/Navbar'
import SuccessHero from '../../components/DonorSuccess/SuccessHero'
import NextSteps from '../../components/DonorSuccess/NextSteps'
import RegistrationSummary from '../../components/DonorSuccess/RegistrationSummary'
import ThankYouBanner from '../../components/DonorSuccess/ThankYouBanner'
import Footer from '../../components/Footer/Footer'
import './DonorSuccess.css'

const DonorSuccess = () => {
  return (
    <div className="donor-success-page">
      <Navbar />
      <main className="donor-success-main">
        <SuccessHero />
        <div className="donor-success-two-col">
          <NextSteps />
          <RegistrationSummary />
        </div>
        <ThankYouBanner />
      </main>
      <Footer />
    </div>
  )
}

export default DonorSuccess
