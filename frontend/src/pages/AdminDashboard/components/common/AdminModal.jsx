const AdminModal = ({ icon, title, onClose, children, footer, width }) => {
  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div
        className="admin-modal-card"
        style={width ? { maxWidth: width } : undefined}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          {icon}
          <h3>{title}</h3>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close" type="button">
            &times;
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  )
}

export default AdminModal
