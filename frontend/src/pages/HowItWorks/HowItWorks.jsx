import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { FaTint, FaArrowLeft } from 'react-icons/fa'
import Navbar from '../../components/Navbar/Navbar'
import Footer from '../../components/Footer/Footer'
import HowItWorksSteps from '../../components/HowItWorks/HowItWorks'
import './HowItWorks.css'

const HowItWorks = () => {
  return (
    <div className="how-it-works-page">
      <Navbar />
      <main className="how-it-works-page__main">
        <section className="how-it-works-page__hero">
          <div className="how-it-works-page__hero-inner">
            <motion.span
              className="how-it-works-page__eyebrow"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              How It Works
            </motion.span>
            <motion.h1
              className="how-it-works-page__title"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.45 }}
            >
              How <span className="how-it-works-page__accent">HemoConnect360</span> Works
            </motion.h1>
            <motion.p
              className="how-it-works-page__subtitle"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.45 }}
            >
              From registration to saving lives — here is everything you need to know
              about donating blood with us.
            </motion.p>
            <motion.div
              className="how-it-works-page__actions"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.45 }}
            >
              <Link to="/donor/register" className="how-it-works-page__btn how-it-works-page__btn--primary">
                <FaTint /> Become a Donor
              </Link>
              <Link to="/" className="how-it-works-page__btn how-it-works-page__btn--secondary">
                <FaArrowLeft /> Back to Home
              </Link>
            </motion.div>
          </div>
        </section>

        <HowItWorksSteps />
      </main>
      <Footer />
    </div>
  )
}

export default HowItWorks
