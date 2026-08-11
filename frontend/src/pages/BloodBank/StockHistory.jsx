import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FaCalendarAlt,
  FaChevronLeft,
  FaChevronRight,
  FaExclamationTriangle,
  FaHistory,
} from 'react-icons/fa'
import {
  BLOOD_GROUPS,
  INVENTORY_TRANSACTION_TYPES,
  fetchBloodBankStockHistory,
} from '../../services/bloodBankService'
import './BloodBankDashboard.css'
import './StockHistory.css'

const TYPE_META = {
  STOCK_ADDED: { label: 'Added', className: 'stockhist-type--added' },
  STOCK_REMOVED: { label: 'Removed', className: 'stockhist-type--removed' },
  STOCK_CORRECTION: { label: 'Corrected', className: 'stockhist-type--corrected' },
}

const formatDateTime = (value) => {
  if (!value) return '—'
  return new Date(value).toLocaleString()
}

const shortId = (id) => (id ? String(id).slice(0, 8) : '—')

const StockHistory = () => {
  const navigate = useNavigate()

  const [bloodGroup, setBloodGroup] = useState('')
  const [transactionType, setTransactionType] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const [transactions, setTransactions] = useState([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [limit] = useState(10)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let active = true

    const load = async () => {
      try {
        const data = await fetchBloodBankStockHistory({
          bloodGroup,
          transactionType,
          from,
          to,
          page,
          limit,
        })
        if (!active) return
        setTransactions(data.transactions || [])
        setTotal(data.total || 0)
        setTotalPages(data.totalPages || 1)
        setError('')
      } catch (err) {
        if (!active) return
        if (err.status === 401) {
          navigate('/blood-bank/login', { replace: true })
          return
        }
        setError(err.message || 'Unable to load stock history.')
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [navigate, reloadKey, bloodGroup, transactionType, from, to, page, limit])

  const retry = () => {
    setLoading(true)
    setError('')
    setReloadKey((key) => key + 1)
  }

  const changeFilter = (setter) => (e) => {
    setter(e.target.value)
    setPage(1)
  }

  const resetFilters = () => {
    setBloodGroup('')
    setTransactionType('')
    setFrom('')
    setTo('')
    setPage(1)
  }

  const goPrev = () => setPage((p) => Math.max(1, p - 1))
  const goNext = () => setPage((p) => Math.min(totalPages, p + 1))

  const hasFilters = Boolean(bloodGroup || transactionType || from || to)

  return (
    <section className="stockhist">
      <div className="stockhist-head">
        <div>
          <span className="bloodbank-dash-eyebrow">Inventory Audit Trail</span>
          <h2>Stock History</h2>
          <p>
            Real stock movements for your blood bank — manual adjustments, recorded collections and
            fulfilled blood requests.
          </p>
        </div>
        <div className="stockhist-head-total">
          <div className="stockhist-head-total-icon"><FaHistory /></div>
          <div>
            <span>Transactions</span>
            <strong>{total}</strong>
          </div>
        </div>
      </div>

      <div className="stockhist-filters">
        <div className="stockhist-filter">
          <label htmlFor="stockhist-group">Blood Group</label>
          <select id="stockhist-group" value={bloodGroup} onChange={changeFilter(setBloodGroup)}>
            <option value="">All groups</option>
            {BLOOD_GROUPS.map((group) => <option key={group} value={group}>{group}</option>)}
          </select>
        </div>
        <div className="stockhist-filter">
          <label htmlFor="stockhist-type">Transaction Type</label>
          <select id="stockhist-type" value={transactionType} onChange={changeFilter(setTransactionType)}>
            <option value="">All types</option>
            {INVENTORY_TRANSACTION_TYPES.map((type) => (
              <option key={type} value={type}>
                {(TYPE_META[type] || {}).label || type}
              </option>
            ))}
          </select>
        </div>
        <div className="stockhist-filter">
          <label htmlFor="stockhist-from">From</label>
          <input
            id="stockhist-from"
            type="date"
            value={from}
            max={to || undefined}
            onChange={changeFilter(setFrom)}
          />
        </div>
        <div className="stockhist-filter">
          <label htmlFor="stockhist-to">To</label>
          <input
            id="stockhist-to"
            type="date"
            value={to}
            min={from || undefined}
            onChange={changeFilter(setTo)}
          />
        </div>
        <button type="button" className="stockhist-reset" onClick={resetFilters} disabled={!hasFilters}>
          Reset Filters
        </button>
      </div>

      {loading ? (
        <div className="stockhist-loading">
          <div className="bloodbank-dash-spinner" />
          <p>Loading stock history...</p>
        </div>
      ) : error && transactions.length === 0 ? (
        <div className="stockhist-error">
          <FaExclamationTriangle />
          <div>
            <h3>Unable to Load Stock History</h3>
            <p>{error}</p>
          </div>
          <button type="button" className="stockhist-retry" onClick={retry}>Retry</button>
        </div>
      ) : (
        <>
          {error && (
            <div className="stockhist-inline-error">
              <FaExclamationTriangle /> {error}
              <button type="button" className="stockhist-retry" onClick={retry}>Retry</button>
            </div>
          )}

          {transactions.length === 0 ? (
            <div className="stockhist-empty">
              <FaHistory />
              <p>
                {hasFilters
                  ? 'No stock transactions match these filters.'
                  : 'No stock transactions yet. Adjust your inventory to record the first movement.'}
              </p>
            </div>
          ) : (
            <>
              <div className="stockhist-table-wrap">
                <table className="stockhist-table">
                  <thead>
                    <tr>
                      <th>Date &amp; Time</th>
                      <th>Blood Group</th>
                      <th>Type</th>
                      <th className="stockhist-num">Units Changed</th>
                      <th className="stockhist-num stockhist-col-secondary">Previous</th>
                      <th className="stockhist-num stockhist-col-secondary">New</th>
                      <th>Reason / Source</th>
                      <th>Reference ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((transaction) => {
                      const typeMeta =
                        TYPE_META[transaction.transactionType] || {
                          label: transaction.transactionType,
                          className: '',
                        }
                      const change = Number(transaction.quantityChange) || 0
                      const changeClass =
                        change > 0
                          ? 'stockhist-change--plus'
                          : change < 0
                            ? 'stockhist-change--minus'
                            : ''
                      return (
                        <tr key={transaction.id}>
                          <td className="stockhist-cell-date">
                            <FaCalendarAlt /> {formatDateTime(transaction.createdAt)}
                          </td>
                          <td><span className="stockhist-group">{transaction.bloodGroup}</span></td>
                          <td>
                            <span className={`stockhist-type ${typeMeta.className}`}>{typeMeta.label}</span>
                          </td>
                          <td className="stockhist-num">
                            <span className={`stockhist-change ${changeClass}`}>
                              {change > 0 ? `+${change}` : change}
                            </span>
                          </td>
                          <td className="stockhist-num stockhist-col-secondary">{transaction.previousQuantity}</td>
                          <td className="stockhist-num stockhist-col-secondary">{transaction.newQuantity}</td>
                          <td>{transaction.reason}</td>
                          <td className="stockhist-ref" title={transaction.id}>{shortId(transaction.id)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="stockhist-pagination">
                  <button type="button" className="stockhist-page-btn" disabled={page <= 1} onClick={goPrev}>
                    <FaChevronLeft /> Prev
                  </button>
                  <span>
                    Page {page} of {totalPages} · {total} transaction{total === 1 ? '' : 's'}
                  </span>
                  <button type="button" className="stockhist-page-btn" disabled={page >= totalPages} onClick={goNext}>
                    Next <FaChevronRight />
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </section>
  )
}

export default StockHistory
