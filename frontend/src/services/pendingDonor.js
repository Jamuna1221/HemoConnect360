const DB_NAME = 'hemoconnect360'
const STORE_NAME = 'pendingDonor'
const KEY = 'pending-donor-registration'

const openDb = () =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME)
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })

/**
 * Persist a donor registration that cannot be completed yet because the
 * account is still awaiting email verification.
 *
 * The value may include the ID proof `File` (IndexedDB supports structured
 * cloning of File/Blob objects).
 *
 * @param {Object} value { email, userId, profile, idProof }
 * @returns {Promise<void>}
 */
export const savePendingDonor = async (value) => {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).put(value, KEY)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

/**
 * Read the pending donor registration, if any.
 *
 * @returns {Promise<Object|null>}
 */
export const getPendingDonor = async () => {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const req = tx.objectStore(STORE_NAME).get(KEY)
    req.onsuccess = () => resolve(req.result || null)
    req.onerror = () => reject(req.error)
  })
}

/**
 * Remove the pending donor registration once it has been completed.
 *
 * @returns {Promise<void>}
 */
export const clearPendingDonor = async () => {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).delete(KEY)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}
