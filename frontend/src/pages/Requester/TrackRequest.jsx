import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import RequesterNavbar from '../../components/Requester/RequesterNavbar';
import Footer from '../../components/Footer/Footer';
import { useRequester } from '../../context/RequesterContext';
import {
  getBloodRequest,
  listBloodRequests,
} from '../../services/requesterService';
import './TrackRequest.css';

const STATUS_STEPS = [
  { status: 'submitted', label: 'Submitted' },
  { status: 'searching', label: 'Searching' },
  { status: 'notified', label: 'Donors Notified' },
  { status: 'accepted', label: 'Donor Accepted' },
  { status: 'approved', label: 'Approved by Blood Bank' },
  { status: 'donated', label: 'Blood Donated' },
  { status: 'completed', label: 'Completed' },
];

const currentStepIndex = (status) => {
  const normalizedStatus =
    status === 'searching_donors'
      ? 'searching'
      : status === 'donor_accepted'
        ? 'accepted'
        : status;

  const idx = STATUS_STEPS.findIndex(
    (step) => step.status === normalizedStatus
  );

  return idx === -1 ? 0 : idx;
};

const TrackRequest = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const { user, requests } = useRequester();

  const latestRequest =
    location.state?.request || location.state?.requestData;

  const [requestData, setRequestData] = useState(latestRequest || null);
  const [loadError, setLoadError] = useState('');

  const currentStep = currentStepIndex(requestData?.status);

  const timeline = requestData?.timeline?.length
    ? requestData.timeline
    : STATUS_STEPS.map((step, index) => ({
        ...step,
        completed: index < currentStep,
        time: index < currentStep ? 'Completed' : null,
      }));

  // Redirect unauthenticated users to requester login
  useEffect(() => {
    if (!user) {
      navigate('/requester/login');
    }
  }, [user, navigate]);

  // Load the latest request if no request was passed through navigation state
  useEffect(() => {
    if (!user || requestData?.id) return;

    const loadLatestRequest = async () => {
      try {
        const serverRequests = await listBloodRequests();

        const latest =
          serverRequests?.[0] || requests?.[0] || null;

        if (latest) {
          setRequestData(latest);
        }
      } catch (error) {
        console.error(
          '[track-request] Failed to load latest request',
          error
        );

        if (requests?.[0]) {
          setRequestData(requests[0]);
        } else {
          setLoadError(
            error.message ||
              'Unable to load your request timeline.'
          );
        }
      }
    };

    loadLatestRequest();
  }, [user, requestData?.id, requests]);

  // Keep the request status synchronized with the backend
  useEffect(() => {
    if (!requestData?.id) return;

    const fetchLatestRequest = async () => {
      try {
        const synced = await getBloodRequest(requestData.id);

        setRequestData(synced);
        setLoadError('');
      } catch (error) {
        console.error(
          '[TrackRequest] Failed to fetch updated blood request details',
          error
        );

        setLoadError(
          error.message ||
            'Unable to refresh your request timeline.'
        );
      }
    };

    fetchLatestRequest();

    const interval = setInterval(fetchLatestRequest, 8000);

    return () => clearInterval(interval);
  }, [requestData?.id]);

  if (!user) {
    return null;
  }

  // No request available
  if (!requestData) {
    return (
      <div className="requester-page">
        <RequesterNavbar />

        <main className="trk-container">
          <div
            className="trk-card"
            style={{
              textAlign: 'center',
              padding: '60px 40px',
            }}
          >
            <h2 style={{ color: '#6B7280' }}>
              {loadError || 'No active request to track.'}
            </h2>

            <button
              className="req-confirm-btn req-confirm-btn--primary"
              style={{ marginTop: 20 }}
              onClick={() =>
                navigate('/requester/request-blood')
              }
            >
              Request Blood
            </button>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

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
          {/* Header */}
          <div className="trk-header">
            <h2 className="trk-title">
              Track Your Request
            </h2>

            <span className="trk-request-id">
              {requestData?.id || 'No active request'}
            </span>
          </div>

          {/* Blood Bank Approved / Completed Banner */}
          {(requestData?.status === 'approved' ||
            requestData?.status === 'completed') && (
            <div className="trk-bank-banner trk-bank-banner--approved">
              <span>✔</span>

              <p>
                <strong>
                  {requestData.status === 'completed'
                    ? 'Request completed'
                    : 'Approved by blood bank'}
                </strong>

                {requestData.status === 'approved' &&
                  ' — your blood units are reserved and being prepared.'}

                {requestData.status === 'completed' &&
                  ' — your blood units have been delivered to the hospital.'}
              </p>
            </div>
          )}

          {/* Blood Bank Rejected Banner */}
          {requestData?.status === 'rejected' && (
            <div className="trk-bank-banner trk-bank-banner--rejected">
              <span>✕</span>

              <p>
                <strong>
                  Rejected by blood bank
                </strong>

                {requestData.rejectionReason
                  ? ` — ${requestData.rejectionReason}`
                  : '.'}
              </p>
            </div>
          )}

          {/* Map Placeholder */}
          <div className="trk-map-placeholder">
            <div className="trk-map-pulse trk-map-pulse-1" />
            <div className="trk-map-pulse trk-map-pulse-2" />
            <div className="trk-map-dot" />

            <p className="trk-map-text">
              Live tracking map
            </p>

            <p className="trk-map-subtext">
              Donors within 10 km radius
            </p>
          </div>

          {/* Request Timeline */}
          <div className="trk-timeline">
            {timeline.map((step, index) => {
              const isDone =
                step.completed || index < currentStep;

              const isCurrent =
                index === currentStep;

              return (
                <div
                  key={index}
                  className={`trk-step ${
                    isDone ? 'trk-step-done' : ''
                  } ${
                    isCurrent
                      ? 'trk-step-current'
                      : ''
                  }`}
                >
                  <div className="trk-step-dot-wrapper">
                    <div className="trk-step-dot">
                      {isDone ? (
                        '✓'
                      ) : isCurrent ? (
                        <span className="trk-step-pulse" />
                      ) : (
                        ''
                      )}
                    </div>

                    {index < timeline.length - 1 && (
                      <div
                        className={`trk-connector ${
                          isDone
                            ? 'trk-connector-done'
                            : ''
                        }`}
                      />
                    )}
                  </div>

                  <div className="trk-step-content">
                    <span className="trk-step-label">
                      {step.label}
                    </span>

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

          {/* Donor Information */}
          {currentStep >= 3 && (
            <motion.div
              className="trk-donor-card"
              initial={{
                opacity: 0,
                y: 20,
                scale: 0.95,
              }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
              }}
              transition={{ duration: 0.4 }}
            >
              <div className="trk-donor-header">
                <span className="trk-donor-badge">
                  Donor Found
                </span>
              </div>

              <div className="trk-donor-info">
                <div className="trk-donor-avatar">
                  D
                </div>

                <div className="trk-donor-details">
                  <h4 className="trk-donor-name">
                    Donor assigned
                  </h4>

                  <p className="trk-donor-meta">
                    {requestData?.bloodGroup} required
                  </p>
                </div>

                <button className="trk-call-btn">
                  📞 Call
                </button>
              </div>
            </motion.div>
          )}

          {/* Emergency Help */}
          <div className="trk-emergency-card">
            <span className="trk-emergency-icon">
              🚨
            </span>

            <div>
              <h4 className="trk-emergency-title">
                Need Immediate Help?
              </h4>

              <p className="trk-emergency-text">
                Contact our 24/7 emergency helpline for
                urgent assistance.
              </p>
            </div>

            <button className="trk-emergency-btn">
              Call Now
            </button>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
};

export default TrackRequest;