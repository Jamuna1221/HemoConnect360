import { useState } from 'react'
import { FaTint, FaInfoCircle, FaHospital } from 'react-icons/fa'

const BloodStock = ({ bloodBanks, onStockUpdate }) => {
  const [selectedBankId, setSelectedBankId] = useState(bloodBanks[0]?.id || '')

  const selectedBank = bloodBanks.find(b => b.id === selectedBankId)
  const stock = selectedBank?.stock || []

  // Helper to determine status class and text
  const getStockStatus = (available) => {
    if (available >= 15) return { text: 'Normal', class: 'status-badge--completed' }
    if (available >= 5) return { text: 'Low', class: 'status-badge--searching' }
    return { text: 'Critical', class: 'status-badge--suspended' }
  }

  // Find max available units to scale the chart bars
  const maxAvailable = stock.length > 0 ? Math.max(...stock.map(s => s.available)) : 100
  const chartScale = maxAvailable > 0 ? maxAvailable : 1

  return (
    <div className="tab-panel">
      <div className="data-toolbar" style={{ justifyContent: 'flex-start', gap: '15px' }}>
        <div className="filter-wrap" style={{ minWidth: '280px' }}>
          <FaHospital />
          <select
            value={selectedBankId}
            onChange={(e) => setSelectedBankId(e.target.value)}
            style={{ width: '100%' }}
          >
            <option value="" disabled>Select a Blood Bank</option>
            {bloodBanks.map(b => (
              <option key={b.id} value={b.id}>{b.name} ({b.city})</option>
            ))}
          </select>
        </div>
      </div>

      {selectedBank ? (
        <>
          <p className="tab-info-text">
            Viewing inventory levels for <strong>{selectedBank.name}</strong>. Adjust values below to modify live stock.
          </p>

          {/* ─── 1. VISUAL CARDS GRID ─── */}
          <div className="stock-visual-grid">
            {stock.map(s => {
              const statusInfo = getStockStatus(s.available)
              const totalUnits = s.available + s.reserved
              const progressPercent = Math.min(100, (s.available / (totalUnits || 1)) * 100)

              return (
                <div key={s.group} className="stock-card-premium">
                  <div className="stock-card-header">
                    <div className="group-avatar-badge">
                      <FaTint />
                      <span>{s.group}</span>
                    </div>
                    <span className={`status-badge ${statusInfo.class}`}>{statusInfo.text}</span>
                  </div>

                  <div className="stock-card-body">
                    <div className="stock-data-row">
                      <span>Available Units:</span>
                      <div className="counter-controls">
                        <button className="counter-adjust-btn" onClick={() => onStockUpdate(selectedBankId, s.group, 'available', -1)}>-</button>
                        <strong>{s.available}</strong>
                        <button className="counter-adjust-btn" onClick={() => onStockUpdate(selectedBankId, s.group, 'available', 1)}>+</button>
                      </div>
                    </div>

                    <div className="stock-data-row">
                      <span>Reserved Units:</span>
                      <div className="counter-controls">
                        <button className="counter-adjust-btn" onClick={() => onStockUpdate(selectedBankId, s.group, 'reserved', -1)}>-</button>
                        <strong>{s.reserved}</strong>
                        <button className="counter-adjust-btn" onClick={() => onStockUpdate(selectedBankId, s.group, 'reserved', 1)}>+</button>
                      </div>
                    </div>

                    <div className="stock-progress-wrap">
                      <div className="progress-labels">
                        <span>Avail: {Math.round(progressPercent)}%</span>
                        <span>Res: {100 - Math.round(progressPercent)}%</span>
                      </div>
                      <div className="stock-progress-track">
                        <div className="stock-progress-fill" style={{ width: `${progressPercent}%` }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* ─── 2. BLOOD STOCK CHART ─── */}
          <section className="stock-chart-section-card">
            <h3><FaInfoCircle /> Stock Level Chart - {selectedBank.name}</h3>
            <div className="blood-stock-bar-chart">
              {stock.map(s => {
                const barWidthPercent = (s.available / chartScale) * 100
                const statusInfo = getStockStatus(s.available)
                let barColor = '#16a34a'
                if (statusInfo.text === 'Low') barColor = '#ca8a04'
                else if (statusInfo.text === 'Critical') barColor = '#dc2626'

                return (
                  <div key={s.group} className="stock-chart-bar-row">
                    <span className="chart-group-lbl">{s.group}</span>
                    <div className="chart-bar-track-wrap">
                      <div
                        className="chart-bar-fill-dynamic"
                        style={{ width: `${Math.max(5, barWidthPercent)}%`, background: barColor }}
                      >
                        <span className="bar-inside-value">{s.available} Units</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        </>
      ) : (
        <p className="empty-text">Please register or select a blood bank to view inventory.</p>
      )}
    </div>
  )
}

export default BloodStock
