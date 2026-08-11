import { useState } from 'react'
import { FaTint, FaHospital, FaExclamationTriangle, FaCheckCircle, FaChartBar, FaSearch, FaRedoAlt } from 'react-icons/fa'

const BloodStock = ({ bloodBanks, onStockUpdate, readOnly = false }) => {
  const [selectedBankId, setSelectedBankId] = useState(bloodBanks[0]?.id || '')
  const [statusFilter, setStatusFilter] = useState('all') // 'all', 'critical', 'low', 'normal'
  const [searchQuery, setSearchQuery] = useState('')

  const selectedBank = bloodBanks.find(b => b.id === selectedBankId)
  const stock = selectedBank?.stock || []

  // Helper to determine status class and text
  const getStockStatus = (available) => {
    if (available >= 15) return { text: 'Normal', class: 'status-badge--completed', color: '#16a34a' }
    if (available >= 5) return { text: 'Low', class: 'status-badge--searching', color: '#ca8a04' }
    return { text: 'Critical', class: 'status-badge--suspended', color: '#dc2626' }
  }

  // Calculate quick stats
  const totalAvailable = stock.reduce((sum, s) => sum + s.available, 0)
  const totalReserved = stock.reduce((sum, s) => sum + s.reserved, 0)
  
  const criticalCount = stock.filter(s => s.available < 5).length
  const lowCount = stock.filter(s => s.available >= 5 && s.available < 15).length
  const normalCount = stock.filter(s => s.available >= 15).length

  // Filtered stock list
  const filteredStock = stock.filter(s => {
    const status = getStockStatus(s.available).text.toLowerCase()
    const matchesFilter = statusFilter === 'all' || status === statusFilter
    const matchesSearch = s.group.toLowerCase().includes(searchQuery.toLowerCase().trim())
    return matchesFilter && matchesSearch
  })

  // Find max available units to scale the chart bars
  const maxAvailable = stock.length > 0 ? Math.max(...stock.map(s => s.available)) : 100
  const chartScale = maxAvailable > 0 ? maxAvailable : 1

  // Handle Quick Bulk Refill for critical stocks
  const handleBulkRefill = () => {
    if (!selectedBank || readOnly) return
    stock.forEach(s => {
      if (s.available < 15) {
        const diff = 15 - s.available
        onStockUpdate(selectedBankId, s.group, 'available', diff)
      }
    })
  }

  return (
    <div className="tab-panel">
      {/* ─── TOOLBAR & BANK SELECTOR ─── */}
      <div className="data-toolbar" style={{ justifyContent: 'space-between', gap: '15px', flexWrap: 'wrap' }}>
        <div className="filter-wrap" style={{ minWidth: '300px' }}>
          <FaHospital />
          <select
            value={selectedBankId}
            onChange={(e) => {
              setSelectedBankId(e.target.value)
              setStatusFilter('all')
              setSearchQuery('')
            }}
            style={{ width: '100%', cursor: 'pointer' }}
          >
            <option value="" disabled>Select a Blood Bank</option>
            {bloodBanks.map(b => (
              <option key={b.id} value={b.id}>{b.name} ({b.city})</option>
            ))}
          </select>
        </div>

        {selectedBank && criticalCount > 0 && !readOnly && (
          <button 
            className="action-btn-status action-btn-status--activate" 
            onClick={handleBulkRefill}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 16px' }}
          >
            <FaRedoAlt /> Refill Critical Stocks (Set to 15)
          </button>
        )}
      </div>

      {selectedBank ? (
        <>
          <p className="tab-info-text">
            Viewing inventory levels for <strong>{selectedBank.name}</strong>. {readOnly ? 'View inventory levels and live stock distribution below.' : 'Adjust values below to modify live stock.'}
          </p>

          {/* ─── SUMMARY CARDS GRID ─── */}
          <div className="admin-stats-grid" style={{ marginBottom: '24px' }}>
            <div className="stat-card" onClick={() => setStatusFilter('all')}>
              <div className="stat-icon stat-icon--blue">
                <FaTint />
              </div>
              <div className="stat-info">
                <h3>{totalAvailable + totalReserved}</h3>
                <p>Total Units ({totalAvailable} Avail)</p>
              </div>
            </div>

            <div className="stat-card" onClick={() => setStatusFilter('critical')} style={{ borderColor: criticalCount > 0 ? '#fca5a5' : '#e2e8f0', background: criticalCount > 0 ? '#fff5f5' : '#ffffff' }}>
              <div className="stat-icon" style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca' }}>
                <FaExclamationTriangle />
              </div>
              <div className="stat-info">
                <h3 style={{ color: criticalCount > 0 ? '#dc2626' : 'inherit' }}>{criticalCount}</h3>
                <p>Critical Alert (&lt; 5 units)</p>
              </div>
            </div>

            <div className="stat-card" onClick={() => setStatusFilter('low')}>
              <div className="stat-icon" style={{ background: '#fef9c3', color: '#ca8a04', border: '1px solid #fef08a' }}>
                <FaExclamationTriangle />
              </div>
              <div className="stat-info">
                <h3>{lowCount}</h3>
                <p>Low Supply (5-14 units)</p>
              </div>
            </div>

            <div className="stat-card" onClick={() => setStatusFilter('normal')}>
              <div className="stat-icon" style={{ background: '#dcfce7', color: '#16a34a', border: '1px solid #bbf7d0' }}>
                <FaCheckCircle />
              </div>
              <div className="stat-info">
                <h3>{normalCount}</h3>
                <p>Fully Stocked (&ge; 15 units)</p>
              </div>
            </div>
          </div>

          {/* ─── FILTERS AND SEARCH BAR ─── */}
          <div className="data-toolbar" style={{ marginBottom: '20px', gap: '12px', flexWrap: 'wrap' }}>
            <div className="search-wrap" style={{ flexGrow: 1, maxWidth: '350px' }}>
              <FaSearch />
              <input 
                type="text" 
                placeholder="Search blood group (e.g. O+, A-)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button 
                className={`action-btn-status ${statusFilter === 'all' ? 'action-btn-status--view' : ''}`}
                onClick={() => setStatusFilter('all')}
                style={{ background: statusFilter === 'all' ? '#eff6ff' : '#f1f5f9', color: statusFilter === 'all' ? '#2563eb' : '#475569', border: '1px solid #cbd5e1' }}
              >
                All Groups
              </button>
              <button 
                className={`action-btn-status ${statusFilter === 'critical' ? 'action-btn-status--suspend' : ''}`}
                onClick={() => setStatusFilter('critical')}
                style={{ background: statusFilter === 'critical' ? '#fee2e2' : '#f1f5f9', color: statusFilter === 'critical' ? '#b91c1c' : '#475569', border: '1px solid #cbd5e1' }}
              >
                Critical ({criticalCount})
              </button>
              <button 
                className={`action-btn-status ${statusFilter === 'low' ? 'action-btn-status--searching' : ''}`}
                onClick={() => setStatusFilter('low')}
                style={{ background: statusFilter === 'low' ? '#fef9c3' : '#f1f5f9', color: statusFilter === 'low' ? '#854d0e' : '#475569', border: '1px solid #cbd5e1' }}
              >
                Low ({lowCount})
              </button>
              <button 
                className={`action-btn-status ${statusFilter === 'normal' ? 'action-btn-status--activate' : ''}`}
                onClick={() => setStatusFilter('normal')}
                style={{ background: statusFilter === 'normal' ? '#dcfce7' : '#f1f5f9', color: statusFilter === 'normal' ? '#15803d' : '#475569', border: '1px solid #cbd5e1' }}
              >
                Normal ({normalCount})
              </button>
            </div>
          </div>

          {/* ─── 1. VISUAL CARDS GRID ─── */}
          {filteredStock.length > 0 ? (
            <div className="stock-visual-grid">
              {filteredStock.map(s => {
                const statusInfo = getStockStatus(s.available)
                const totalUnits = s.available + s.reserved
                const progressPercent = Math.min(100, (s.available / (totalUnits || 1)) * 100)

                return (
                  <div key={s.group} className="stock-card-premium" style={{ borderLeft: `5px solid ${statusInfo.color}` }}>
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
                        {readOnly ? (
                          <strong>{s.available} Units</strong>
                        ) : (
                          <div className="counter-controls">
                            <button 
                              className="counter-adjust-btn" 
                              onClick={() => onStockUpdate(selectedBankId, s.group, 'available', -1)}
                              disabled={s.available <= 0}
                              style={{ opacity: s.available <= 0 ? 0.5 : 1, cursor: s.available <= 0 ? 'not-allowed' : 'pointer' }}
                            >-</button>
                            <strong>{s.available}</strong>
                            <button className="counter-adjust-btn" onClick={() => onStockUpdate(selectedBankId, s.group, 'available', 1)}>+</button>
                          </div>
                        )}
                      </div>

                      <div className="stock-data-row">
                        <span>Reserved Units:</span>
                        {readOnly ? (
                          <strong>{s.reserved} Units</strong>
                        ) : (
                          <div className="counter-controls">
                            <button 
                              className="counter-adjust-btn" 
                              onClick={() => onStockUpdate(selectedBankId, s.group, 'reserved', -1)}
                              disabled={s.reserved <= 0}
                              style={{ opacity: s.reserved <= 0 ? 0.5 : 1, cursor: s.reserved <= 0 ? 'not-allowed' : 'pointer' }}
                            >-</button>
                            <strong>{s.reserved}</strong>
                            <button className="counter-adjust-btn" onClick={() => onStockUpdate(selectedBankId, s.group, 'reserved', 1)}>+</button>
                          </div>
                        )}
                      </div>

                      <div className="stock-progress-wrap">
                        <div className="progress-labels">
                          <span>Avail: {Math.round(progressPercent)}%</span>
                          <span>Res: {100 - Math.round(progressPercent)}%</span>
                        </div>
                        <div className="stock-progress-track">
                          <div className="stock-progress-fill" style={{ width: `${progressPercent}%`, background: statusInfo.color }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="empty-text" style={{ padding: '30px', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
              No blood groups match the selected filters.
            </p>
          )}

          {/* ─── 2. BLOOD STOCK CHART ─── */}
          <section className="stock-chart-section-card">
            <h3><FaChartBar /> Stock Level Chart - {selectedBank.name}</h3>
            <div className="blood-stock-bar-chart">
              {stock.map(s => {
                const barWidthPercent = (s.available / chartScale) * 100
                const statusInfo = getStockStatus(s.available)

                return (
                  <div key={s.group} className="stock-chart-bar-row">
                    <span className="chart-group-lbl">{s.group}</span>
                    <div className="chart-bar-track-wrap">
                      <div
                        className="chart-bar-fill-dynamic"
                        style={{ width: `${Math.max(5, barWidthPercent)}%`, background: statusInfo.color }}
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
