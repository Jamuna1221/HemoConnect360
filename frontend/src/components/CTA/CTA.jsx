import { FaTint, FaHeart } from 'react-icons/fa';
import './CTA.css';

const CTA = () => {
  return (
    <section className="cta">
      <div className="cta__container">
        <div className="cta__text">
          <h2 className="cta__heading">Be the reason someone lives today.</h2>
          <p className="cta__subtext">Join HemoConnect360 and make a difference.</p>
        </div>

        <div className="cta__actions">
          <button type="button" className="cta__btn cta__btn--outline">
            <FaTint /> Request Blood
          </button>
          <button type="button" className="cta__btn cta__btn--solid">
            <FaHeart /> Become a Donor
          </button>
        </div>

        <FaTint className="cta__decor cta__decor--left" aria-hidden="true" />
        <FaTint className="cta__decor cta__decor--right" aria-hidden="true" />
      </div>
    </section>
  );
};

export default CTA;
