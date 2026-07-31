import { FaUserFriends, FaTint, FaHospital, FaHeartbeat } from 'react-icons/fa';
import './Stats.css';

const STATS = [
  {
    icon: <FaUserFriends />,
    value: '10,000+',
    label: 'Registered Donors',
    note: 'Growing every day',
  },
  {
    icon: <FaTint />,
    value: '850+',
    label: 'Blood Requests Fulfilled',
    note: 'Lives saved together',
  },
  {
    icon: <FaHospital />,
    value: '120+',
    label: 'Partner Hospitals',
    note: 'Working hand in hand',
  },
  {
    icon: <FaHeartbeat />,
    value: '24/7',
    label: 'Emergency Support',
    note: "We're always here",
  },
];

const Stats = () => {
  return (
    <section className="stats">
      <div className="stats__container">
        {STATS.map((stat) => (
          <div className="stats__card fade-in" key={stat.label}>
            <div className="stats__icon">{stat.icon}</div>
            <div className="stats__text">
              <h3 className="stats__value">{stat.value}</h3>
              <p className="stats__label">{stat.label}</p>
              <span className="stats__note">{stat.note}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Stats;
