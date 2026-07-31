import { FaShieldAlt } from 'react-icons/fa'

const CTASection = () => {
  return (
    <section className="donor-cta">
      <div className="donor-cta__container">
        <FaShieldAlt className="donor-cta__icon" />
        <div className="donor-cta__content">
          <p className="donor-cta__text">
            <strong>Your privacy is our priority.</strong>
          </p>
          <p className="donor-cta__text">
            All your information is secure and will only be used for donor registration.
          </p>
        </div>
      </div>
    </section>
  )
}

export default CTASection
