import { getSupabase } from '../lib/supabase'
import { apiRequest } from './api'

const getAccessToken = async () => {
  const supabase = getSupabase()
  const { data } = await supabase.auth.getSession()
  return data?.session?.access_token || null
}

const authHeaders = async () => {
  const token = await getAccessToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

/**
 * Map the page's profile object (name, licenseNumber, address, ...) to the
 * backend API field names and build a multipart/form-data body including the
 * account credentials and the two verification documents.
 */
const toRegistrationFormData = (profile, email, password, licenseDoc, authorizationDoc) => {
  const data = new FormData()

  const fields = {
    bloodBankName: profile.name,
    registrationNumber: profile.licenseNumber,
    bloodBankType: profile.type,
    establishedYear: profile.yearEstablished || '',
    officialEmail: profile.email,
    primaryPhone: profile.primaryPhone,
    alternatePhone: profile.alternatePhone || '',
    addressLine: profile.address,
    city: profile.city,
    district: profile.district || '',
    state: profile.state,
    pincode: profile.pincode,
    latitude: profile.latitude || '',
    longitude: profile.longitude || '',
    authorizedName: profile.authorizedName,
    authorizedDesignation: profile.authorizedDesignation,
    authorizedPhone: profile.authorizedPhone,
    authorizedEmail: profile.authorizedEmail || '',
    email,
    password,
  }

  Object.entries(fields).forEach(([key, value]) => data.append(key, value == null ? '' : value))

  if (licenseDoc) data.append('licenseDoc', licenseDoc)
  if (authorizationDoc) data.append('authorizationDoc', authorizationDoc)

  return data
}

/**
 * Register a new blood bank.
 *
 * The Auth account is created by the BACKEND through the Supabase Admin API
 * with email_confirm: true (service-role key stays server-side), so registration
 * works whether or not "Confirm email" is enabled globally and needs NO email
 * verification step. On success the user is signed in and the real persisted
 * record is returned - never a hardcoded success.
 *
 * @param {Object} input
 * @param {string} input.email
 * @param {string} input.password
 * @param {File|null} input.licenseDoc
 * @param {File|null} input.authorizationDoc
 * @param {Object} input.profile - blood bank fields (name, licenseNumber, ...)
 * @returns {Promise<Object>} the persisted record
 */
export const registerBloodBank = async ({ email, password, licenseDoc, authorizationDoc, profile }) => {
  const supabase = getSupabase()

  const payload = await apiRequest('/blood-banks/register', {
    method: 'POST',
    body: toRegistrationFormData(profile, email, password, licenseDoc, authorizationDoc),
  })

  const bloodBank = payload.data

  // The account was created with a confirmed email server-side, so signing in
  // now always works - even with "Confirm email" enabled globally.
  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
  if (signInError) {
    throw new Error(
      'Your blood bank was registered, but automatic sign-in failed. Please sign in on the Blood Bank Login page.'
    )
  }

  return bloodBank
}

/**
 * Load the signed-in user's blood bank profile from the backend.
 *
 * @returns {Promise<{ bloodBank: Object|null, error: Error|null }>}
 */
export const fetchBloodBankProfile = async () => {
  const payload = await apiRequest('/blood-banks/me', {
    method: 'GET',
    headers: await authHeaders(),
  })

  return { bloodBank: payload.data || null, error: null }
}

/**
 * Update the signed-in blood bank's own profile. The backend identifies the
 * bank from the JWT and only writes the whitelisted fields; verification
 * details and documents are read-only.
 *
 * @param {Object} updates - camelCase fields (bloodBankName, bloodBankType,
 *   registrationNumber, establishedYear, officialEmail, primaryPhone,
 *   alternatePhone, addressLine, city, district, state, pincode, latitude,
 *   longitude, authorizedPersonName, designation, authorizedPersonPhone,
 *   authorizedPersonEmail)
 * @returns {Promise<Object>} the committed profile DTO
 */
export const updateBloodBankProfile = async (updates) => {
  const payload = await apiRequest('/blood-banks/me', {
    method: 'PATCH',
    headers: await authHeaders(),
    body: JSON.stringify(updates),
  })

  return payload.data
}

/**
 * Sign an existing blood bank in with Supabase Auth and load their real
 * profile from the backend.
 *
 * No email confirmation is involved: the account can be used as soon as it is
 * registered, and no approval status is required to access the dashboard.
 *
 * @param {Object} credentials
 * @param {string} credentials.email
 * @param {string} credentials.password
 * @returns {Promise<{ user: Object, bloodBank: Object }>}
 */
export const loginBloodBank = async ({ email, password }) => {
  const supabase = getSupabase()

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    throw new Error(mapLoginError(error))
  }

  const user = data?.user
  if (!user?.id) {
    throw new Error('Sign in succeeded but no user was returned. Please try again.')
  }

  const { bloodBank, error: profileError } = await fetchBloodBankProfile()
  if (profileError) {
    if (profileError.status === 404) {
      throw new Error('No blood bank profile found for this account. Please register first.')
    }
    throw profileError
  }

  return { user, bloodBank }
}

const mapLoginError = (error) => {
  const message = (error?.message || '').toLowerCase()
  const status = error?.status

  if (message.includes('invalid login credentials')) {
    return 'Incorrect email or password. Please try again.'
  }
  if (status === 429 || message.includes('rate limit') || message.includes('too many')) {
    return 'Too many attempts. Please wait a moment and try again.'
  }
  if (message.includes('network') || message.includes('fetch')) {
    return 'Network error. Please check your connection and try again.'
  }
  return error?.message || 'Unable to sign in. Please try again.'
}

export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

export const STOCK_REASONS = ['Blood Collection', 'Blood Issue', 'Correction', 'Other']

/**
 * Load the signed-in blood bank's real inventory from the backend.
 *
 * @returns {Promise<{ inventory: Array, totalUnits: number }>}
 */
export const fetchBloodBankInventory = async () => {
  const payload = await apiRequest('/blood-banks/inventory', {
    method: 'GET',
    headers: await authHeaders(),
  })
  return payload.data || { inventory: [], totalUnits: 0 }
}

/**
 * Adjust stock for one blood group through the backend, which performs the
 * change atomically in the database (never trusting a client-supplied
 * blood_bank_id / user_id).
 *
 * @param {Object} input
 * @param {string} input.bloodGroup - one of the 8 ABO/Rh groups
 * @param {'add'|'remove'|'correct'} input.action
 * @param {number} input.quantity - positive units (absolute target for correct)
 * @param {string} input.reason - one of STOCK_REASONS
 * @returns {Promise<{ inventory: Array, totalUnits: number }>}
 */
export const updateBloodBankInventory = async ({ bloodGroup, action, quantity, reason }) => {
  const payload = await apiRequest('/blood-banks/inventory', {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({ bloodGroup, action, quantity, reason }),
  })
  return payload.data || { inventory: [], totalUnits: 0 }
}

/**
 * Load the most recent inventory movements for the signed-in blood bank.
 *
 * @param {number} [limit]
 * @returns {Promise<Array>}
 */
export const fetchBloodBankInventoryHistory = async (limit = 20) => {
  const payload = await apiRequest(`/blood-banks/inventory/history?limit=${limit}`, {
    method: 'GET',
    headers: await authHeaders(),
  })
  return payload.data || []
}

export const INVENTORY_TRANSACTION_TYPES = ['STOCK_ADDED', 'STOCK_REMOVED', 'STOCK_CORRECTION']

/**
 * Load the signed-in blood bank's real stock history with backend-side
 * filtering and pagination. Every inventory transaction (manual stock
 * adjustments, recorded collections and request accepts) appears here.
 *
 * @param {Object} [filters]
 * @param {string} [filters.bloodGroup] - one of BLOOD_GROUPS
 * @param {string} [filters.transactionType] - one of INVENTORY_TRANSACTION_TYPES
 * @param {string} [filters.from] - YYYY-MM-DD start date (inclusive)
 * @param {string} [filters.to] - YYYY-MM-DD end date (inclusive)
 * @param {number} [filters.page]
 * @param {number} [filters.limit]
 * @returns {Promise<{ transactions: Array, total: number, page: number, limit: number, totalPages: number }>}
 */
export const fetchBloodBankStockHistory = async ({
  bloodGroup,
  transactionType,
  from,
  to,
  page = 1,
  limit = 10,
} = {}) => {
  const payload = await apiRequest(
    `/blood-banks/inventory/history${buildQuery({ bloodGroup, transactionType, from, to, page, limit })}`,
    {
      method: 'GET',
      headers: await authHeaders(),
    },
  )
  return payload.data || { transactions: [], total: 0, page, limit, totalPages: 1 }
}

const buildQuery = (params) => {
  const query = new URLSearchParams()
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') query.set(key, String(value))
  })
  const str = query.toString()
  return str ? `?${str}` : ''
}

/**
 * Load blood requests visible to the signed-in blood bank, with real
 * server-side filters and stats.
 *
 * @param {Object} [filters]
 * @param {'all'|'open'|'decided'|string} [filters.status]
 * @param {string} [filters.bloodGroup]
 * @param {string} [filters.priority]
 * @param {string} [filters.search]
 * @param {number} [filters.page]
 * @param {number} [filters.limit]
 * @returns {Promise<{ requests: Array, total: number, stats: Object, page: number, limit: number }>}
 */
export const fetchBloodBankRequests = async (filters = {}) => {
  const payload = await apiRequest(`/blood-requests/blood-bank${buildQuery(filters)}`, {
    method: 'GET',
    headers: await authHeaders(),
  })
  return payload.data || { requests: [], total: 0, stats: {}, page: 1, limit: 20 }
}

/**
 * Load blood requests near the signed-in blood bank, sorted by real distance.
 * Distance, radius filtering and pagination happen server-side in the
 * blood_bank_nearby_requests RPC using the bank's real coordinates from the
 * JWT. needsLocation is true when the bank profile has no coordinates yet.
 *
 * @param {Object} [filters]
 * @param {number} [filters.radiusKm]
 * @param {string} [filters.bloodGroup]
 * @param {string} [filters.priority]
 * @param {'all'|'open'|'decided'|string} [filters.status]
 * @param {string} [filters.from] - needed-by date (YYYY-MM-DD)
 * @param {string} [filters.to] - needed-by date (YYYY-MM-DD)
 * @param {'nearest'|'urgent'|'newest'} [filters.sort]
 * @param {number} [filters.page]
 * @param {number} [filters.limit]
 * @returns {Promise<{ requests: Array, total: number, needsLocation: boolean, page: number, limit: number }>}
 */
export const fetchNearbyBloodRequests = async (filters = {}) => {
  const payload = await apiRequest(
    `/blood-requests/blood-bank/nearby${buildQuery(filters)}`,
    {
      method: 'GET',
      headers: await authHeaders(),
    },
  )
  return payload.data || { requests: [], total: 0, needsLocation: false, page: 1, limit: 10 }
}

/**
 * Load one blood request with its bank action trail.
 *
 * @param {string} id
 * @returns {Promise<{ request: Object, actions: Array }>}
 */
export const fetchBloodBankRequestDetails = async (id) => {
  const payload = await apiRequest(`/blood-requests/blood-bank/${id}`, {
    method: 'GET',
    headers: await authHeaders(),
  })
  return payload.data || { request: null, actions: [] }
}

/**
 * Accept a blood request. The backend deducts the required units from the
 * signed-in bank's inventory atomically and marks the request as approved.
 *
 * @param {string} id
 * @param {Object} [options]
 * @returns {Promise<Object>} detail + updated stats
 */
export const acceptBloodRequest = async (id, options = {}) => {
  const payload = await apiRequest(`/blood-requests/blood-bank/${id}/accept`, {
    method: 'PATCH',
    headers: await authHeaders(),
    body: JSON.stringify({ note: options.note || '' }),
  })
  return payload.data
}

/**
 * Reject a blood request with a saved reason. No inventory is changed.
 *
 * @param {string} id
 * @param {{ reason: string }} options
 * @returns {Promise<Object>} detail + updated stats
 */
export const rejectBloodRequest = async (id, { reason }) => {
  const payload = await apiRequest(`/blood-requests/blood-bank/${id}/reject`, {
    method: 'PATCH',
    headers: await authHeaders(),
    body: JSON.stringify({ reason }),
  })
  return payload.data
}

/**
 * Mark an approved blood request as completed.
 *
 * @param {string} id
 * @returns {Promise<Object>} detail + updated stats
 */
export const completeBloodRequest = async (id) => {
  const payload = await apiRequest(`/blood-requests/blood-bank/${id}/complete`, {
    method: 'PATCH',
    headers: await authHeaders(),
    body: JSON.stringify({}),
  })
  return payload.data
}

/**
 * Load the donors the signed-in blood bank can collect from. Eligibility is
 * computed server-side from the last donation and the group's interval.
 *
 * @returns {Promise<Array>} donor records ({ id, fullName, phone, bloodGroup,
 *   city, gender, dob, weight, hemoglobin, lastDonation, eligible, nextEligible })
 */
export const fetchBloodBankCollectionDonors = async () => {
  const payload = await apiRequest('/blood-banks/collections/donors', {
    method: 'GET',
    headers: await authHeaders(),
  })
  return payload.data || []
}

/**
 * Look up one donor by phone number.
 *
 * @param {string} phone - 10-digit phone number
 * @returns {Promise<Object|null>} donor record, or null if not found
 */
export const fetchBloodBankDonorByPhone = async (phone) => {
  const payload = await apiRequest(`/blood-banks/collections/donors/${encodeURIComponent(phone)}`, {
    method: 'GET',
    headers: await authHeaders(),
  })
  return payload.data || null
}

/**
 * Load the signed-in blood bank's collection history. The backend returns all
 * records; date/group filtering is done client-side.
 *
 * @returns {Promise<Array>} collection records ({ id, donorId, donorName,
 *   donorPhone, bloodGroup, donationDate, units, city, notes, createdAt })
 */
export const fetchBloodBankCollectionHistory = async () => {
  const payload = await apiRequest('/blood-banks/collections/history', {
    method: 'GET',
    headers: await authHeaders(),
  })
  return payload.data || []
}

/**
 * Record a blood collection. The backend verifies the donor, eligibility,
 * blood-group match and duplicate prevention atomically, and adds the units to
 * the signed-in bank's inventory in the same transaction.
 *
 * @param {Object} input
 * @param {string} input.donorPhone - 10-digit phone number
 * @param {string} input.bloodGroup - one of the 8 ABO/Rh groups
 * @param {string} input.donationDate - YYYY-MM-DD, not in the future
 * @param {number} input.units - whole number between 1 and 5
 * @param {string} [input.notes]
 * @returns {Promise<{ donation: Object }>} { donation: { id, donorId,
 *   donorName, bloodGroup, donationDate, units, bloodBankId, newInventoryQuantity } }
 */
export const recordBloodBankCollection = async ({ donorPhone, bloodGroup, donationDate, units, notes }) => {
  const payload = await apiRequest('/blood-banks/collections', {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({ donorPhone, bloodGroup, donationDate, units, notes: notes ?? '' }),
  })
  return payload.data || { donation: null }
}
