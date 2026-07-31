import { FaHeartbeat, FaUsers, FaHandHoldingHeart, FaSmile } from 'react-icons/fa'

const BENEFITS = [
  {
    icon: <FaHeartbeat />,
    title: 'Save Lives',
    description: 'Each donation can save up to three lives. Be the hero someone is waiting for.',
  },
  {
    icon: <FaUsers />,
    title: 'Good for Health',
    description: 'Regular donation helps maintain good health and blood cell production.',
  },
  {
    icon: <FaSmile />,
    title: 'Feel Good',
    description: 'Helping others brings happiness and a sense of fulfillment.',
  },
  {
    icon: <FaHandHoldingHeart />,
    title: 'Build Community',
    description: 'Join thousands of compassionate donors in your community.',
  },
]

const Benefits = () => {
  return (
    <div className="donor-benefits">
      <h2 className="donor-benefits__title">Why Donate Blood?</h2>
      <div className="donor-benefits__list">
        {BENEFITS.map((benefit) => (
          <div className="donor-benefits__card" key={benefit.title}>
            <div className="donor-benefits__icon">{benefit.icon}</div>
            <div className="donor-benefits__content">
              <h3 className="donor-benefits__card-title">{benefit.title}</h3>
              <p className="donor-benefits__card-desc">{benefit.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Benefits
