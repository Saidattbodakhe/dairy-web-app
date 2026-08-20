import { Link } from 'react-router-dom'

function NotFound() {
  return (
    <div className="container py-5 text-center">
      <h1>Page Not Found</h1>
      <p className="text-muted">The page you're looking for doesn't exist.</p>
      <Link to="/" className="btn btn-brand">Back to Home</Link>
    </div>
  )
}

export default NotFound
