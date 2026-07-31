import { FaTint, FaMapMarkerAlt, FaShieldAlt, FaUserFriends, FaHeart, FaHeartbeat } from 'react-icons/fa';
import './Hero.css';

const FLOATING_ICONS = [
  { icon: <FaTint />, label: 'Instant Alerts', position: 'top-left' },
  { icon: <FaMapMarkerAlt />, label: 'Nearby Donors', position: 'top-right' },
  { icon: <FaShieldAlt />, label: 'Safe & Secure', position: 'bottom-left' },
  { icon: <FaUserFriends />, label: 'Verified Donors', position: 'bottom-right' },
];

const Hero = () => {
  return (
    <section className="hero" id="home">
      <div className="hero__container">
        <div className="hero__content fade-in">
          <h1 className="hero__heading">
            One Request.
            <br />
            Many Heroes.
            <br />
            <span className="hero__heading--accent">Countless Lives Saved.</span>
          </h1>

          <p className="hero__description">
            HemoConnect360 instantly connects blood requesters with nearby, compatible donors
            in times of urgent need.
          </p>

          <div className="hero__actions">
            <div className="hero__action-group">
              <button type="button" className="hero__btn hero__btn--primary">
                <FaTint /> Request Blood Now
              </button>
              <span className="hero__action-note">Need blood urgently? We're here to help.</span>
            </div>

            <div className="hero__action-group">
              <button type="button" className="hero__btn hero__btn--secondary">
                <FaHeart /> Become a Donor
              </button>
              <span className="hero__action-note">Join our network and save lives.</span>
            </div>
          </div>

          <div className="hero__social-proof">
            <div className="hero__avatars">
              {[1, 2, 3].map((n) => (
                <img
                  key={n}
                  src={`https://picsum.photos/seed/donor${n}/60/60`}
                  alt={`Donor ${n}`}
                  className="hero__avatar"
                />
              ))}
            </div>
            <div className="hero__social-text">
              <strong>10,000+</strong> Lives Impacted
              <span className="hero__social-subtext">Trusted by donors and hospitals across India</span>
            </div>
          </div>
        </div>

        <div className="hero__visual fade-in">
          <div className="hero__orbit">
            <div className="hero__glow" aria-hidden="true" />
            <div className="hero__drop">
              <FaHeartbeat className="hero__drop-icon" />
            </div>

            {FLOATING_ICONS.map((item) => (
              <div key={item.label} className={`hero__float hero__float--${item.position}`}>
                <div className="hero__float-icon">{item.icon}</div>
                <span className="hero__float-label">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
