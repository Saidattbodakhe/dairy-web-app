import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const AdminAuthContext = createContext(null)

async function fetchAdminProfile(authUserId) {
  const { data, error } = await supabase
    .from('admin_users')
    .select('email, role')
    .eq('auth_user_id', authUserId)
    .maybeSingle()

  if (error) {
    console.error('Failed to load admin profile:', error.message)
    return null
  }
  return data
}

// Kept as its own Context, separate from the customer AuthContext, on
// purpose — admin and customer sessions are different Supabase Auth
// identities. Being a valid Supabase user is NOT enough to be an admin:
// authorization requires a matching row in admin_users (see
// supabase/migrations/0001_phase1_auth.sql), which only a project owner
// can create — never this client.
export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function loadSession() {
      const { data } = await supabase.auth.getSession()
      const session = data?.session

      if (session?.user) {
        const profile = await fetchAdminProfile(session.user.id)
        if (isMounted) setAdmin(profile)
      }
      if (isMounted) setIsLoading(false)
    }

    loadSession()

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const profile = await fetchAdminProfile(session.user.id)
        if (isMounted) setAdmin(profile)
      } else if (isMounted) {
        setAdmin(null)
      }
    })

    return () => {
      isMounted = false
      authListener?.subscription?.unsubscribe()
    }
  }, [])

  async function login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { success: false, message: error.message }

    const profile = await fetchAdminProfile(data.user.id)
    if (!profile) {
      // Valid Supabase credentials, but no admin_users row — sign the
      // session back out immediately rather than leaving a "logged in
      // but not authorized" state hanging around.
      await supabase.auth.signOut()
      return { success: false, message: 'This account is not authorized for admin access.' }
    }

    setAdmin(profile)
    return { success: true }
  }

  async function logout() {
    await supabase.auth.signOut()
    setAdmin(null)
  }

  const value = { admin, isAdminLoggedIn: Boolean(admin), isLoading, login, logout }

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext)
  if (!context) {
    throw new Error('useAdminAuth must be used inside an AdminAuthProvider')
  }
  return context
}
