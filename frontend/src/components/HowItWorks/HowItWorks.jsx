import { FaFileMedical, FaBell, FaHandsHelping, FaArrowRight } from 'react-icons/fa';
import './HowItWorks.css';

const STEPS = [
  {
    number: 1,
    icon: <FaFileMedical />,
    title: 'Submit Request',
    description: 'Fill in the patient and blood details quickly and submit your request.',
  },
  {
    number: 2,
    icon: <FaBell />,
    title: 'Donors Get Alerted',
    description: 'Matching donors nearby receive instant alerts about your request.',
  },
  {
    number: 3,
    icon: <FaHandsHelping />,
    title: 'Connect & Save Lives',
    description: 'Donor accepts, you connect, and together you save a life.',
  },
];

const HowItWorks = () => {
  return (
    <section className="how-it-works" id="how-it-works">
      <div className="how-it-works__container">
        <span className="how-it-works__eyebrow">How It Works</span>
        <h2 className="how-it-works__heading">Three Simple Steps to Save a Life</h2>
        <p className="how-it-works__subheading">
          Our platform makes blood donation simple, fast and effective.
        </p>

        <div className="how-it-works__steps">
          {STEPS.map((step, index) => (
            <div className="how-it-works__step-wrapper" key={step.number}>
              <div className="how-it-works__card fade-in">
                <span className="how-it-works__number">{step.number}</span>
                <div className="how-it-works__icon">{step.icon}</div>
                <h3 className="how-it-works__title">{step.title}</h3>
                <p className="how-it-works__description">{step.description}</p>
              </div>

              {index < STEPS.length - 1 && (
                <FaArrowRight className="how-it-works__arrow" aria-hidden="true" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
