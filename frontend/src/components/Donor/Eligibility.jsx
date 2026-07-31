import { FaCheckCircle } from 'react-icons/fa'

const REQUIREMENTS = [
  'Age between 18 and 65 years',
  'Weight above 50 kg',
  'Hemoglobin above 12.5 g/dL',
  'Healthy condition',
  'Last donation at least 3 months ago',
]

const Eligibility = () => {
  return (
    <div className="donor-eligibility">
      <h2 className="donor-eligibility__title">Eligibility Criteria</h2>
      <ul className="donor-eligibility__list">
        {REQUIREMENTS.map((item) => (
          <li className="donor-eligibility__item" key={item}>
            <FaCheckCircle className="donor-eligibility__icon" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default Eligibility
