const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

export const apiRequest = async (path, options = {}) => {
  // multipart/form-data (document uploads) must NOT get a JSON content type -
  // the browser sets the correct boundary automatically.
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(options.headers || {}),
    },
  })

  const payload = await response.json().catch(() => ({}))

  if (!response.ok) {
    const error = new Error(payload.details || payload.message || 'Something went wrong')
    error.status = response.status
    throw error
  }

  return payload
}
