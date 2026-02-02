import styles from "./modal.module.scss";

export const Modal = ({
  children,
  open,
  onClose,
  title,
  disableCloseButton = false,
}) => {
  if (!open) return null;
  return (
    <div className={`${styles.modal} ${styles.fadeIn}`}>
      <div className={styles.modalBackdrop} onClick={onClose} aria-hidden />
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>{title}</h2>
          {disableCloseButton ? null : <button onClick={onClose}>X</button>}
        </div>
        <div className={styles.modalBody}>{children}</div>
      </div>
    </div>
  );
};
