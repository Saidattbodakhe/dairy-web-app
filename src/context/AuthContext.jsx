import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const AuthContext = createContext(null)

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
// phone number signs in — RLS only allows a customer to insert their
// OWN row (auth.uid() = auth_user_id, phone matching their own
// session), so this can never be used to create or overwrite anyone
// else's profile. See supabase/migrations/0001_phase1_auth.sql.
async function ensureCustomerProfile(authUserId, phone) {
  const existing = await fetchCustomerProfile(authUserId)
  if (existing) return existing

  const { data, error } = await supabase
    .from('customers')
    .insert({ auth_user_id: authUserId, phone })
    .select('name, phone, email')
    .single()

  if (error) {
    console.error('Failed to create customer profile:', error.message)
    return null
  }
  return data
}

// Same Context pattern as before (CartContext/ProductContext): one
// place holds the "logged in customer" state so any page can read it
// via useAuth(). The session itself is now real Supabase Auth (phone
// OTP) instead of a localStorage stand-in.
export function AuthProvider({ children }) {
  const [customer, setCustomer] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function loadSession() {
      const { data } = await supabase.auth.getSession()
      const session = data?.session

      if (session?.user) {
        const profile = await ensureCustomerProfile(session.user.id, session.user.phone)
        if (isMounted) setCustomer(profile)
      }
      if (isMounted) setIsLoading(false)
    }

    loadSession()

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const profile = await ensureCustomerProfile(session.user.id, session.user.phone)
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
  async function sendOtp(phone) {
    const { error } = await supabase.auth.signInWithOtp({ phone })
    if (error) return { success: false, message: error.message }
    return { success: true }
  }

  async function verifyOtp(phone, otp) {
    const { data, error } = await supabase.auth.verifyOtp({ phone, token: otp, type: 'sms' })
    if (error) return { success: false, message: error.message }

    const profile = await ensureCustomerProfile(data.user.id, data.user.phone)
    setCustomer(profile)
    return { success: true }
  }

  async function logout() {
    await supabase.auth.signOut()
    setCustomer(null)
  }

  const value = { customer, isLoggedIn: Boolean(customer), isLoading, sendOtp, verifyOtp, logout }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider')
  }
  return context
}
