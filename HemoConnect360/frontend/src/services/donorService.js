import { apiRequest } from './api'

/**
 * Register a new donor.
 * @param {Object} donorData - Form fields from DonorForm
 * @returns {Promise<Object>} - The created donor record
 */
export const registerDonor = async (donorData) => {
  const payload = await apiRequest('/donors/register', {
    method: 'POST',
    body: JSON.stringify(donorData),
  })
  return payload.data
}
