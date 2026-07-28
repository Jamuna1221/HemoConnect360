import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaCalendarAlt, FaFilter, FaHistory, FaHospital, FaSearch, FaTint } from 'react-icons/fa';
import RequesterNavbar from '../../components/Requester/RequesterNavbar';
import Footer from '../../components/Footer/Footer';
import { useRequester } from '../../context/RequesterContext';
import './RequestHistory.css';

const RequestHistory = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [bloodFilter, setBloodFilter] = useState('all');
  const { user, requests } = useRequester();

  useEffect(() => {
    if (!user) {
      navigate('/requester/login');
    }
  }, [user, navigate]);

  if (!user) return null;

  const filteredRequests = requests.filter((req) => {
    const hospitalName = req.hospitalName || '';
    const matchesSearch =
      req.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      hospitalName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || req.status === statusFilter;
    const matchesBlood = bloodFilter === 'all' || req.bloodGroup === bloodFilter;
    return matchesSearch && matchesStatus && matchesBlood;
  });

  return (
    <div className="req-history-page">
      <RequesterNavbar />
      <main className="req-history-main">
        <motion.div
          className="req-history-container"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="req-history-top">
            <h1><FaHistory /> Request History</h1>
            <span className="req-history-count">{filteredRequests.length} request(s)</span>
          </div>

          <div className="req-history-filters">
            <div className="req-history-search">
              <FaSearch className="req-history-search-icon" />
              <input
                type="text"
                placeholder="Search by Request ID or Hospital..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="req-history-filter-group">
              <FaFilter className="req-history-filter-icon" />
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                {['all', 'submitted', 'searching', 'completed', 'cancelled'].map((s) => (
                  <option key={s} value={s}>{s === 'all' ? 'All Status' : s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </div>
            <div className="req-history-filter-group">
              <FaTint className="req-history-filter-icon" />
              <select value={bloodFilter} onChange={(e) => setBloodFilter(e.target.value)}>
                {['all', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((b) => (
                  <option key={b} value={b}>{b === 'all' ? 'All Blood Groups' : b}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="req-history-list">
            {filteredRequests.length === 0 ? (
              <div className="req-history-empty">
                <FaTint className="req-history-empty-icon" />
                <h2>No Requests Found</h2>
                <p>No blood requests match your current filters.</p>
                <button type="button" className="req-history-empty-btn" onClick={() => navigate('/requester/request-blood')}>Request Blood</button>
              </div>
            ) : (
              filteredRequests.map((req, index) => (
                <motion.div
                  key={req.id}
                  className="req-history-card"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <div className="req-history-card-left">
                    <div className="req-history-card-blood"><FaTint /><strong>{req.bloodGroup}</strong></div>
                    <div className="req-history-card-info">
                      <h3>{req.patientName}</h3>
                      <p className="req-history-card-id">{req.id}</p>
                      <p className="req-history-card-hospital"><FaHospital /> {req.hospitalName}</p>
                    </div>
                  </div>
                  <div className="req-history-card-right">
                    <div className="req-history-card-meta">
                      <span>
                        {req.units} unit(s) <span className="req-history-card-separator">|</span> {req.priority}
                      </span>
                      <span><FaCalendarAlt /> {new Date(req.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      <span className={`req-history-status req-history-status--${req.status}`}>{req.status}</span>
                    </div>
                    <button
                      className="req-history-view-btn"
                      onClick={() => navigate(`/requester/request-details/${req.id}`)}
                    >
                      View
                    </button>
                  </div>
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
