const StatCard = ({ icon, label, value, tone = 'red', onClick }) => {
  return (
    <div className={`stat-card ${onClick ? 'stat-card--clickable' : ''}`} onClick={onClick}>
      <div className={`stat-icon stat-icon--${tone}`}>{icon}</div>
      <div className="stat-info">
        <h3>{value}</h3>
        <p>{label}</p>
      </div>
    </div>
  )
}

export default StatCard
