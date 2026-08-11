import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import RequesterNavbar from '../../components/Requester/RequesterNavbar';
import Footer from '../../components/Footer/Footer';
import { useRequester } from '../../context/RequesterContext';
import { getBloodRequest } from '../../services/requesterService';
import './TrackRequest.css';

const STATUS_STEPS = [
  { status: 'submitted',   label: 'Submitted' },
  { status: 'searching',   label: 'Searching' },
  { status: 'notified',    label: 'Donors Notified' },
  { status: 'accepted',    label: 'Donor Accepted' },
  { status: 'donated',     label: 'Blood Donated' },
  { status: 'completed',   label: 'Completed' },
]

const currentStepIndex = (status) => {
  const idx = STATUS_STEPS.findIndex((s) => s.status === status)
  return idx === -1 ? 0 : idx
}

const TrackRequest = () => {
  const location = useLocation();
const navigate = useNavigate();
  const { user } = useRequester();
  const latestRequest = location.state?.request || location.state?.requestData;

  const [requestData, setRequestData] = useState(latestRequest || null);
  const currentStep = currentStepIndex(requestData?.status);

  useEffect(() => {
    if (!user) {
      navigate('/requester/login');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (!requestData?.id) return;

    const fetch = async () => {
      try {
        const synced = await getBloodRequest(requestData.id)
        setRequestData(synced)
      } catch (err) {
        console.error('Failed to sync blood request status', err)
      }
    }

    fetch()
    const interval = setInterval(fetch, 8000)
    return () => clearInterval(interval)
  }, [requestData?.id])

  if (!user) return null;

  if (!requestData) return (
    <div className="requester-page">
      <RequesterNavbar />
      <main className="trk-container">
        <div className="trk-card" style={{ textAlign: 'center', padding: '60px 40px' }}>
          <h2 style={{ color: '#6B7280' }}>No active request to track.</h2>
          <button className="req-confirm-btn req-confirm-btn--primary" style={{ marginTop: 20 }} onClick={() => navigate('/requester/request-blood')}>Request Blood</button>
        </div>
      </main>
      <Footer />
    </div>
  );

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

          {(requestData?.status === 'approved' || requestData?.status === 'completed') && (
            <div className="trk-bank-banner trk-bank-banner--approved">
              <span>✔</span>
              <p>
                <strong>{requestData.status === 'completed' ? 'Request completed' : 'Approved by blood bank'}</strong>
                {requestData.status === 'approved' && ' — your blood units are reserved and being prepared.'}
                {requestData.status === 'completed' && ' — your blood units have been delivered to the hospital.'}
              </p>
            </div>
          )}

          {requestData?.status === 'rejected' && (
            <div className="trk-bank-banner trk-bank-banner--rejected">
              <span>✕</span>
              <p>
                <strong>Rejected by blood bank</strong>
                {requestData.rejectionReason ? ` — ${requestData.rejectionReason}` : '.'}
              </p>
            </div>
          )}

          <div className="trk-map-placeholder">
            <div className="trk-map-pulse trk-map-pulse-1" />
            <div className="trk-map-pulse trk-map-pulse-2" />
            <div className="trk-map-dot" />
            <p className="trk-map-text">Live tracking map</p>
            <p className="trk-map-subtext">Donors within 10 km radius</p>
          </div>

          <div className="trk-timeline">
            {STATUS_STEPS.map((step, index) => {
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
                    {index < STATUS_STEPS.length - 1 && (
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

          {currentStep >= 3 && (
            <motion.div
              className="trk-donor-card"
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.4 }}
            >
              <div className="trk-donor-header">
                <span className="trk-donor-badge">Donor Found</span>
              </div>
              <div className="trk-donor-info">
                <div className="trk-donor-avatar">D</div>
                <div className="trk-donor-details">
                  <h4 className="trk-donor-name">Donor assigned</h4>
                  <p className="trk-donor-meta">{requestData?.bloodGroup} required</p>
                </div>
                <button className="trk-call-btn">📞 Call</button>
              </div>
            </motion.div>
          )}

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
