const ReportsAnalytics = () => {
  return (
    <div className="tab-panel">
      <p className="tab-info-text">Platform activity analytical graphs and success metrics report modules.</p>
      <section className="reports-analytics-grid">
        <div className="report-card">
          <h3>Donation Fulfilled Success Rate</h3>
          <div className="progress-radial-mock">
            <div className="radial-bar" style={{ background: 'conic-gradient(#E53935 88%, #e2e8f0 0)' }}>
              <div className="radial-center">88%</div>
            </div>
          </div>
          <p>88% of critical requests successfully matched and closed within 2 hours.</p>
        </div>

        <div className="report-card">
          <h3>Monthly Registration Growth</h3>
          <div className="mock-bar-chart">
            <div className="mock-bar" style={{ height: '40%' }}><span>Jun</span></div>
            <div className="mock-bar" style={{ height: '65%' }}><span>Jul</span></div>
            <div className="mock-bar" style={{ height: '90%' }}><span>Aug</span></div>
          </div>
          <p>Donor recruitment initiatives resulted in +35% user signups this month.</p>
        </div>
      </section>
    </div>
  )
}

export default ReportsAnalytics
