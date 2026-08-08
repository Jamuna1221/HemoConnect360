import { Link } from 'react-router-dom'
import { FaUser, FaPlay, FaHeart } from 'react-icons/fa'
import bloodDropSuccess from '../../assets/donor-success/blood-drop-success.png'
import celebrationConfetti from '../../assets/donor-success/celebration-confetti.svg'
import heroOutline from '../../assets/donor-success/hero-outline.svg'
import './SuccessHero.css'

const SuccessHero = ({ donor, loading }) => {
  const firstName = donor?.full_name?.trim().split(/\s+/)[0] || ''

  return (
    <section className="success-hero">
      <div className="success-hero__card">
        {/* Outline — absolutely positioned on the card */}
        <img
          src={heroOutline}
          alt=""
          className="success-hero__outline"
        />

        {/* Left — Illustration */}
        <div className="success-hero__left">
          <div className="success-hero__glow" />
          <div className="success-hero__image-wrapper">
            <img
              src={celebrationConfetti}
              alt=""
              className="success-hero__confetti"
            />
            <img
              src={bloodDropSuccess}
              alt="Registration successful"
              className="success-hero__blood-drop"
            />
          </div>
        </div>

        {/* Center — Content */}
        <div className="success-hero__center">
          <span className="success-hero__badge">Registration Successful!</span>
          <h1 className="success-hero__heading">
            Thank You{!loading && firstName ? `, ${firstName}` : ','}
            <br />
            You&apos;re Now a{' '}
            <span className="success-hero__heading--accent">
              Hero!<FaHeart className="success-hero__heart" />
            </span>
          </h1>
          <p className="success-hero__text">
            Your registration has been completed successfully.
            <br />
            You are now part of a community that saves lives.
          </p>
          <div className="success-hero__actions">
            <Link to="/donor/dashboard" className="success-hero__btn success-hero__btn--primary">
              <FaUser /> Go to Dashboard
            </Link>
            <Link to="/#how-it-works" className="success-hero__btn success-hero__btn--secondary">
              <FaPlay /> Explore How It Works
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

export default SuccessHero
