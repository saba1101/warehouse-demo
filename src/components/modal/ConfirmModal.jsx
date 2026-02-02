import { Modal } from "./modal.jsx";
import styles from "./modal.module.scss";

export const ConfirmModal = ({
  open,
  onClose,
  title = "Confirm",
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  variant = "default",
  disableConfirm = false,
}) => {
  const handleConfirm = () => {
    if (disableConfirm) return;
    onConfirm?.();
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className={styles.confirmBody}>
        {message && <div className={styles.confirmMessage}>{message}</div>}
        <div className={styles.confirmActions}>
          <button
            type="button"
            className={styles.confirmCancel}
            onClick={onClose}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={
              variant === "danger"
                ? styles.confirmConfirmDanger
                : styles.confirmConfirm
            }
            onClick={handleConfirm}
            disabled={disableConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
};
