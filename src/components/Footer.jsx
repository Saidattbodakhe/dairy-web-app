function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="bg-white border-top mt-5">
      <div className="container py-4 d-flex flex-column flex-md-row justify-content-between align-items-center gap-2 text-center text-md-start">
        <div>
          <div className="fw-bold" style={{ color: 'var(--color-primary)' }}>Fresh Dairy</div>
          <div className="text-muted small">Fresh milk &amp; dairy products, delivered daily.</div>
        </div>
        <div className="text-muted small">
          <div>Serving your local area</div>
          <div>&copy; {year} Fresh Dairy. All rights reserved.</div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
