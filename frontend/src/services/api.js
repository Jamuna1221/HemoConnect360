const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

export const apiRequest = async (path, options = {}) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  })

  const payload = await response.json().catch(() => ({}))

  if (!response.ok) {
    const message = payload.details || payload.message || 'Something went wrong'
    throw new Error(message)
  }

  return payload
}
