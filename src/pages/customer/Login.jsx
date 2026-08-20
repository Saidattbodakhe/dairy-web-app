import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const COUNTRY_CODE = '+91'

// Two "screens" in one component: entering a phone number, then
// entering the OTP. `step` just remembers which one to show.
function Login() {
  const [step, setStep] = useState('phone') // 'phone' | 'otp'
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { sendOtp, verifyOtp } = useAuth()
  const navigate = useNavigate()

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
      setError(result.message)
      return
    }
    setStep('otp')
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

  return (
    <div className="container py-5" style={{ maxWidth: '420px' }}>
      <h1 className="mb-2">Login</h1>
      <p className="text-muted small mb-4">
        Enter your phone number to receive a one-time verification code.
      </p>

      {step === 'phone' ? (
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
              setStep('phone')
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

export default Login
