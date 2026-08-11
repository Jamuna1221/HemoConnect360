const BloodBankPlaceholder = ({ title, description, icon }) => (
  <div className="bloodbank-placeholder">
    <div className="bloodbank-placeholder-icon">{icon}</div>
    <h2>{title}</h2>
    <p>{description}</p>
    <span className="bloodbank-placeholder-tag">Coming in a later step</span>
  </div>
)

export default BloodBankPlaceholder
