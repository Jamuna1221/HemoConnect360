import { FaHeart, FaHeartbeat, FaSmile, FaUsers } from 'react-icons/fa';
import './WhyDonate.css';

const BENEFITS = [
  {
    icon: <FaHeart />,
    title: 'Saves Lives',
    description: 'One donation can save up to 3 lives',
  },
  {
    icon: <FaHeartbeat />,
    title: 'Boosts Health',
    description: 'Helps in new blood cell production',
  },
  {
    icon: <FaSmile />,
    title: 'Feels Good',
    description: 'The joy of saving someone is priceless',
  },
  {
    icon: <FaUsers />,
    title: 'Builds Community',
    description: 'Stronger communities save more lives',
  },
];

const WhyDonate = () => {
  return (
    <section className="why-donate" id="why-donate">
      <div className="why-donate__container">
        <div className="why-donate__image-wrapper fade-in">
          <img
            src="https://picsum.photos/seed/bloodbag/500/500"
            alt="Blood donation bag illustration"
            className="why-donate__image"
          />
        </div>

        <div className="why-donate__content fade-in">
          <h2 className="why-donate__heading">Why Donate Blood?</h2>
          <p className="why-donate__description">
            Your single act of kindness can create a ripple of hope in someone's life.
          </p>

          <div className="why-donate__benefits">
            {BENEFITS.map((benefit) => (
              <div className="why-donate__benefit-card" key={benefit.title}>
                <div className="why-donate__benefit-icon">{benefit.icon}</div>
                <div>
                  <h4 className="why-donate__benefit-title">{benefit.title}</h4>
                  <p className="why-donate__benefit-description">{benefit.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyDonate;
