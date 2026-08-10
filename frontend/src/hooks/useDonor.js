import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { getSupabase } from '../lib/supabase'
import { fetchDonorProfile } from '../services/donorService'

/**
 * Loads the current donor profile.
 * Prefers donor data passed via router state; otherwise fetches the
 * profile from Supabase using the logged-in user's auth id (survives
 * page refresh).
 *
 * @returns {{ donor: object|null, loading: boolean, error: string }}
 */
export const useDonor = () => {
  const location = useLocation()
  const [donor, setDonor] = useState(location.state?.donor || null)
  const [loading, setLoading] = useState(!location.state?.donor)
  const [error, setError] = useState('')

  useEffect(() => {
    if (donor) return

    let active = true

    const fetchDonor = async () => {
      try {
        const supabase = getSupabase()
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError) throw userError

        if (!user) {
          if (active) {
            setError('No signed-in user found. Please sign in to view your details.')
            setLoading(false)
          }
          return
        }

        const { donor: data, error } = await fetchDonorProfile(supabase, user.id)

        if (error) throw error

        if (active) {
          if (data) {
            console.info('[useDonor] Donor profile loaded', { userId: user.id })
            setDonor(data)
          } else {
            console.warn('[useDonor] No donor profile found', { userId: user.id })
            setError('Donor profile not found. Please register again.')
          }
          setLoading(false)
        }
      } catch (err) {
        console.error('[useDonor] Failed to load donor details', err)
        if (active) {
          setError(err.message || 'Failed to load donor details.')
          setLoading(false)
        }
      }
    }

    fetchDonor()

    return () => {
      active = false
    }
  }, [donor])

  return { donor, loading, error }
}
