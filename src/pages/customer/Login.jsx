import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const COUNTRY_CODE = '+91'
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_UNAVAILABLE_MESSAGE =
  'Phone login will be available soon. Please use email login for now.'

function validateSignupForm({ name, email, password, confirmPassword }) {
  if (!name.trim()) return 'Name is required.'
  if (!email.trim()) return 'Email is required.'
  if (!EMAIL_REGEX.test(email.trim())) return 'Enter a valid email address.'
  if (!password) return 'Password is required.'
  if (password.length < 6) return 'Password must be at least 6 characters.'
  if (!confirmPassword) return 'Please confirm your password.'
  if (password !== confirmPassword) return 'Passwords do not match.'
  return ''
}

// One route, several internal "screens" (same pattern the phone flow
// already used for phone → otp): method choice, phone/otp, email
// login/signup/forgot-password, and password-recovery (reached by
// clicking a reset-password email link, detected via isPasswordRecovery).
function Login() {
  const {
    sendOtp,
    verifyOtp,
    signUpWithEmail,
    signInWithEmail,
    resetPasswordForEmail,
    updatePassword,
    isPasswordRecovery,
  } = useAuth()
  const navigate = useNavigate()

  const [method, setMethod] = useState(null) // null | 'phone' | 'email'
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Phone/OTP
  const [phoneStep, setPhoneStep] = useState('phone') // 'phone' | 'otp'
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')

  // Email
  const [emailStep, setEmailStep] = useState('login') // 'login' | 'signup' | 'forgot' | 'forgot-sent' | 'signup-confirm'
  const [emailForm, setEmailForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  // Password recovery (arrived via reset-password email link)
  const [recoveryPassword, setRecoveryPassword] = useState('')
  const [recoveryConfirm, setRecoveryConfirm] = useState('')

  function updateEmailField(field, value) {
    setEmailForm((current) => ({ ...current, [field]: value }))
  }

  function resetToChoice() {
    setMethod(null)
    setError('')
    setPhoneStep('phone')
    setPhone('')
    setOtp('')
    setEmailStep('login')
    setEmailForm({ name: '', email: '', password: '', confirmPassword: '' })
  }

  // ---- Phone/OTP (kept fully real — never faked) ----
  async function handleSendOtp(event) {
    event.preventDefault()
    if (!/^\d{10}$/.test(phone.trim())) {
      setError('Enter a valid 10-digit phone number.')
      return
    }

    setError('')
    setIsSubmitting(true)
    const result = await sendOtp(`${COUNTRY_CODE}${phone.trim()}`)
    setIsSubmitting(false)

    if (!result.success) {
      // Right now this always fails because no SMS provider is
      // configured yet — show a friendly message instead of a raw
      // provider error. Once Twilio/SMS is configured this call will
      // simply start succeeding and this branch won't be hit.
      setError(PHONE_UNAVAILABLE_MESSAGE)
      return
    }
    setPhoneStep('otp')
  }

  async function handleVerifyOtp(event) {
    event.preventDefault()
    if (!/^\d{4,6}$/.test(otp.trim())) {
      setError('Enter the OTP sent to your phone.')
      return
    }

    setError('')
    setIsSubmitting(true)
    const result = await verifyOtp(`${COUNTRY_CODE}${phone.trim()}`, otp.trim())
    setIsSubmitting(false)

    if (!result.success) {
      setError(result.message)
      return
    }
    navigate('/profile')
  }

  // ---- Email login/signup/forgot ----
  async function handleEmailLogin(event) {
    event.preventDefault()
    if (!emailForm.email.trim() || !emailForm.password) {
      setError('Enter your email and password.')
      return
    }

    setError('')
    setIsSubmitting(true)
    const result = await signInWithEmail(emailForm.email.trim(), emailForm.password)
    setIsSubmitting(false)

    if (!result.success) {
      setError(result.message)
      return
    }
    navigate('/profile')
  }

  async function handleEmailSignup(event) {
    event.preventDefault()
    const validationError = validateSignupForm(emailForm)
    if (validationError) {
      setError(validationError)
      return
    }

    setError('')
    setIsSubmitting(true)
    const result = await signUpWithEmail(
      emailForm.name.trim(),
      emailForm.email.trim(),
      emailForm.password
    )
    setIsSubmitting(false)

    if (!result.success) {
      setError(result.message)
      return
    }

    if (result.needsEmailConfirmation) {
      setEmailStep('signup-confirm')
      return
    }
    navigate('/profile')
  }

  async function handleForgotPassword(event) {
    event.preventDefault()
    if (!emailForm.email.trim() || !EMAIL_REGEX.test(emailForm.email.trim())) {
      setError('Enter a valid email address.')
      return
    }

    setError('')
    setIsSubmitting(true)
    const result = await resetPasswordForEmail(emailForm.email.trim())
    setIsSubmitting(false)

    if (!result.success) {
      setError(result.message)
      return
    }
    setEmailStep('forgot-sent')
  }

  // ---- Password recovery (from reset-password email link) ----
  async function handleUpdatePassword(event) {
    event.preventDefault()
    if (!recoveryPassword || recoveryPassword.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    if (recoveryPassword !== recoveryConfirm) {
      setError('Passwords do not match.')
      return
    }

    setError('')
    setIsSubmitting(true)
    const result = await updatePassword(recoveryPassword)
    setIsSubmitting(false)

    if (!result.success) {
      setError(result.message)
      return
    }
    navigate('/profile')
  }

  if (isPasswordRecovery) {
    return (
      <div className="container py-5" style={{ maxWidth: '420px' }}>
        <h1 className="mb-2">Set New Password</h1>
        <p className="text-muted small mb-4">Choose a new password for your account.</p>
        <form onSubmit={handleUpdatePassword}>
          <label className="form-label" htmlFor="recoveryPassword">New Password</label>
          <input
            id="recoveryPassword"
            type="password"
            className={`form-control mb-2 ${error ? 'is-invalid' : ''}`}
            value={recoveryPassword}
            onChange={(e) => setRecoveryPassword(e.target.value)}
          />
          <label className="form-label" htmlFor="recoveryConfirm">Confirm New Password</label>
          <input
            id="recoveryConfirm"
            type="password"
            className={`form-control mb-2 ${error ? 'is-invalid' : ''}`}
            value={recoveryConfirm}
            onChange={(e) => setRecoveryConfirm(e.target.value)}
          />
          {error && <div className="text-danger small mb-2">{error}</div>}
          <button type="submit" className="btn btn-brand w-100 mt-2" disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : 'Save New Password'}
          </button>
        </form>
      </div>
    )
  }

  if (method === null) {
    return (
      <div className="container py-5" style={{ maxWidth: '420px' }}>
        <h1 className="mb-2">Login</h1>
        <p className="text-muted small mb-4">Choose how you'd like to continue.</p>
        <div className="d-flex flex-column gap-3">
          <button
            type="button"
            className="btn btn-outline-secondary w-100 py-3"
            onClick={() => {
              setMethod('phone')
              setError('')
            }}
          >
            <i className="bi bi-phone me-2"></i>
            Continue with Phone
          </button>
          <button
            type="button"
            className="btn btn-brand w-100 py-3"
            onClick={() => {
              setMethod('email')
              setError('')
            }}
          >
            <i className="bi bi-envelope me-2"></i>
            Continue with Email
          </button>
        </div>
      </div>
    )
  }

  if (method === 'phone') {
    return (
      <div className="container py-5" style={{ maxWidth: '420px' }}>
        <button type="button" className="btn btn-link p-0 mb-3" onClick={resetToChoice}>
          <i className="bi bi-arrow-left me-1"></i> Back
        </button>
        <h1 className="mb-2">Login</h1>
        <p className="text-muted small mb-4">
          Enter your phone number to receive a one-time verification code.
        </p>

        {phoneStep === 'phone' ? (
          <form onSubmit={handleSendOtp}>
            <label className="form-label" htmlFor="phone">Phone Number</label>
            <input
              id="phone"
              type="tel"
              className={`form-control mb-2 ${error ? 'is-invalid' : ''}`}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            {error && <div className="text-danger small mb-2">{error}</div>}
            <button type="submit" className="btn btn-brand w-100 mt-2" disabled={isSubmitting}>
              {isSubmitting ? 'Sending OTP…' : 'Send OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp}>
            <p className="text-muted small">OTP sent to {phone}</p>
            <label className="form-label" htmlFor="otp">Enter OTP</label>
            <input
              id="otp"
              type="text"
              inputMode="numeric"
              className={`form-control mb-2 ${error ? 'is-invalid' : ''}`}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />
            {error && <div className="text-danger small mb-2">{error}</div>}
            <button type="submit" className="btn btn-brand w-100 mt-2" disabled={isSubmitting}>
              {isSubmitting ? 'Verifying…' : 'Verify OTP'}
            </button>
            <button
              type="button"
              className="btn btn-link w-100 mt-1"
              onClick={() => {
                setPhoneStep('phone')
                setOtp('')
                setError('')
              }}
            >
              Change phone number
            </button>
          </form>
        )}
      </div>
    )
  }

  // method === 'email'
  return (
    <div className="container py-5" style={{ maxWidth: '420px' }}>
      <button type="button" className="btn btn-link p-0 mb-3" onClick={resetToChoice}>
        <i className="bi bi-arrow-left me-1"></i> Back
      </button>

      {emailStep === 'login' && (
        <>
          <h1 className="mb-4">Email Login</h1>
          <form onSubmit={handleEmailLogin}>
            <div className="mb-3">
              <label className="form-label" htmlFor="loginEmail">Email</label>
              <input
                id="loginEmail"
                type="email"
                className={`form-control ${error ? 'is-invalid' : ''}`}
                value={emailForm.email}
                onChange={(e) => updateEmailField('email', e.target.value)}
              />
            </div>
            <div className="mb-2">
              <label className="form-label" htmlFor="loginPassword">Password</label>
              <input
                id="loginPassword"
                type="password"
                className={`form-control ${error ? 'is-invalid' : ''}`}
                value={emailForm.password}
                onChange={(e) => updateEmailField('password', e.target.value)}
              />
            </div>
            {error && <div className="text-danger small mb-2">{error}</div>}
            <button type="submit" className="btn btn-brand w-100 mt-2" disabled={isSubmitting}>
              {isSubmitting ? 'Logging in…' : 'Login'}
            </button>
            <button
              type="button"
              className="btn btn-link w-100 mt-1"
              onClick={() => {
                setError('')
                setEmailStep('forgot')
              }}
            >
              Forgot Password?
            </button>
          </form>
          <p className="text-muted small text-center mt-3 mb-0">
            Don't have an account?{' '}
            <button
              type="button"
              className="btn btn-link p-0 align-baseline"
              onClick={() => {
                setError('')
                setEmailStep('signup')
              }}
            >
              Create Account
            </button>
          </p>
        </>
      )}

      {emailStep === 'signup' && (
        <>
          <h1 className="mb-4">Create your account</h1>
          <form onSubmit={handleEmailSignup}>
            <div className="mb-3">
              <label className="form-label" htmlFor="signupName">Name</label>
              <input
                id="signupName"
                type="text"
                className={`form-control ${error ? 'is-invalid' : ''}`}
                value={emailForm.name}
                onChange={(e) => updateEmailField('name', e.target.value)}
              />
            </div>
            <div className="mb-3">
              <label className="form-label" htmlFor="signupEmail">Email</label>
              <input
                id="signupEmail"
                type="email"
                className={`form-control ${error ? 'is-invalid' : ''}`}
                value={emailForm.email}
                onChange={(e) => updateEmailField('email', e.target.value)}
              />
            </div>
            <div className="mb-3">
              <label className="form-label" htmlFor="signupPassword">Password</label>
              <input
                id="signupPassword"
                type="password"
                className={`form-control ${error ? 'is-invalid' : ''}`}
                value={emailForm.password}
                onChange={(e) => updateEmailField('password', e.target.value)}
              />
            </div>
            <div className="mb-2">
              <label className="form-label" htmlFor="signupConfirmPassword">Confirm Password</label>
              <input
                id="signupConfirmPassword"
                type="password"
                className={`form-control ${error ? 'is-invalid' : ''}`}
                value={emailForm.confirmPassword}
                onChange={(e) => updateEmailField('confirmPassword', e.target.value)}
              />
            </div>
            {error && <div className="text-danger small mb-2">{error}</div>}
            <button type="submit" className="btn btn-brand w-100 mt-2" disabled={isSubmitting}>
              {isSubmitting ? 'Creating Account…' : 'Create Account'}
            </button>
          </form>
          <p className="text-muted small text-center mt-3 mb-0">
            Already have an account?{' '}
            <button
              type="button"
              className="btn btn-link p-0 align-baseline"
              onClick={() => {
                setError('')
                setEmailStep('login')
              }}
            >
              Login
            </button>
          </p>
        </>
      )}

      {emailStep === 'signup-confirm' && (
        <div className="text-center">
          <i className="bi bi-envelope-check fs-1 d-block mb-3" style={{ color: 'var(--color-primary)' }}></i>
          <h1 className="h4 mb-2">Check Your Email</h1>
          <p className="text-muted small mb-4">
            Account created! Please confirm your email address using the link we sent to{' '}
            {emailForm.email}, then log in.
          </p>
          <button
            type="button"
            className="btn btn-brand w-100"
            onClick={() => {
              setError('')
              setEmailStep('login')
            }}
          >
            Back to Login
          </button>
        </div>
      )}

      {emailStep === 'forgot' && (
        <>
          <h1 className="mb-2">Reset Password</h1>
          <p className="text-muted small mb-4">
            Enter your account email and we'll send you a password reset link.
          </p>
          <form onSubmit={handleForgotPassword}>
            <div className="mb-2">
              <label className="form-label" htmlFor="forgotEmail">Email</label>
              <input
                id="forgotEmail"
                type="email"
                className={`form-control ${error ? 'is-invalid' : ''}`}
                value={emailForm.email}
                onChange={(e) => updateEmailField('email', e.target.value)}
              />
            </div>
            {error && <div className="text-danger small mb-2">{error}</div>}
            <button type="submit" className="btn btn-brand w-100 mt-2" disabled={isSubmitting}>
              {isSubmitting ? 'Sending…' : 'Send Reset Link'}
            </button>
            <button
              type="button"
              className="btn btn-link w-100 mt-1"
              onClick={() => {
                setError('')
                setEmailStep('login')
              }}
            >
              Back to Login
            </button>
          </form>
        </>
      )}

      {emailStep === 'forgot-sent' && (
        <div className="text-center">
          <i className="bi bi-envelope-check fs-1 d-block mb-3" style={{ color: 'var(--color-primary)' }}></i>
          <h1 className="h4 mb-2">Check Your Email</h1>
          <p className="text-muted small mb-4">
            If an account exists for {emailForm.email}, we've sent a password reset link to it.
          </p>
          <button
            type="button"
            className="btn btn-brand w-100"
            onClick={() => {
              setError('')
              setEmailStep('login')
            }}
          >
            Back to Login
          </button>
        </div>
      )}
    </div>
  )
}

export default Login
