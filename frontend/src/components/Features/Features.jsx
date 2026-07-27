import { FaUserCheck, FaBolt, FaMapMarkedAlt, FaLock } from 'react-icons/fa';
import './Features.css';

const FEATURES = [
  {
    icon: <FaUserCheck />,
    title: 'Verified Donors',
    description: 'Every donor profile is verified for authenticity and safety before approval.',
  },
  {
    icon: <FaBolt />,
    title: 'Instant Alerts',
    description: 'Real-time notifications reach compatible donors the moment a request is raised.',
  },
  {
    icon: <FaMapMarkedAlt />,
    title: 'Nearby Matching',
    description: 'Smart location matching connects you with donors closest to the need.',
  },
  {
    icon: <FaLock />,
    title: 'Secure Platform',
    description: 'Your data and communication stay private and protected at every step.',
  },
];

const Features = () => {
  return (
    <section className="features">
      <div className="features__container">
        <span className="features__eyebrow">Platform Features</span>
        <h2 className="features__heading">Built for Speed. Designed for Trust.</h2>

        <div className="features__grid">
          {FEATURES.map((feature) => (
            <div className="features__card fade-in" key={feature.title}>
              <div className="features__icon">{feature.icon}</div>
              <h3 className="features__title">{feature.title}</h3>
              <p className="features__description">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
