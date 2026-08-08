import { createClient } from '@supabase/supabase-js'

let client = null

const getSupabaseUrl = () => {
  const url = import.meta.env.VITE_SUPABASE_URL
  if (!url) throw new Error('Missing VITE_SUPABASE_URL. Add it to your .env file.')
  return url
}

const getSupabaseAnonKey = () => {
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY
  if (!key) throw new Error('Missing VITE_SUPABASE_ANON_KEY. Add it to your .env file.')
  return key
}

export const getSupabase = () => {
  if (!client) {
    client = createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  }
  return client
}
