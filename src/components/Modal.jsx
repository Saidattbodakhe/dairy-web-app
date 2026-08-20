// A small dependency-free modal. Bootstrap's own modal needs its JS
// bundle (we only load Bootstrap's CSS), so this uses plain React
// state instead: the parent decides when to render <Modal>, and this
// component just draws the dimmed backdrop + centered white card.
function Modal({ title, onClose, children }) {
  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3"
      style={{ background: 'rgba(0, 0, 0, 0.45)', zIndex: 1050 }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-4 p-4 w-100"
        style={{ maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h2 className="h5 mb-0">{title}</h2>
          <button type="button" className="btn-close" aria-label="Close" onClick={onClose}></button>
        </div>
        {children}
      </div>
    </div>
  )
}

export default Modal
