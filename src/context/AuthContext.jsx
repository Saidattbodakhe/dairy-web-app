import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const AuthContext = createContext(null)

// Supabase's own error messages are already customer-safe (no SQL/stack
// traces), but a few common ones read better rephrased for this app.
// Never pass a raw network/technical object here — only error.message.
function getFriendlyAuthError(error) {
  if (!error) return 'Something went wrong. Please try again.'
  const msg = error.message || ''

  if (/invalid login credentials/i.test(msg)) return 'Incorrect email or password.'
  if (/already registered|already exists/i.test(msg)) {
    return 'An account with this email already exists. Try logging in instead.'
  }
  if (/email not confirmed/i.test(msg)) {
    return 'Please confirm your email before logging in — check your inbox for the confirmation link.'
  }
  if (/password should be at least/i.test(msg)) return msg
  if (/rate limit/i.test(msg)) return 'Too many attempts. Please wait a moment and try again.'
  if (/network|fetch/i.test(msg)) return 'Network error. Please check your connection and try again.'

  return msg || 'Something went wrong. Please try again.'
}

async function fetchCustomerProfile(authUserId) {
  const { data, error } = await supabase
    .from('customers')
    .select('name, phone, email')
    .eq('auth_user_id', authUserId)
    .maybeSingle()

  if (error) {
    console.error('Failed to load customer profile:', error.message)
    return null
  }
  return data
}

// The customers row is created here, client-side, the first time a
// customer signs in — by phone OR email — using only the authenticated
// user's own identity (never anything supplied by a form or URL). RLS
// only allows a customer to insert their OWN row (auth.uid() =
// auth_user_id, and phone either matching their own session or absent
// entirely for email-only signups), so this can never create/overwrite
// anyone else's profile. See supabase/migrations/0001_phase1_auth.sql
// and 0002_customer_email_auth.sql. Existing profiles are always
// reused, never duplicated.
//
// Returns { data, error } (never throws) so every caller can tell a
// genuine failure apart from "row already exists" — a failed insert
// must never be mistaken for a successful login.
async function ensureCustomerProfile(authUser) {
  if (!authUser?.id) {
    return { data: null, error: new Error('No authenticated user available.') }
  }

  const existing = await fetchCustomerProfile(authUser.id)
  if (existing) return { data: existing, error: null }

  // `email` is NOT NULL in the schema (default ''), so a phone-only
  // customer with no email gets '' here, never a literal null — that
  // matches the existing, unmodified customers table exactly. `phone`
  // IS nullable (migration 0002), so an email-only customer correctly
  // gets null there instead of a fabricated value.
  const { data, error } = await supabase
    .from('customers')
    .insert({
      auth_user_id: authUser.id,
      phone: authUser.phone || null,
      email: authUser.email || '',
      name: authUser.user_metadata?.name || '',
    })
    .select('name, phone, email')
    .single()

  if (error || !data) {
    console.error('Failed to create customer profile:', error?.message)
    return { data: null, error: error || new Error('Customer profile was not returned after insert.') }
  }

  return { data, error: null }
}

// Same Context pattern as before (CartContext/ProductContext): one
// place holds the "logged in customer" state so any page can read it
// via useAuth(). The session itself is real Supabase Auth — phone/OTP
// and email/password both land here, never a localStorage stand-in.
export function AuthProvider({ children }) {
  const [customer, setCustomer] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false)

  useEffect(() => {
    let isMounted = true

    async function loadSession() {
      const { data } = await supabase.auth.getSession()
      const session = data?.session

      if (session?.user) {
        const { data: profile, error } = await ensureCustomerProfile(session.user)
        if (error) console.error('Session restore: profile creation failed:', error.message)
        if (isMounted) setCustomer(profile)
      }
      if (isMounted) setIsLoading(false)
    }

    loadSession()

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Fired when the customer arrives via a password-reset email link.
      // Login.jsx shows a "set new password" form for this instead of
      // treating them as a normal logged-in customer yet.
      if (event === 'PASSWORD_RECOVERY') {
        if (isMounted) setIsPasswordRecovery(true)
        return
      }

      // A session existing is not, by itself, enough to consider the
      // customer logged in — the profile must be fetched/created too.
      // `customer` is only ever set to null here because there is no
      // session, or because ensureCustomerProfile genuinely failed —
      // never merely because the row didn't exist yet (that's the
      // normal first-login case, and ensureCustomerProfile creates it).
      if (session?.user) {
        const { data: profile, error } = await ensureCustomerProfile(session.user)
        if (error) console.error('Auth state change: profile creation failed:', error.message)
        if (isMounted) setCustomer(profile)
      } else if (isMounted) {
        setCustomer(null)
      }
    })

    return () => {
      isMounted = false
      authListener?.subscription?.unsubscribe()
    }
  }, [])

  // Two-step phone login: sendOtp requests the SMS code, verifyOtp
  // confirms it and starts the real session. `phone` must be in E.164
  // format (e.g. +91XXXXXXXXXX) — Login.jsx adds the country code.
  // Kept fully intact and functional for when an SMS provider is
  // configured — it is not faked or bypassed while unconfigured, and
  // has no dependency on email confirmation whatsoever.
  async function sendOtp(phone) {
    const { error } = await supabase.auth.signInWithOtp({ phone })
    if (error) return { success: false, message: getFriendlyAuthError(error) }
    return { success: true }
  }

  async function verifyOtp(phone, otp) {
    const { data, error } = await supabase.auth.verifyOtp({ phone, token: otp, type: 'sms' })
    if (error) return { success: false, message: getFriendlyAuthError(error) }

    const { data: profile, error: profileError } = await ensureCustomerProfile(data.user)
    if (profileError || !profile) {
      console.error('verifyOtp: profile creation failed:', profileError?.message)
      return { success: false, message: 'Unable to create your customer profile. Please try again.' }
    }

    setCustomer(profile)
    return { success: true }
  }

  async function signUpWithEmail(name, email, password) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    })

    if (error) return { success: false, message: getFriendlyAuthError(error) }

    if (data.session && data.user) {
      // Email confirmation is OFF on this project — session starts
      // immediately, so the profile can be created right now.
      const { data: profile, error: profileError } = await ensureCustomerProfile(data.user)
      if (profileError || !profile) {
        console.error('signUpWithEmail: profile creation failed:', profileError?.message)
        return {
          success: false,
          message: 'Account created, but we could not set up your profile. Please try logging in.',
        }
      }
      setCustomer(profile)
      return { success: true, needsEmailConfirmation: false }
    }

    // Email confirmation is ON (the current project configuration) —
    // no session yet, so the customers row is intentionally NOT
    // created here. It's created the moment a real session exists:
    // when the customer later logs in with signInWithEmail below, or
    // via the auth-state listener above if a session appears some
    // other way (e.g. the confirmation link itself starting a session
    // in this same browser tab).
    return { success: true, needsEmailConfirmation: true }
  }

  async function signInWithEmail(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { success: false, message: getFriendlyAuthError(error) }

    // Reuses the existing customers row created at signup — never
    // creates a second one (ensureCustomerProfile checks first). A
    // failed profile creation must NOT be treated as a successful
    // login — the Supabase session may be valid, but the customer
    // isn't considered logged in at the app level until their profile
    // row exists.
    const { data: profile, error: profileError } = await ensureCustomerProfile(data.user)
    if (profileError || !profile) {
      console.error('signInWithEmail: profile creation failed:', profileError?.message)
      return { success: false, message: 'Unable to create your customer profile. Please try again.' }
    }

    setCustomer(profile)
    return { success: true }
  }

  async function resetPasswordForEmail(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    })
    if (error) return { success: false, message: getFriendlyAuthError(error) }
    return { success: true }
  }

  // Called from the "set new password" form after arriving via the
  // reset-password email link (isPasswordRecovery === true).
  async function updatePassword(newPassword) {
    const { data, error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) return { success: false, message: getFriendlyAuthError(error) }

    const { data: profile, error: profileError } = await ensureCustomerProfile(data.user)
    if (profileError || !profile) {
      console.error('updatePassword: profile creation failed:', profileError?.message)
      return {
        success: false,
        message: 'Password updated, but we could not load your profile. Please try logging in again.',
      }
    }

    setCustomer(profile)
    setIsPasswordRecovery(false)
    return { success: true }
  }

  async function logout() {
    await supabase.auth.signOut()
    setCustomer(null)
  }

  const value = {
    customer,
    isLoggedIn: Boolean(customer),
    isLoading,
    isPasswordRecovery,
    sendOtp,
    verifyOtp,
    signUpWithEmail,
    signInWithEmail,
    resetPasswordForEmail,
    updatePassword,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider')
  }
  return context
}
