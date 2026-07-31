import { FaShieldAlt, FaHeart, FaUsers } from 'react-icons/fa'
import donorHero from '../../assets/donar/donor-hero.png'
import medicalPattern from '../../assets/donar/medical-pattern.png'
import './HeroSection.css'

const FEATURES = [
  {
    icon: <FaShieldAlt />,
    title: 'Safe & Secure',
    description: 'Your data is protected with utmost privacy.',
  },
  {
    icon: <FaHeart />,
    title: 'Save Lives',
    description: 'Your donation can save up to 3 lives.',
  },
  {
    icon: <FaUsers />,
    title: 'Trusted Community',
    description: 'Join thousands of verified donors.',
  },
]

const HeroSection = () => {
  return (
    <section
      className="donor-hero"
      style={{ backgroundImage: `url(${medicalPattern})` }}
    >
      <div className="donor-hero__container">
        <div className="donor-hero__left">
          <span className="donor-hero__badge">BE A HERO</span>
          <div className="donor-hero__badge-line"></div>
          <h1 className="donor-hero__title">
            Become a Donor,<br />
            <span className="donor-hero__title--accent">Save Lives</span>
          </h1>
          <p className="donor-hero__subtitle">
            Join our community of life-savers.
            <br />
            Your small act of kindness can bring hope to someone in need.
          </p>
          <div className="donor-hero__features">
            {FEATURES.map((feature) => (
              <div className="donor-hero__feature-card" key={feature.title}>
                <div className="donor-hero__feature-icon">{feature.icon}</div>
                <div className="donor-hero__feature-content">
                  <h3 className="donor-hero__feature-title">{feature.title}</h3>
                  <p className="donor-hero__feature-desc">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="donor-hero__right">
          <img
            src={donorHero}
            alt="Blood donor illustration"
            className="donor-hero__image"
          />
        </div>
      </div>
    </section>
  )
}

export default HeroSection
