import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from '../../components/Navbar/Navbar';
import Footer from '../../components/Footer/Footer';
import './RequestConfirmation.css';

const RequestConfirmation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const requestData = location.state?.requestData || {
    requestId: 'REQ-2026-4821',
    bloodGroup: 'A+',
    units: 2,
    hospital: 'City General Hospital',
    patientName: 'John Smith',
    urgency: 'urgent',
  };

  useEffect(() => {
    if (!localStorage.getItem('requesterSession')) {
      navigate('/requester/login');
    }
  }, [navigate]);

  return (
    <div className="requester-page">
      <Navbar />
      <main className="rc-container">
        <motion.div
          className="rc-success-card"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <div className="rc-check-wrapper">
            <div className="rc-pulse-ring rc-pulse-ring-1" />
            <div className="rc-pulse-ring rc-pulse-ring-2" />
            <div className="rc-pulse-ring rc-pulse-ring-3" />
            <motion.div
              className="rc-check-circle"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, duration: 0.4, type: 'spring', stiffness: 200 }}
            >
              <svg viewBox="0 0 52 52" className="rc-check-svg">
                <motion.circle
                  cx="26"
                  cy="26"
                  r="24"
                  fill="none"
                  stroke="#22C55E"
                  strokeWidth="3"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ delay: 0.5, duration: 0.6 }}
                />
                <motion.path
                  d="M15 27l7 7 15-15"
                  fill="none"
                  stroke="#22C55E"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ delay: 0.9, duration: 0.4 }}
                />
              </svg>
            </motion.div>
          </div>

          <motion.h2
            className="rc-title"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            Request Submitted Successfully!
          </motion.h2>
          <p className="rc-subtitle">
            Your blood request has been received and donors are being searched.
          </p>

          <motion.div
            className="rc-info-cards"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <div className="rc-info-card">
              <span className="rc-info-label">Request ID</span>
              <span className="rc-info-value">{requestData.requestId}</span>
            </div>
            <div className="rc-info-card">
              <span className="rc-info-label">Blood Group</span>
              <span className="rc-info-value rc-blood-group">{requestData.bloodGroup}</span>
            </div>
            <div className="rc-info-card">
              <span className="rc-info-label">Units Required</span>
              <span className="rc-info-value">{requestData.units} Units</span>
            </div>
          </motion.div>

          <motion.div
            className="rc-searching-section"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.0 }}
          >
            <div className="rc-searching-header">
              <div className="rc-searching-dots">
                <span className="rc-dot rc-dot-1" />
                <span className="rc-dot rc-dot-2" />
                <span className="rc-dot rc-dot-3" />
              </div>
              <span>Searching for matching donors near you...</span>
            </div>
            <div className="rc-progress-track">
              <motion.div
                className="rc-progress-fill"
                initial={{ width: '0%' }}
                animate={{ width: '45%' }}
                transition={{ delay: 1.2, duration: 2, ease: 'easeInOut' }}
              />
            </div>
            <p className="rc-searching-note">
              We are notifying compatible donors in your area. This may take a few minutes.
            </p>
          </motion.div>

          <motion.div
            className="rc-actions"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.4 }}
          >
            <button
              className="rc-btn rc-btn-track"
              onClick={() => navigate('/requester/track', { state: { requestData } })}
            >
              Track Request
            </button>
            <button
              className="rc-btn rc-btn-dashboard"
              onClick={() => navigate('/requester/dashboard')}
            >
              Go to Dashboard
            </button>
          </motion.div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default RequestConfirmation;
