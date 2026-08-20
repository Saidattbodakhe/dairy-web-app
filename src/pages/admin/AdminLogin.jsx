import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdminAuth } from '../../context/AdminAuthContext'

function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { login } = useAdminAuth()
  const navigate = useNavigate()

  async function handleSubmit(event) {
    event.preventDefault()

    if (!email.trim() || !password.trim()) {
      setError('Enter both email and password.')
      return
    }

    setError('')
    setIsSubmitting(true)
    const result = await login(email.trim(), password)
    setIsSubmitting(false)

    if (!result.success) {
      setError(result.message)
      return
    }
    navigate('/admin/dashboard')
  }

  return (
    <div
      className="d-flex align-items-center justify-content-center"
      style={{ minHeight: '100vh', background: 'var(--color-bg-soft)' }}
    >
      <div className="card-plain p-4" style={{ width: '100%', maxWidth: '380px' }}>
        <div className="text-center mb-4">
          <i className="bi bi-droplet-fill fs-1" style={{ color: 'var(--color-primary)' }}></i>
          <h1 className="h4 mt-2 mb-1">Admin Login</h1>
          <p className="text-muted small mb-0">Sign in with your authorized admin account.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="mb-3">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <div className="text-danger small mb-3">{error}</div>}
          <button type="submit" className="btn btn-brand w-100" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in…' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default AdminLogin
