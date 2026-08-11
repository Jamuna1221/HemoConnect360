import AdminModal from './AdminModal'
import { FaShieldAlt } from 'react-icons/fa'

const ConfirmModal = ({
  title = 'Please Confirm',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  busy = false,
  onConfirm,
  onCancel,
}) => {
  return (
    <AdminModal
      icon={<FaShieldAlt className="modal-icon" />}
      title={title}
      onClose={onCancel}
      footer={
        <>
          <button className="modal-action-close" onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </button>
          <button
            className={`confirm-action-btn ${danger ? 'confirm-action-btn--danger' : 'confirm-action-btn--primary'}`}
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? 'Working...' : confirmLabel}
          </button>
        </>
      }
    >
      <p className="confirm-modal-message">{message}</p>
    </AdminModal>
  )
}

export default ConfirmModal
