/**
 * Utility for capturing the browser's current location so donors and
 * requesters can attach latitude/longitude for nearby matching.
 */
export const getCurrentPosition = () =>
  new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Geolocation is not supported by this browser.'))
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        })
      },
      (error) => {
        const messages = {
          1: 'Location access was denied. Please enable location in your browser.',
          2: 'Unable to determine your location. Please try again.',
          3: 'Location request timed out. Please try again.',
        }
        reject(new Error(messages[error.code] || 'Unable to get your location.'))
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    )
  })

/**
 * Format a coordinate to a fixed-precision string for display.
 */
export const formatCoord = (value, precision = 5) =>
  value === null || value === undefined || value === '' ? '' : Number(value).toFixed(precision)