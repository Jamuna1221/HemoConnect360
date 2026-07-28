import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import RequesterNavbar from '../../components/Requester/RequesterNavbar';
import Footer from '../../components/Footer/Footer';
import { useRequester } from '../../context/RequesterContext';
import './TrackRequest.css';

const steps = [
  { label: 'Submitted', icon: '✓' },
  { label: 'Searching', icon: '🔍' },
  { label: 'Donors Notified', icon: '📢' },
  { label: 'Donor Accepted', icon: '🤝' },
  { label: 'Blood Donated', drop: '💉' },
  { label: 'Completed', icon: '✅' },
];

const TrackRequest = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, requests } = useRequester();
  const latestRequest = requests[0];
  const requestData = location.state?.request || location.state?.requestData || latestRequest;

  const [currentStep, setCurrentStep] = useState(0);
  const [donorVisible, setDonorVisible] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/requester/login');
    }
  }, [user, navigate]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < steps.length - 1) return prev + 1;
        clearInterval(interval);
        return prev;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (currentStep >= 3) {
      const timer = setTimeout(() => setDonorVisible(true), 800);
      return () => clearTimeout(timer);
    }
  }, [currentStep]);

  if (!user) return null;

  const donor = {
    name: 'Rajesh Kumar',
    bloodGroup: 'A+',
    phone: '+91 98765 43210',
    distance: '3.2 km',
    verified: true,
    donated: '3 times',
  };

  return (
    <div className="requester-page">
      <RequesterNavbar />
      <main className="trk-container">
        <motion.div
          className="trk-card"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="trk-header">
            <h2 className="trk-title">Track Your Request</h2>
            <span className="trk-request-id">{requestData?.id || 'No active request'}</span>
          </div>

          <div className="trk-map-placeholder">
            <div className="trk-map-pulse trk-map-pulse-1" />
            <div className="trk-map-pulse trk-map-pulse-2" />
            <div className="trk-map-dot" />
            <p className="trk-map-text">Live tracking map</p>
            <p className="trk-map-subtext">Donors within 10 km radius</p>
          </div>

          <div className="trk-timeline">
            {steps.map((step, index) => {
              const isDone = index < currentStep;
              const isCurrent = index === currentStep;
              return (
                <div
                  key={index}
                  className={`trk-step ${isDone ? 'trk-step-done' : ''} ${isCurrent ? 'trk-step-current' : ''}`}
                >
                  <div className="trk-step-dot-wrapper">
                    <div className="trk-step-dot">
                      {isDone ? '✓' : isCurrent ? <span className="trk-step-pulse" /> : ''}
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`trk-connector ${isDone ? 'trk-connector-done' : ''}`} />
                    )}
                  </div>
                  <div className="trk-step-content">
                    <span className="trk-step-label">{step.label}</span>
                    {isCurrent && (
                      <motion.span
                        className="trk-step-time"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        In progress...
                      </motion.span>
                    )}
                    {isDone && (
                      <span className="trk-step-time trk-step-completed-time">
                        Completed
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <AnimatePresence>
            {donorVisible && (
              <motion.div
                className="trk-donor-card"
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
              >
                <div className="trk-donor-header">
                  <span className="trk-donor-badge">Donor Found</span>
                </div>
                <div className="trk-donor-info">
                  <div className="trk-donor-avatar">
                    {donor.name.charAt(0)}
                  </div>
                  <div className="trk-donor-details">
                    <h4 className="trk-donor-name">
                      {donor.name}
                      {donor.verified && <span className="trk-verified">✓</span>}
                    </h4>
                    <p className="trk-donor-meta">
                      {donor.bloodGroup} • {donor.distance} away • {donor.donated}
                    </p>
                  </div>
                  <button className="trk-call-btn">📞 Call</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="trk-emergency-card">
            <span className="trk-emergency-icon">🚨</span>
            <div>
              <h4 className="trk-emergency-title">Need Immediate Help?</h4>
              <p className="trk-emergency-text">
                Contact our 24/7 emergency helpline for urgent assistance.
              </p>
            </div>
            <button className="trk-emergency-btn">Call Now</button>
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default TrackRequest;
