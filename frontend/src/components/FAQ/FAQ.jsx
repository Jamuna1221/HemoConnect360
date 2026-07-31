import { useState } from 'react';
import { FaChevronDown } from 'react-icons/fa';
import './FAQ.css';

const FAQS = [
  {
    question: 'Who can register as a blood donor?',
    answer:
      'Anyone between 18 and 65 years of age, in good health and weighing above 50kg, can register as a donor on HemoConnect360.',
  },
  {
    question: 'How quickly are donors notified of a request?',
    answer:
      'Compatible donors within your selected radius receive an instant alert within seconds of a request being submitted.',
  },
  {
    question: 'Is my personal information kept private?',
    answer:
      'Yes. All donor and requester data is encrypted and only shared with matched parties once a connection is confirmed.',
  },
  {
    question: 'Is there any cost to request or donate blood?',
    answer:
      'HemoConnect360 is completely free to use for both requesters and donors. We never charge for saving lives.',
  },
  {
    question: 'How do partner hospitals get involved?',
    answer:
      'Hospitals can register as verified partners to coordinate directly with donors and manage urgent requests on the platform.',
  },
];

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(0);

  const toggleFAQ = (index) => {
    setOpenIndex((prev) => (prev === index ? -1 : index));
  };

  return (
    <section className="faq">
      <div className="faq__container">
        <span className="faq__eyebrow">FAQ</span>
        <h2 className="faq__heading">Frequently Asked Questions</h2>

        <div className="faq__list">
          {FAQS.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <div className={`faq__item ${isOpen ? 'faq__item--open' : ''}`} key={item.question}>
                <button
                  type="button"
                  className="faq__question"
                  onClick={() => toggleFAQ(index)}
                  aria-expanded={isOpen}
                >
                  {item.question}
                  <FaChevronDown className="faq__chevron" />
                </button>
                <div className="faq__answer-wrapper">
                  <p className="faq__answer">{item.answer}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FAQ;
