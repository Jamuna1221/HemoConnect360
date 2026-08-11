import { FaExclamationTriangle, FaInbox } from 'react-icons/fa'

const StateMessage = ({ type = 'empty', message, onRetry }) => {
  return (
    <div className={`admin-state admin-state--${type}`} role={type === 'error' ? 'alert' : undefined}>
      {type === 'loading' && <span className="admin-state-spinner" aria-hidden="true" />}
      {type === 'error' && <FaExclamationTriangle className="admin-state-icon admin-state-icon--error" />}
      {type === 'empty' && <FaInbox className="admin-state-icon" />}
      <p>{message}</p>
      {type === 'error' && onRetry && (
        <button className="admin-state-retry" onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  )
}

export default StateMessage
