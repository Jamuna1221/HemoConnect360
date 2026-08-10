import { getSupabase } from '../lib/supabase'
import { savePendingDonor, getPendingDonor, clearPendingDonor } from './pendingDonor'

const STORAGE_BUCKET = 'donor-docs'

const buildDonorRecord = (userId, profile, idProofUrl) => ({
  id: userId,
  full_name: profile.fullName,
  dob: profile.dob,
  gender: profile.gender,
  blood_group: profile.bloodGroup,
  phone: profile.phone,
  email: profile.email,
  address: profile.address,
  city: profile.city,
  state: profile.state,
  pincode: profile.pincode,
  weight: profile.weight,
  hemoglobin: profile.hemoglobin,
  last_donation: profile.lastDonation || null,
  id_proof: idProofUrl || null,
  latitude: profile.latitude || null,
  longitude: profile.longitude || null,
  status: 'active',
})

const uploadIdProof = async (supabase, userId, idProof) => {
  if (!idProof) return { url: null, path: null }

  const ext = idProof.name ? idProof.name.split('.').pop() : 'file'
  const uploadedPath = `${userId}/id-proof-${Date.now()}.${ext}`
  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(uploadedPath, idProof, { upsert: false })

  if (uploadError) {
    console.error('[donor:register] ID proof upload failed', { userId, error: uploadError })
    throw new Error(`Failed to upload ID proof. Database error: ${uploadError.message}`)
  }

  const { data: urlData } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(uploadedPath)
  return { url: urlData?.publicUrl || null, path: uploadedPath }
}

export const fetchDonorProfile = async (supabase, userId) => {
  const { data, error } = await supabase
    .from('donors')
    .select('*')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    return { donor: null, error }
  }
  return { donor: data || null, error: null }
}

const insertDonorRow = async (supabase, userId, profile, idProofUrl) => {
  const record = buildDonorRecord(userId, profile, idProofUrl)

  console.log('[donor:register] INSERTING DONOR:', record)

  const { data, error } = await supabase
    .from('donors')
    .upsert(record, { onConflict: 'id' })
    .select()
    .single()

  console.log('[donor:register] INSERT RESULT:', { data, error })

  if (error) {
    console.error('[donor:register] INSERT FAILED')
    console.error('code:', error.code)
    console.error('message:', error.message)
    console.error('details:', error.details)
    console.error('hint:', error.hint)
    throw error
  }

  return data
}

/**
 * Sign an existing donor in with Supabase Auth and load their profile.
 *
 * Login NEVER searches by email: the authenticated user's id (auth.users.id)
 * is used to look the donor profile up by donors.id.
 *
 * @param {Object} credentials
 * @param {string} credentials.email
 * @param {string} credentials.password
 * @returns {Promise<{ user: Object, donor: Object }>}
 */
export const loginDonor = async ({ email, password }) => {
  const supabase = getSupabase()

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    console.error('[donor:login] signInWithPassword failed', { error })
    throw new Error(mapLoginError(error))
  }

  const user = data?.user
  if (!user?.id) {
    console.error('[donor:login] Sign in succeeded but no user was returned', { data })
    throw new Error('Sign in succeeded but no user was returned. Please try again.')
  }

  console.log('[donor:login] login result (auth ok)', {
    userId: user.id,
    email: user.email,
    emailConfirmed: Boolean(user.email_confirmed_at),
  })

  const { donor, error: queryError } = await fetchDonorProfile(supabase, user.id)

  if (queryError) {
    console.error('[donor:login] database error on donor lookup', { userId: user.id, error: queryError })
    throw new Error(`Unable to load your donor profile. Database error: ${queryError.message}`)
  }

  let profile = donor
  console.log('[donor:login] donor lookup by id', { userId: user.id, found: Boolean(profile) })

  // Safety net: if the profile was deferred at registration (only created
  // after email verification) and the callback failed, retry now. Throws so
  // any database error is surfaced instead of silently continuing.
  if (!profile) {
    console.warn('[donor:login] No donor profile found; retrying pending registration', {
      userId: user.id,
      email: user.email,
    })
    const recovered = await completePendingDonorRegistration(user)
    if (recovered) {
      const retry = await fetchDonorProfile(supabase, user.id)
      if (retry.error) {
        console.error('[donor:login] database error on donor lookup after recovery', { userId: user.id, error: retry.error })
        throw new Error(`Unable to load your donor profile. Database error: ${retry.error.message}`)
      }
      profile = retry.donor
    }
  }

  if (!profile) {
    console.warn('[donor:login] No donor profile found for authenticated user', {
      userId: user.id,
      email: user.email,
      reason: 'No row in public.donors where id = auth user id',
    })
    throw new Error('No donor profile found for this account. Please register first.')
  }

  console.log('[donor:login] donor profile loaded', { userId: user.id, donorId: profile.id, status: 'success' })
  return { user, donor: profile }
}

/**
 * Register a new donor with Supabase:
 *  1. Create an auth account (email + password), optionally with a
 *     verification email.
 *  2. Create the donor profile (id = auth user id).
 *
 * Works with BOTH Supabase settings:
 *  - "Confirm email" DISABLED -> signUp returns a session -> the donor row is
 *    inserted immediately; any database error is thrown (never silent).
 *  - "Confirm email" ENABLED -> signUp returns NO session (RLS would block the
 *    insert) -> the profile is persisted locally and created automatically by
 *    `completePendingDonorRegistration` once the email is verified.
 *
 * @param {Object} input
 * @param {string} input.email
 * @param {string} input.password
 * @param {File|null} input.idProof
 * @param {Object} input.profile - Donor fields (fullName, dob, gender, ...)
 * @returns {Promise<Object>} The inserted donor row (or a stub when deferred).
 */
export const registerDonor = async ({ email, password, idProof, profile }) => {
  const supabase = getSupabase()

  console.log('[donor:register] signUp start', { email })

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
      // Keep a recovery copy with the verified auth user. IndexedDB is local
      // to the browser and may be unavailable when the link opens elsewhere.
      data: {
        fullName: profile.fullName,
        dob: profile.dob,
        gender: profile.gender,
        bloodGroup: profile.bloodGroup,
        phone: profile.phone,
        email: profile.email || email,
        address: profile.address,
        city: profile.city,
        state: profile.state,
        pincode: profile.pincode,
        weight: profile.weight,
        hemoglobin: profile.hemoglobin,
        lastDonation: profile.lastDonation || null,
        latitude: profile.latitude || null,
        longitude: profile.longitude || null,
      },
    },
  })

  if (authError) {
    // Auth may already exist even when the profile insert failed earlier
    // because of the database schema. Let a verified user submit the form
    // again to finish creating the missing donor row.
    if (isAlreadyRegisteredError(authError.message)) {
      const retry = await supabase.auth.signInWithPassword({ email, password })
      if (retry.error || !retry.data?.user?.id) {
        throw new Error(mapLoginError(retry.error || authError))
      }

      const existing = await fetchDonorProfile(supabase, retry.data.user.id)
      if (existing.error) {
        await supabase.auth.signOut().catch(() => {})
        throw new Error(`Unable to verify donor profile. Database error: ${existing.error.message}`)
      }
      if (existing.donor) {
        await supabase.auth.signOut().catch(() => {})
        return existing.donor
      }

      try {
        const { url } = await uploadIdProof(supabase, retry.data.user.id, idProof)
        const donor = await insertDonorRow(supabase, retry.data.user.id, profile, url)
        await supabase.auth.signOut().catch(() => {})
        return donor
      } catch (err) {
        await supabase.auth.signOut().catch(() => {})
        throw err
      }
    }
    console.error('[donor:register] signUp failed', { email, error: authError })
    throw new Error(mapAuthError(authError.message))
  }

  const userId = authData?.user?.id
  if (!userId) {
    console.error('[donor:register] No user ID returned by signUp', { authData })
    throw new Error('Account created but no user ID was returned. Please try again.')
  }

  console.log('[donor:register] auth user:', userId)
  console.log('[donor:register] profile:', profile)

  console.log('[donor:register] signUp result', {
    userId,
    email,
    sessionPresent: Boolean(authData.session),
    emailConfirmed: Boolean(authData.user?.email_confirmed_at),
  })

  // Confirm email DISABLED: a session exists, so create the profile now.
  if (authData.session) {
    // Idempotency: never insert twice for the same donor id.
    const existing = await fetchDonorProfile(supabase, userId)
    if (existing.error) {
      console.error('[donor:register] database error on existing-donor check', { userId, error: existing.error })
      throw new Error(`Unable to verify donor profile. Database error: ${existing.error.message}`)
    }
    if (existing.donor) {
      console.log('[donor:register] donor insert result', { userId, donorId: existing.donor.id, status: 'skipped-existing' })
      await supabase.auth.signOut().catch((err) => {
        console.warn('[donor:register] signOut after signup failed', err)
      })
      return existing.donor
    }

    const { url } = await uploadIdProof(supabase, userId, idProof)
    const donor = await insertDonorRow(supabase, userId, profile, url)

    await supabase.auth.signOut().catch((err) => {
      console.warn('[donor:register] signOut after signup failed', err)
    })

    console.log('[donor:register] donor insert result', { userId, donorId: donor.id, status: 'success' })
    return donor
  }

  // Confirm email ENABLED: no session yet. Persist the pending profile and
  // create it automatically after verification (AuthCallback / login).
  try {
    await savePendingDonor({ email, userId, profile, idProof })
    console.log('[donor:register] pending donor profile saved for post-verification creation', { userId, email })
  } catch (err) {
    console.error('[donor:register] Failed to persist pending profile', err)
    throw new Error('Your account was created, but we could not save your details for verification. Please try again.', { cause: err })
  }

  return {
    id: userId,
    full_name: profile.fullName,
    blood_group: profile.bloodGroup,
    phone: profile.phone,
    email,
    city: profile.city,
    state: profile.state,
    created_at: null,
  }
}

/**
 * Create the donor profile for a verified user from data saved at
 * registration. Called automatically by the auth callback (and as a safety
 * net at login). Idempotent — never creates a second row for the same user.
 *
 * Throws on database errors so the caller can surface them instead of
 * silently continuing.
 *
 * @param {Object} user - The authenticated Supabase user.
 * @returns {Promise<Object|null>} The created donor row, or null if there was
 *   nothing to create.
 */
export const completePendingDonorRegistration = async (user) => {
  const supabase = getSupabase()
  if (!user?.id) return null

  let pending
  try {
    pending = await getPendingDonor()
  } catch (err) {
    console.warn('[donor:verify] Could not read pending donor data', err)
    return null
  }
  if (!pending) {
    const metadata = user.user_metadata || {}
    if (!metadata.fullName || !metadata.bloodGroup || !metadata.phone) return null
    pending = {
      userId: user.id,
      email: user.email,
      profile: metadata,
      idProof: null,
    }
  }

  // Only complete the registration belonging to this verified user.
  if (pending.userId && pending.userId !== user.id) return null
  if (!pending.userId && pending.email && pending.email !== user.email) return null

  // Idempotency: never insert twice for the same donor id.
  const { donor: existing, error: existingError } = await fetchDonorProfile(supabase, user.id)
  if (existingError) {
    console.error('[donor:verify] database error on existing-donor check', { userId: user.id, error: existingError })
    throw new Error(`Unable to verify donor profile. Database error: ${existingError.message}`)
  }
  if (existing) {
    console.log('[donor:verify] donor insert result', { userId: user.id, donorId: existing.id, status: 'skipped-existing' })
    await clearPendingDonor().catch(() => {})
    return null
  }

  let idProofUrl = null
  if (pending.idProof) {
    const { url } = await uploadIdProof(supabase, user.id, pending.idProof)
    idProofUrl = url
  }

  const profile = pending.profile || {}
  const created = await insertDonorRow(supabase, user.id, { ...profile, email: profile.email || user.email }, idProofUrl)

  console.log('[donor:verify] donor insert result', { userId: user.id, donorId: created.id, status: 'success' })
  await clearPendingDonor().catch(() => {})
  return created
}

/**
 * Record a new donation for the signed-in donor. The database trigger
 * `donations_last_donation_sync` automatically updates donors.last_donation
 * to this newest date, which keeps eligibility + matching in sync.
 *
 * @param {Object} input
 * @param {string} input.donationDate - YYYY-MM-DD
 * @param {string} input.bloodBank
 * @param {string} [input.city]
 * @param {number} [input.units=1]
 * @param {string} [input.notes]
 * @returns {Promise<Object>} The inserted donation row.
 */
export const recordDonation = async ({ donationDate, bloodBank, city, units = 1, notes = '' }) => {
  const supabase = getSupabase()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user?.id) {
    throw new Error('You must be signed in to record a donation.')
  }

  if (!donationDate) throw new Error('Donation date is required')
  if (!bloodBank?.trim()) throw new Error('Blood bank / donation center is required')
  if (!Number(units) || Number(units) < 1) throw new Error('At least 1 unit is required')

  const { donor, error: donorError } = await fetchDonorProfile(supabase, user.id)
  if (donorError) throw new Error(`Unable to load your donor profile. Database error: ${donorError.message}`)
  if (!donor?.id) throw new Error('No donor profile found for this account.')

  const { data, error } = await supabase
    .from('donations')
    .insert({
      donor_id: donor.id,
      donation_date: donationDate,
      blood_bank: bloodBank.trim(),
      city: city?.trim() || null,
      units: Number(units),
      notes: notes?.trim() || null,
    })
    .select()
    .single()

  if (error) {
    console.error('[donor:donations] insert failed', { userId: user.id, error })
    throw new Error(mapDonationInsertError(error))
  }

  return data
}

/**
 * Load the donor's donation history (most recent first). The dashboard uses
 * this for the real timeline, stats and the 90-day eligibility recalc.
 *
 * @returns {Promise<Array<Object>>}
 */
export const fetchDonationHistory = async () => {
  const supabase = getSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.id) return []

  const { donor, error: donorError } = await fetchDonorProfile(supabase, user.id)
  if (donorError) throw new Error(`Unable to load your donor profile. Database error: ${donorError.message}`)
  if (!donor?.id) return []

  const { data, error } = await supabase
    .from('donations')
    .select('*')
    .eq('donor_id', donor.id)
    .order('donation_date', { ascending: false })

  if (error) {
    console.error('[donor:donations] fetch failed', { userId: user.id, error })
    throw new Error('Unable to load your donation history.')
  }

  return data || []
}

export const fetchDonorRequests = async () => {
  const supabase = getSupabase()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user?.id) return []

  const { data, error } = await supabase.rpc('get_donor_requests', {
    p_donor_id: user.id,
  })

  if (error) {
    console.error('[donor:requests] fetch failed', { userId: user.id, error })
    throw new Error('Unable to load matched blood requests.')
  }

  return (data || []).map((request) => ({
    id: request.request_id,
    bloodGroup: request.blood_group,
    units: request.units_required,
    hospitalName: request.hospital_name,
    city: request.city,
    address: request.hospital_address,
    contactName: request.contact_name,
    contactPhone: request.contact_phone,
    notes: request.notes,
    requiredBy: request.required_by,
    priority: request.priority,
    requestStatus: request.request_status,
    donorResponse: request.donor_response,
    distanceKm: request.distance_km,
    distanceBand: request.distance_band,
    matchScore: request.match_score,
    acceptedCount: request.accepted_count,
    maxAccepted: request.max_accepted,
    matchedAt: request.matched_at,
  }))
}

export const acceptDonorRequest = async (requestId) => {
  const supabase = getSupabase()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user?.id) throw new Error('You must be signed in to respond to a request.')

  const { data, error } = await supabase.rpc('accept_donor_request', {
    p_request_id: requestId,
    p_donor_id: user.id,
  })
  if (error) throw new Error(error.message)
  return data?.[0] || data
}

export const rejectDonorRequest = async (requestId) => {
  const supabase = getSupabase()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user?.id) throw new Error('You must be signed in to respond to a request.')

  const { data, error } = await supabase.rpc('reject_donor_request', {
    p_request_id: requestId,
    p_donor_id: user.id,
  })
  if (error) throw new Error(error.message)
  return data?.[0] || data
}

export const recordDonorOutcome = async (requestId, donated) => {
  const supabase = getSupabase()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user?.id) throw new Error('You must be signed in to record an outcome.')

  const { data, error } = await supabase.rpc('record_donor_outcome', {
    p_request_id: requestId,
    p_donor_id: user.id,
    p_donated: donated,
  })
  if (error) throw new Error(error.message)
  return data?.[0] || data
}

/**
 * Delete a donation record (e.g. added by mistake). The trigger keeps
 * donors.last_donation in sync automatically.
 *
 * @param {string} id
 * @returns {Promise<void>}
 */
export const deleteDonation = async (id) => {
  const supabase = getSupabase()
  const { error } = await supabase.from('donations').delete().eq('id', id)

  if (error) {
    console.error('[donor:donations] delete failed', { id, error })
    throw new Error('Unable to delete the donation record.')
  }
}

/**
 * Resend the sign-up verification email for an unconfirmed donor.
 *
 * @param {string} email - The email address that needs to be verified.
 * @returns {Promise<void>}
 */
export const resendDonorVerification = async (email) => {
  const supabase = getSupabase()

  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  })

  if (error) {
    console.error('[donor:verify] Resend verification email failed', { email, error })
    throw new Error(mapAuthError(error.message))
  }

  console.log('[donor:verify] Verification email resent', { email })
}

const mapLoginError = (error) => {
  const message = (error?.message || '').toLowerCase()
  const status = error?.status

  if (message.includes('invalid login credentials')) {
    return 'Incorrect email or password. Please try again.'
  }
  if (message.includes('email not confirmed')) {
    return 'Please verify your email before signing in.'
  }
  if (status === 429 || message.includes('rate limit') || message.includes('too many')) {
    return 'Too many attempts. Please wait a moment and try again.'
  }
  if (message.includes('network') || message.includes('fetch')) {
    return 'Network error. Please check your connection and try again.'
  }
  return error?.message || 'Unable to sign in. Please try again.'
}

const mapAuthError = (message) => {
  const msg = (message || '').toLowerCase()
  if (msg.includes('already registered') || msg.includes('already been registered')) {
    return 'An account with this email already exists. Please sign in instead.'
  }
  if (msg.includes('password')) {
    return 'Password must be at least 6 characters long.'
  }
  return message || 'Unable to create your account. Please try again.'
}

const isAlreadyRegisteredError = (message) => {
  const value = (message || '').toLowerCase()
  return value.includes('already registered') || value.includes('already been registered')
}

const mapDonationInsertError = (error) => {
  const message = (error?.message || '').toLowerCase()
  const details = error?.details?.toLowerCase() || ''

  if (message.includes('row-level security') || message.includes('new row violates')) {
    return 'The donation could not be saved. Please make sure you are signed in.'
  }
  if (details.includes('donation_date') || details.includes('not null') || message.includes('null value')) {
    return 'Please fill in the donation date and blood bank.'
  }
  const reason = error?.message || 'Unknown database error'
  return `Failed to record the donation. Database error: ${reason}`
}

const mapInsertError = (error) => {
  const message = (error?.message || '').toLowerCase()
  const details = error?.details?.toLowerCase() || ''

  if (message.includes('duplicate') || message.includes('already exists') || details.includes('already exists')) {
    return 'You already have a donor profile. Please sign in instead.'
  }
  // Surface the actual database error so failures are never silent.
  const reason = error?.message || 'Unknown database error'
  return `Failed to save your donor details. Database error: ${reason}`
}
