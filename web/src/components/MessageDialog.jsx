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
