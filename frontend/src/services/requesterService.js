import { apiRequest } from './api'

const TOKEN_KEY = 'requester_token'

export const getRequesterToken = () => localStorage.getItem(TOKEN_KEY)

export const setRequesterToken = (token) => {
  if (token) localStorage.setItem(TOKEN_KEY, token)
}

export const clearRequesterToken = () => {
  localStorage.removeItem(TOKEN_KEY)
}

const authHeaders = () => {
  const token = getRequesterToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export const requesterPhoneLogin = async (phone) => {
  const payload = await apiRequest('/requesters/phone-login', {
    method: 'POST',
    body: JSON.stringify({ phone }),
  })

  setRequesterToken(payload.data?.token)
  return payload.data
}

export const updateRequesterProfile = async (profile) => {
  const payload = await apiRequest('/requesters/me/profile', {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(profile),
  })

  setRequesterToken(payload.data?.token)
  return payload.data
}

export const createBloodRequest = async (data) => {
  const payload = await apiRequest('/blood-requests', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  })

  return payload.data
}

export const listBloodRequests = async () => {
  const payload = await apiRequest('/blood-requests', {
    method: 'GET',
    headers: authHeaders(),
  })

  return payload.data
}

export const cancelBloodRequest = async (id) => {
  const payload = await apiRequest(`/blood-requests/${id}/cancel`, {
    method: 'PATCH',
    headers: authHeaders(),
  })

  return payload.data
}

export const getBloodRequest = async (id) => {
  const payload = await apiRequest(`/blood-requests/${id}`, {
    method: 'GET',
    headers: authHeaders(),
  })

  return payload.data
}
