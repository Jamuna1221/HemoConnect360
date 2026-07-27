import { FaBell, FaMapMarkerAlt, FaHeart } from 'react-icons/fa'
import './NextSteps.css'

const STEPS = [
  {
    icon: <FaBell />,
    title: 'Stay Alerted',
    description: "You'll receive notifications for urgent blood requests near you.",
  },
  {
    icon: <FaMapMarkerAlt />,
    title: 'Get Matched',
    description: "We'll match you with patients based on your blood group and location.",
  },
  {
    icon: <FaHeart />,
    title: 'Save Lives',
    description: 'Your willingness to donate can make a real difference.',
  },
]

const NextSteps = () => {
  return (
    <section className="next-steps">
      <h2 className="next-steps__heading">What's Next?</h2>
      <div className="next-steps__list">
        {STEPS.map((step, index) => (
          <div className="next-steps__card" key={index}>
            <div className="next-steps__icon">{step.icon}</div>
            <div className="next-steps__content">
              <h3 className="next-steps__title">{step.title}</h3>
              <p className="next-steps__description">{step.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export default NextSteps
