import { FaUsers, FaHeart, FaCampground } from 'react-icons/fa'

const STATS = [
  { icon: <FaUsers />, value: '10,000+', label: 'Active Donors' },
  { icon: <FaHeart />, value: '25,000+', label: 'Lives Saved' },
  { icon: <FaCampground />, value: '500+', label: 'Donation Camps' },
]

const Statistics = () => {
  return (
    <section className="donor-statistics">
      <div className="donor-statistics__container">
        <div className="donor-statistics__header">
          <h2 className="donor-statistics__title">
            Thank you for choosing to save lives!
          </h2>
          <p className="donor-statistics__subtitle">
            Your generosity can make a world of difference.
          </p>
        </div>
        <div className="donor-statistics__grid">
          {STATS.map((stat) => (
            <div className="donor-statistics__card" key={stat.label}>
              <div className="donor-statistics__icon">{stat.icon}</div>
              <h3 className="donor-statistics__value">{stat.value}</h3>
              <p className="donor-statistics__label">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Statistics
