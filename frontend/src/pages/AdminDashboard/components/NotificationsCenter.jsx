import { FaBroadcastTower } from 'react-icons/fa'

const NotificationsCenter = ({ notifications, alertForm, setAlertForm, broadcastMsg, onSendBroadcast }) => {
  return (
    <div className="tab-panel">
      <div className="notification-composer-grid">
        <form className="notification-form" onSubmit={onSendBroadcast}>
          <h3>Send Emergency Alert Broadcast</h3>
          {broadcastMsg && <div className="broadcast-msg-banner">{broadcastMsg}</div>}

          <div className="form-group">
            <label htmlFor="targetGroup">Target Blood Group</label>
            <select
              id="targetGroup"
              value={alertForm.targetGroup}
              onChange={(e) => setAlertForm(prev => ({ ...prev, targetGroup: e.target.value }))}
            >
              <option value="all">All Groups</option>
              <option value="O+">O+</option><option value="A+">A+</option><option value="B+">B+</option><option value="AB+">AB+</option>
              <option value="O-">O-</option><option value="A-">A-</option><option value="B-">B-</option><option value="AB-">AB-</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="targetCity">Target City</label>
            <input
              id="targetCity"
              type="text"
              placeholder="e.g. Chennai"
              value={alertForm.targetCity}
              onChange={(e) => setAlertForm(prev => ({ ...prev, targetCity: e.target.value }))}
            />
          </div>

          <div className="form-group">
            <label htmlFor="alertMessage">Alert Notification Message</label>
            <textarea
              id="alertMessage"
              placeholder="Write urgent message content..."
              value={alertForm.message}
              onChange={(e) => setAlertForm(prev => ({ ...prev, message: e.target.value }))}
            />
          </div>

          <button type="submit" className="broadcast-submit-btn"><FaBroadcastTower /> Send Alert</button>
        </form>

        <div className="notification-history-card">
          <h3>Sent Alerts History</h3>
          <div className="alert-history-list">
            {notifications.map(n => (
              <div className="alert-history-row" key={n.id}>
                <div className="alert-meta">
                  <span className="meta-badge">{n.targetGroup}</span>
                  <span className="meta-city">{n.targetCity}</span>
                  <span className="meta-time">{n.sentAt}</span>
                </div>
                <p className="alert-text">{n.message}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default NotificationsCenter
