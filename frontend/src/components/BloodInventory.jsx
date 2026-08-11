import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FaTint,
  FaPlus,
  FaMinus,
  FaPencilAlt,
  FaTimes,
  FaCheckCircle,
  FaExclamationTriangle,
  FaHistory,
  FaBoxes,
} from 'react-icons/fa'
import {
  BLOOD_GROUPS,
  STOCK_REASONS,
  fetchBloodBankInventory,
  updateBloodBankInventory,
  fetchBloodBankInventoryHistory,
} from '../services/bloodBankService'
import './BloodInventory.css'

const ACTION_OPTIONS = [
  { value: 'add', label: 'Add Units', icon: FaPlus },
  { value: 'remove', label: 'Remove Units', icon: FaMinus },
  { value: 'correct', label: 'Set Exact Count', icon: FaPencilAlt },
]

const statusMeta = {
  AVAILABLE: { label: 'Available', className: 'bloodbank-inv-status--available' },
  LOW_STOCK: { label: 'Low Stock', className: 'bloodbank-inv-status--low-stock' },
  OUT_OF_STOCK: { label: 'Out of Stock', className: 'bloodbank-inv-status--out-of-stock' },
}

const toGroups = (inventory) => {
  const byGroup = Object.fromEntries(inventory.map((item) => [item.bloodGroup, item]))
  return BLOOD_GROUPS.map((bloodGroup) => ({
    bloodGroup,
    unitsAvailable: byGroup[bloodGroup]?.unitsAvailable ?? 0,
    lowStockThreshold: byGroup[bloodGroup]?.lowStockThreshold ?? 3,
    status: byGroup[bloodGroup]?.status ?? 'OUT_OF_STOCK',
  }))
}

const formatReason = (transactionType) =>
  ({ STOCK_ADDED: 'Added', STOCK_REMOVED: 'Removed', STOCK_CORRECTION: 'Corrected' })[transactionType] || transactionType

const BloodInventory = ({ reloadSignal = 0 }) => {
  const navigate = useNavigate()

  const [groups, setGroups] = useState([])
  const [totalUnits, setTotalUnits] = useState(0)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [activeGroup, setActiveGroup] = useState(null)
  const [action, setAction] = useState('add')
  const [quantity, setQuantity] = useState('')
  const [reason, setReason] = useState(STOCK_REASONS[0])
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let active = true

    const fetchData = async () => {
      try {
        const { inventory, totalUnits: total } = await fetchBloodBankInventory()
        if (!active) return
        setGroups(toGroups(inventory))
        setTotalUnits(total)
      } catch (err) {
        if (!active) return
        if (err.status === 401) {
          navigate('/blood-bank/login', { replace: true })
          return
        }
        setError(err.message || 'Unable to load your blood inventory.')
      } finally {
        if (active) setLoading(false)
      }
    }

    const fetchHistory = async () => {
      try {
        const history = await fetchBloodBankInventoryHistory(10)
        if (active) setTransactions(history)
      } catch {
        if (active) setTransactions([])
      }
    }

    fetchData()
    fetchHistory()

    return () => {
      active = false
    }
  }, [navigate, reloadKey, reloadSignal])

  const retry = () => {
    setLoading(true)
    setError('')
    setSuccess('')
    setReloadKey((key) => key + 1)
  }

  const openModal = (bloodGroup) => {
    setActiveGroup(bloodGroup)
    setAction('add')
    setQuantity('')
    setReason(STOCK_REASONS[0])
    setFormError('')
    setModalOpen(true)
  }

  const closeModal = () => {
    if (submitting) return
    setModalOpen(false)
    setActiveGroup(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')

    const parsed = Number(quantity)
    if (!Number.isInteger(parsed) || parsed < 0) {
      setFormError('Enter a whole number of units (0 or more).')
      return
    }
    if ((action === 'add' || action === 'remove') && parsed < 1) {
      setFormError('Quantity must be at least 1.')
      return
    }

    setSubmitting(true)
    try {
      const { inventory, totalUnits: total } = await updateBloodBankInventory({
        bloodGroup: activeGroup,
        action,
        quantity: parsed,
        reason,
      })
      setGroups(toGroups(inventory))
      setTotalUnits(total)
      setSuccess(`${activeGroup} stock updated.`)
      setModalOpen(false)
      setActiveGroup(null)
      setReloadKey((key) => key + 1)
    } catch (err) {
      setFormError(err.message || 'Unable to update inventory. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <section className="bloodbank-inv">
        <div className="bloodbank-inv-loading">
          <div className="bloodbank-dash-spinner" />
          <p>Loading your blood inventory...</p>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="bloodbank-inv">
        <div className="bloodbank-inv-error">
          <FaExclamationTriangle />
          <div>
            <h3>Unable to Load Inventory</h3>
            <p>{error}</p>
          </div>
          <button type="button" className="bloodbank-inv-retry" onClick={retry}>Retry</button>
        </div>
      </section>
    )
  }

  return (
    <section className="bloodbank-inv" id="inventory">
      <div className="bloodbank-inv-head">
        <div>
          <span className="bloodbank-dash-eyebrow">Blood Inventory</span>
          <h2>Available Stock</h2>
          <p>Live unit counts from your blood bank. Status is derived from the current quantity.</p>
        </div>
        <div className="bloodbank-inv-total">
          <div className="bloodbank-inv-total-icon"><FaBoxes /></div>
          <div>
            <span>Total Units</span>
            <strong>{totalUnits}</strong>
          </div>
        </div>
      </div>

      {totalUnits === 0 && (
        <div className="bloodbank-inv-empty">
          <FaTint />
          <p>No stock recorded yet. Add units to any blood group to begin.</p>
        </div>
      )}

      {success && (
        <div className="bloodbank-inv-success">
          <FaCheckCircle /> {success}
        </div>
      )}

      <div className="bloodbank-inv-grid">
        {groups.map(({ bloodGroup, unitsAvailable, status }) => {
          const meta = statusMeta[status] || statusMeta.OUT_OF_STOCK
          return (
            <div className="bloodbank-inv-card" key={bloodGroup}>
              <div className="bloodbank-inv-card-top">
                <span className="bloodbank-inv-group">{bloodGroup}</span>
                <span className={`bloodbank-inv-status ${meta.className}`}>{meta.label}</span>
              </div>
              <div className="bloodbank-inv-units">
                <strong>{unitsAvailable}</strong>
                <span>units</span>
              </div>
              <button
                type="button"
                className="bloodbank-inv-update"
                onClick={() => openModal(bloodGroup)}
              >
                Update Stock
              </button>
            </div>
          )
        })}
      </div>

      {transactions.length > 0 && (
        <div className="bloodbank-inv-history">
          <div className="bloodbank-dash-card-title"><FaHistory /> Recent Movements</div>
          <ul>
            {transactions.map((t) => (
              <li key={t.id}>
                <span className={`bloodbank-inv-history-badge bloodbank-inv-history-badge--${t.transactionType.toLowerCase()}`}>
                  {formatReason(t.transactionType)}
                </span>
                <strong>{t.bloodGroup}</strong>
                <span>
                  {t.quantityChange > 0 ? `+${t.quantityChange}` : t.quantityChange} units
                  {t.reason !== 'Correction' ? ` (${t.reason})` : ''}
                </span>
                <time>{new Date(t.createdAt).toLocaleString()}</time>
              </li>
            ))}
          </ul>
        </div>
      )}

      {modalOpen && activeGroup && (
        <div className="bloodbank-inv-modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) closeModal() }}>
          <div className="bloodbank-inv-modal" role="dialog" aria-modal="true">
            <div className="bloodbank-inv-modal-head">
              <h3>Update Stock — {activeGroup}</h3>
              <button type="button" className="bloodbank-inv-modal-close" onClick={closeModal} aria-label="Close">
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="bloodbank-inv-modal-field">
                <label>Action</label>
                <div className="bloodbank-inv-actions">
                  {ACTION_OPTIONS.map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      type="button"
                      className={action === value ? 'bloodbank-inv-action bloodbank-inv-action--active' : 'bloodbank-inv-action'}
                      onClick={() => { setAction(value); setQuantity(''); setFormError('') }}
                    >
                      <Icon /> {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bloodbank-inv-modal-field">
                <label htmlFor="inv-quantity">
                  {action === 'correct' ? 'Exact unit count' : 'Number of units'}
                </label>
                <input
                  id="inv-quantity"
                  type="number"
                  min="0"
                  step="1"
                  inputMode="numeric"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="0"
                  required
                />
              </div>

              <div className="bloodbank-inv-modal-field">
                <label htmlFor="inv-reason">Reason</label>
                <select id="inv-reason" value={reason} onChange={(e) => setReason(e.target.value)}>
                  {STOCK_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              {formError && (
                <div className="bloodbank-inv-form-error">
                  <FaExclamationTriangle /> {formError}
                </div>
              )}

              <div className="bloodbank-inv-modal-actions">
                <button type="button" className="bloodbank-inv-cancel" onClick={closeModal}>Cancel</button>
                <button type="submit" className="bloodbank-inv-submit" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}

export default BloodInventory
