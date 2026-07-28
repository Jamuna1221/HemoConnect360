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
