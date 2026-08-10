import { useEffect, useState } from 'react'
import { getSupabase } from '../lib/supabase'
import { fetchDonorProfile } from '../services/donorService'

export const useAuth = () => {
  const [user, setUser] = useState(null)
  const [donor, setDonor] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    const fetchDonor = async (userId) => {
      try {
        const supabase = getSupabase()
        const { donor: data, error } = await fetchDonorProfile(supabase, userId)
        if (error) {
          console.error('[auth] Donor profile query failed', { userId, error })
          if (active) setDonor(null)
          return
        }
        console.info('[auth] Donor profile resolved for session', { userId, donorFound: Boolean(data) })
        if (active) setDonor(error ? null : data || null)
      } catch (err) {
        console.error('[auth] Unexpected error loading donor profile', err)
        if (active) setDonor(null)
      }
    }

    const loadSession = async () => {
      try {
        const supabase = getSupabase()
        const { data: { session }, error } = await supabase.auth.getSession()
        if (!active) return
        if (error || !session?.user) {
          console.warn('[auth] No active session', { error: error || 'no session' })
          setUser(null)
          setDonor(null)
          setLoading(false)
          return
        }
        console.info('[auth] Session loaded', { userId: session.user.id, email: session.user.email })
        setUser(session.user)
        await fetchDonor(session.user.id)
        if (active) setLoading(false)
      } catch (err) {
        console.error('[auth] Failed to load session', err)
        if (active) {
          setUser(null)
          setDonor(null)
          setLoading(false)
        }
      }
    }

    loadSession()

    let subscription
    try {
      const supabase = getSupabase()
      const { data } = supabase.auth.onAuthStateChange((event, session) => {
        console.info('[auth] Auth state changed', { event, userId: session?.user?.id || null })
        if (session?.user) {
          setUser(session.user)
          fetchDonor(session.user.id)
        } else {
          setUser(null)
          setDonor(null)
        }
        setLoading(false)
      })
      subscription = data?.subscription
    } catch (err) {
      console.error('[auth] Failed to subscribe to auth changes', err)
      // Session listener unavailable (e.g. missing config); loadSession handles the fallback state.
    }

    return () => {
      active = false
      subscription?.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    try {
      const supabase = getSupabase()
      await supabase.auth.signOut()
    } catch {
      // Treat a failed sign-out as logged out.
    }
  }

  return { user, donor, loading, signOut }
}
