import { FaHeart } from 'react-icons/fa'
import './ThankYouBanner.css'

const ThankYouBanner = () => {
  return (
    <section className="thank-you-banner">
      <div className="thank-you-banner__card">
        <div className="thank-you-banner__left">
          <div className="thank-you-banner__icon">
            <FaHeart />
          </div>
          <h2 className="thank-you-banner__heading">
            Thank you for making the world a better place.
          </h2>
          <p className="thank-you-banner__text">
            Every drop you donate brings hope and healing.
          </p>
        </div>
        <div className="thank-you-banner__right">
          <span className="thank-you-banner__cursive">You're Amazing!</span>
        </div>
      </div>
    </section>
  )
}

export default ThankYouBanner
