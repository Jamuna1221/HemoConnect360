import Navbar from '../../components/Navbar/Navbar'
import SuccessHero from '../../components/DonorSuccess/SuccessHero'
import NextSteps from '../../components/DonorSuccess/NextSteps'
import RegistrationSummary from '../../components/DonorSuccess/RegistrationSummary'
import ThankYouBanner from '../../components/DonorSuccess/ThankYouBanner'
import Footer from '../../components/Footer/Footer'
import { useDonor } from '../../hooks/useDonor'
import './DonorSuccess.css'

const DonorSuccess = () => {
  const { donor, loading, error } = useDonor()

  return (
    <div className="donor-success-page">
      <Navbar />
      <main className="donor-success-main">
        <SuccessHero donor={donor} loading={loading} />
        <div className="donor-success-two-col">
          <NextSteps />
          <RegistrationSummary donor={donor} loading={loading} error={error} />
        </div>
        <ThankYouBanner />
      </main>
      <Footer />
    </div>
  )
}

export default DonorSuccess
