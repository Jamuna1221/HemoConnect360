import { FaQuoteLeft, FaStar } from 'react-icons/fa';
import './Testimonials.css';

const TESTIMONIALS = [
  {
    name: 'Ananya Rajan',
    role: 'Regular Donor, Chennai',
    quote:
      'I got an alert at midnight when someone needed O-negative blood. Within an hour I was at the hospital. HemoConnect360 made it effortless.',
    avatarSeed: 'ananya',
  },
  {
    name: 'Dr. Karthik Suresh',
    role: 'Partner Hospital, Apollo',
    quote:
      'The platform has cut our emergency response time drastically. Coordinating with verified donors has never been this smooth.',
    avatarSeed: 'karthik',
  },
  {
    name: 'Meera Iyer',
    role: "Patient's Family Member",
    quote:
      'My father needed an urgent transfusion and we found three matching donors within minutes. I cannot thank this platform enough.',
    avatarSeed: 'meera',
  },
];

const Testimonials = () => {
  return (
    <section className="testimonials">
      <div className="testimonials__container">
        <span className="testimonials__eyebrow">Testimonials</span>
        <h2 className="testimonials__heading">Stories from Our Community</h2>

        <div className="testimonials__grid">
          {TESTIMONIALS.map((testimonial) => (
            <div className="testimonials__card fade-in" key={testimonial.name}>
              <FaQuoteLeft className="testimonials__quote-icon" />
              <p className="testimonials__quote">{testimonial.quote}</p>

              <div className="testimonials__stars">
                {Array.from({ length: 5 }).map((_, i) => (
                  <FaStar key={i} />
                ))}
              </div>

              <div className="testimonials__profile">
                <img
                  src={`https://picsum.photos/seed/${testimonial.avatarSeed}/80/80`}
                  alt={testimonial.name}
                  className="testimonials__avatar"
                />
                <div>
                  <h4 className="testimonials__name">{testimonial.name}</h4>
                  <span className="testimonials__role">{testimonial.role}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
