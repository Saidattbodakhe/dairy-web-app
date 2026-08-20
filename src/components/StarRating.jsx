const STAR_VALUES = [1, 2, 3, 4, 5]

// Works both as an interactive input (pass onChange) and as a
// read-only display (pass readOnly, no onChange needed).
function StarRating({ value, onChange, readOnly = false, size = '1.4rem' }) {
  return (
    <div className="d-flex gap-1">
      {STAR_VALUES.map((star) => (
        <button
          key={star}
          type="button"
          className="btn p-0 border-0 bg-transparent"
          style={{ fontSize: size, lineHeight: 1, cursor: readOnly ? 'default' : 'pointer' }}
          onClick={() => !readOnly && onChange?.(star)}
          disabled={readOnly}
          aria-label={`${star} star${star > 1 ? 's' : ''}`}
        >
          <i
            className={`bi ${star <= value ? 'bi-star-fill' : 'bi-star'}`}
            style={{ color: star <= value ? 'var(--color-accent)' : 'var(--color-border)' }}
          ></i>
        </button>
      ))}
    </div>
  )
}

export default StarRating
