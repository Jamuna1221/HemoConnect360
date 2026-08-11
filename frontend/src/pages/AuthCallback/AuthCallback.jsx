import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getSupabase } from '../../services/supabase'
import { completePendingDonorRegistration } from '../../services/donorService'
import logo from '../../assets/logo/Hemoconnectlogo.png'
import './AuthCallback.css'

const AuthCallback = () => {
  const navigate = useNavigate()

  useEffect(() => {
    const supabase = getSupabase()
    let active = true
    let attempts = 0

    const goThankYou = () => {
      if (active) navigate('/donor/thank-you', { replace: true })
    }

    const goFail = (message) => {
      if (active) {
        navigate('/verify-email', {
          replace: true,
          state: { error: message || 'We could not verify your email. Please try again.' },
        })
      }
    }

    // The verified user now has a session, so RLS will allow the deferred
    // profile to be created. This is idempotent. If the creation fails,
    // the database error is surfaced instead of silently continuing.
    // (Blood bank registration never uses this flow - it is completed
    // immediately at signup with email confirmation disabled.)
    const handleSession = async (session) => {
      if (!active) return
      if (session?.user) {
        try {
          await completePendingDonorRegistration(session.user)
        } catch (err) {
          console.error('[auth-callback] Donor profile creation failed after verification', {
            userId: session.user.id,
            error: err,
          })
          goFail(err.message || 'Your account was verified, but the donor profile could not be saved. Please contact support.')
          return
        }
      }
      goThankYou()
    }

    const exchangeCodeIfPresent = async () => {
      const code = new URLSearchParams(window.location.search).get('code')
      if (!code) return null
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      if (error) {
        console.error('[auth-callback] Code exchange failed', { error })
        return null
      }
      return data.session?.user ? data.session : null
    }

    const checkSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) {
        console.error('[auth-callback] getSession failed', { error })
        return null
      }
      return session?.user ? session : null
    }

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') && session?.user) {
        handleSession(session)
      }
    })

    const poll = setInterval(async () => {
      attempts += 1

      const codeSession = await exchangeCodeIfPresent()
      if (codeSession?.user) {
        clearInterval(poll)
        handleSession(codeSession)
        return
      }

      const session = await checkSession()
      if (session?.user) {
        clearInterval(poll)
        handleSession(session)
        return
      }

      if (attempts >= 10) {
        clearInterval(poll)
        goFail()
      }
    }, 500)

    return () => {
      active = false
      clearInterval(poll)
      data?.subscription?.unsubscribe()
    }
  }, [navigate])

  return (
    <div className="auth-callback">
      <img src={logo} alt="HemoConnect360" className="auth-callback__logo" />
      <div className="auth-callback__spinner" />
      <p className="auth-callback__text">Verifying your email...</p>
    </div>
  )
}

export default AuthCallback
