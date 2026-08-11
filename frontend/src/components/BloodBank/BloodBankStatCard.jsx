import { useEffect, useState } from 'react'
import './BloodBankStatCard.css'

/**
 * Self-contained summary card for the Blood Bank dashboard. Each card owns its
 * own loading / error state so one failing statistic never takes down the
 * others. The `loader` prop must be a stable function reference (no inline
 * arrows) so the fetch effect does not re-run every render.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.icon - icon element shown in the card accent
 * @param {string} props.title - short uppercase stat label
 * @param {string} props.description - supporting line under the value
 * @param {() => Promise<number>} props.loader - resolves to the stat value
 */
const BloodBankStatCard = ({ icon, title, description, loader }) => {
  const [value, setValue] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let active = true

    loader()
      .then((result) => {
        if (!active) return
        setValue(result)
        setError('')
      })
      .catch((err) => {
        if (!active) return
        setValue(null)
        setError(err.message || 'Unable to load')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [loader, reloadKey])

  const retry = () => {
    setLoading(true)
    setError('')
    setReloadKey((key) => key + 1)
  }

  return (
    <section className="bloodbank-stat-card">
      <div className="bloodbank-stat-card-icon">{icon}</div>
      <div className="bloodbank-stat-card-body">
        <span className="bloodbank-stat-card-title">{title}</span>
        {loading ? (
          <div className="bloodbank-stat-card-skeleton" />
        ) : error ? (
          <>
            <strong className="bloodbank-stat-card-error">Unable to load</strong>
            <button type="button" className="bloodbank-stat-card-retry" onClick={retry}>
              Retry
            </button>
          </>
        ) : (
          <strong className="bloodbank-stat-card-value">{value}</strong>
        )}
        <p className="bloodbank-stat-card-desc">{description}</p>
      </div>
    </section>
  )
}

export default BloodBankStatCard
