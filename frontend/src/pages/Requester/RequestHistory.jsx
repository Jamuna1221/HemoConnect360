import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from '../../components/Navbar/Navbar';
import Footer from '../../components/Footer/Footer';
import './RequestHistory.css';

const mockRequests = [
  {
    id: 'REQ-2026-4821',
    bloodGroup: 'A+',
    units: 2,
    hospital: 'City General Hospital',
    date: '2026-07-25',
    status: 'searching',
    urgency: 'urgent',
    patientName: 'John Smith',
  },
  {
    id: 'REQ-2026-4798',
    bloodGroup: 'O-',
    units: 3,
    hospital: 'Metro Medical Center',
    date: '2026-07-22',
    status: 'completed',
    urgency: 'critical',
    patientName: 'Sarah Lee',
  },
  {
    id: 'REQ-2026-4756',
    bloodGroup: 'B+',
    units: 1,
    hospital: 'St. Mary\'s Hospital',
    date: '2026-07-18',
    status: 'completed',
    urgency: 'normal',
    patientName: 'Mike Johnson',
  },
  {
    id: 'REQ-2026-4701',
    bloodGroup: 'AB+',
    units: 2,
    hospital: 'Lakeside Clinic',
    date: '2026-07-14',
    status: 'cancelled',
    urgency: 'urgent',
    patientName: 'Emma Davis',
  },
  {
    id: 'REQ-2026-4689',
    bloodGroup: 'A-',
    units: 4,
    hospital: 'City General Hospital',
    date: '2026-07-10',
    status: 'completed',
    urgency: 'critical',
    patientName: 'David Wilson',
  },
  {
    id: 'REQ-2026-4650',
    bloodGroup: 'O+',
    units: 1,
    hospital: 'Metro Medical Center',
    date: '2026-07-05',
    status: 'completed',
    urgency: 'normal',
    patientName: 'Lisa Brown',
  },
];

const RequestHistory = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [bloodFilter, setBloodFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem('requesterSession')) {
      navigate('/requester/login');
    }
  }, [navigate]);

  const filteredRequests = mockRequests.filter((req) => {
    const matchesSearch =
      req.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.hospital.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || req.status === statusFilter;
    const matchesBlood = bloodFilter === 'all' || req.bloodGroup === bloodFilter;
    return matchesSearch && matchesStatus && matchesBlood;
  });

  const statusColors = {
    searching: 'rh-badge-searching',
    completed: 'rh-badge-completed',
    cancelled: 'rh-badge-cancelled',
  };

  const urgencyColors = {
    critical: 'rh-urgency-critical',
    urgent: 'rh-urgency-urgent',
    normal: 'rh-urgency-normal',
  };

  return (
    <div className="requester-page">
      <Navbar />
      <main className="rh-container">
        <motion.div
          className="rh-card"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="rh-title">Request History</h2>

          <div className="rh-toolbar">
            <div className="rh-search-box">
              <span className="rh-search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search by Request ID or Hospital..."
                className="rh-search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button
              className={`rh-filter-toggle ${showFilters ? 'rh-filter-active' : ''}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              ⚙ Filters
            </button>
          </div>

          {showFilters && (
            <motion.div
              className="rh-filter-panel"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div className="rh-filter-group">
                <label className="rh-filter-label">Status</label>
                <div className="rh-filter-options">
                  {['all', 'searching', 'completed', 'cancelled'].map((s) => (
                    <button
                      key={s}
                      className={`rh-filter-btn ${statusFilter === s ? 'rh-filter-btn-active' : ''}`}
                      onClick={() => setStatusFilter(s)}
                    >
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="rh-filter-group">
                <label className="rh-filter-label">Blood Group</label>
                <div className="rh-filter-options">
                  {['all', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((b) => (
                    <button
                      key={b}
                      className={`rh-filter-btn ${bloodFilter === b ? 'rh-filter-btn-active' : ''}`}
                      onClick={() => setBloodFilter(b)}
                    >
                      {b === 'all' ? 'All' : b}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          <div className="rh-list">
            {filteredRequests.length === 0 ? (
              <div className="rh-empty">
                <span className="rh-empty-icon">📭</span>
                <p>No requests found matching your criteria.</p>
              </div>
            ) : (
              filteredRequests.map((req, index) => (
                <motion.div
                  key={req.id}
                  className="rh-request-item"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <div className="rh-item-left">
                    <div className="rh-blood-badge">{req.bloodGroup}</div>
                    <div className="rh-item-info">
                      <div className="rh-item-top">
                        <span className="rh-item-id">{req.id}</span>
                        <span className={`rh-badge ${statusColors[req.status]}`}>
                          {req.status}
                        </span>
                        <span className={`rh-badge ${urgencyColors[req.urgency]}`}>
                          {req.urgency}
                        </span>
                      </div>
                      <p className="rh-item-hospital">{req.hospital}</p>
                      <p className="rh-item-meta">
                        {req.patientName} • {req.units} unit(s) • {new Date(req.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <button
                    className="rh-view-btn"
                    onClick={() => navigate(`/requester/request-details/${req.id}`)}
                  >
                    View →
                  </button>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default RequestHistory;
