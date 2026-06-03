export default function MessageDialog({ message, onClose }) {
  if (!message) {
    return null;
  }

  return (
    <div className="modal-backdrop" role="presentation" data-cy="message-dialog">
      <article
        className="modal-card message-dialog"
        role="alertdialog"
        aria-modal="true"
        data-cy="message-dialog-card"
      >
        <div className="message-dialog-visual" aria-hidden="true">
          <span className="message-dialog-dot message-dialog-dot-left" />
          <span className="message-dialog-dot message-dialog-dot-top" />
          <span className="message-dialog-dot message-dialog-dot-right" />
          <span className="message-dialog-dot message-dialog-dot-far-right" />
          <span className="message-dialog-spark message-dialog-spark-left" />
          <span className="message-dialog-spark message-dialog-spark-right" />
          <span className="message-dialog-ray message-dialog-ray-one" />
          <span className="message-dialog-ray message-dialog-ray-two" />
          <span className="message-dialog-ray message-dialog-ray-three" />
          <span className="message-dialog-ray message-dialog-ray-four" />
          <span className="message-dialog-success">
            <svg viewBox="0 0 48 48" focusable="false">
              <path d="M14 24.5 21 31.5 34.5 17" />
            </svg>
          </span>
        </div>
        <h2>Cart Updated</h2>
        <p data-cy="message-dialog-text">{message}</p>
        <button
          type="button"
          className="btn btn-primary"
          onClick={onClose}
          autoFocus
          data-cy="message-dialog-ok"
        >
          OK
        </button>
      </article>
    </div>
  );
}
