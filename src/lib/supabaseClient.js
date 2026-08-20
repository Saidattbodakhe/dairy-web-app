import { createClient } from '@supabase/supabase-js'

// Single Supabase client for the whole app — every auth call and every
// future table query goes through this one instance. Only the anon
// (public) key belongs here: it's safe in browser code because Row
// Level Security policies, not this key, are what actually restrict
// access. The service_role/secret key must never be used from the
// frontend and must never be assigned to a VITE_-prefixed env var.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  // Doesn't throw — anonymous browsing/cart must keep working even
  // before a real Supabase project is configured. Only auth-dependent
  // calls (login, session fetch) will fail, and those already handle
  // their own errors.
  console.warn(
    'Supabase env vars are missing — copy .env.example to .env and fill in your project URL/anon key before testing login.'
  )
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key'
)
