import { createContext, useContext, useState, useEffect } from 'react'
import { clearRequesterToken, requesterPhoneLogin, updateRequesterProfile, createBloodRequest, listBloodRequests, cancelBloodRequest } from '../services/requesterService'

const RequesterContext = createContext(null)

const getStoredUser = () => {
  try {
    const data = localStorage.getItem('requester_user')
    return data ? JSON.parse(data) : null
  } catch {
    return null
  }
}

const getStoredRequests = (phone) => {
  if (!phone) return []
  try {
    const data = localStorage.getItem(`requester_requests_${phone}`)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

const getStoredRequesterUsers = () => {
  try {
    const data = localStorage.getItem('requesterUsers')
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

export const RequesterProvider = ({ children }) => {
  const [user, setUser] = useState(getStoredUser)
  const [requests, setRequests] = useState(() => getStoredRequests(getStoredUser()?.phone))
  const [notifications, setNotifications] = useState([
    { id: 1, text: 'Welcome to HemoConnect360 Requester Portal', time: 'Just now', read: false },
    { id: 2, text: 'Your account is ready. Start requesting blood.', time: '1 min ago', read: false },
  ])

  useEffect(() => {
    localStorage.setItem('requester_user', JSON.stringify(user))
  }, [user])

  useEffect(() => {
    setRequests(getStoredRequests(user?.phone))
  }, [user?.phone])

  useEffect(() => {
    if (user?.phone) {
      localStorage.setItem(`requester_requests_${user.phone}`, JSON.stringify(requests))
    }
  }, [requests, user?.phone])

  const saveUserLocally = (userData) => {
    const phone = userData.phone?.trim()
    if (!phone) return null

    const existingUsers = getStoredRequesterUsers()
    const existingUser = existingUsers.find((u) => u.phone === phone)
    const nextUser = { ...(existingUser || {}), ...userData, phone, isLoggedIn: true }
    const nextUsers = existingUser
      ? existingUsers.map((u) => (u.phone === phone ? nextUser : u))
      : [...existingUsers, nextUser]

    localStorage.setItem('requesterUsers', JSON.stringify(nextUsers))
    setUser(nextUser)
    return nextUser
  }

const loginUser = async (userData) => {
    const phone = userData.phone?.trim()
    if (!phone) return null

    try {
      const account = await requesterPhoneLogin(phone)
      const hasProfileDetails = ['fullName', 'age', 'gender', 'city', 'address', 'bloodNeededFor', 'email']
        .some((field) => userData[field])
      const syncedAccount = hasProfileDetails ? await updateRequesterProfile(userData) : account
      const nextUser = { ...syncedAccount.profile, isLoggedIn: true }
      const requestHistory = syncedAccount.requestHistory || []
      localStorage.setItem(`requester_requests_${nextUser.phone}`, JSON.stringify(requestHistory))
      setRequests(requestHistory)
      return saveUserLocally(nextUser)
    } catch (error) {
      saveUserLocally(userData)
      throw error
    }
  }

  const logoutUser = () => {
    clearRequesterToken()
    setUser(null)
  }

  const saveProfile = async (profileData) => {
    const nextUser = { ...(user || {}), ...profileData }
    saveUserLocally(nextUser)

    try {
      const account = await updateRequesterProfile(profileData)
      const savedUser = { ...account.profile, isLoggedIn: true }
      const requestHistory = account.requestHistory || []
      localStorage.setItem(`requester_requests_${savedUser.phone}`, JSON.stringify(requestHistory))
      setRequests(requestHistory)
      saveUserLocally(savedUser)
      return { success: true, user: savedUser }
    } catch (error) {
      return { success: false, user: nextUser, message: error.message }
    }
  }

  const addRequest = async (requestData) => {
    const newRequest = {
      ...requestData,
      id: `REQ-${Date.now().toString(36).toUpperCase()}`,
      status: 'submitted',
      createdAt: new Date().toISOString(),
      timeline: [
        { step: 'submitted', label: 'Request Submitted', time: new Date().toLocaleString(), completed: true },
        { step: 'searching', label: 'Searching Donors', time: null, completed: false },
        { step: 'notified', label: 'Nearby Donors Notified', time: null, completed: false },
        { step: 'accepted', label: 'Donor Accepted', time: null, completed: false },
        { step: 'donated', label: 'Blood Donated', time: null, completed: false },
        { step: 'completed', label: 'Completed', time: null, completed: false },
      ],
    }

    setRequests((prev) => {
      const updated = [newRequest, ...prev]
      if (user?.phone) {
        localStorage.setItem(`requester_requests_${user.phone}`, JSON.stringify(updated))
      }
      return updated
    })

    try {
      const synced = await createBloodRequest({
        patientName: requestData.patientName,
        patientAge: requestData.patientAge,
        patientGender: requestData.patientGender,
        bloodGroup: requestData.bloodGroup,
        units: requestData.units,
        hospitalName: requestData.hospitalName,
        city: requestData.city,
        address: requestData.address,
        requiredBy: requestData.requiredBy,
        priority: requestData.priority,
        contactName: requestData.contactName,
        contactPhone: requestData.contactPhone,
        contactEmail: requestData.contactEmail || '',
        latitude: requestData.latitude || null,
        longitude: requestData.longitude || null,
        notes: requestData.notes || '',
      })
      const donorMatches = Array.isArray(synced.matches) ? synced.matches : []
      const syncedTimeline = newRequest.timeline.map((step) => ({
        ...step,
        completed: step.step === 'submitted'
          || (step.step === 'searching' && donorMatches.length > 0)
          || (step.step === 'notified' && donorMatches.length > 0),
        time: step.step === 'notified' && donorMatches.length > 0
          ? new Date().toLocaleString()
          : step.time,
      }))
      setRequests((prev) =>
        prev.map((r) => (r.id === newRequest.id ? { ...synced, timeline: syncedTimeline } : r))
      )
      newRequest.timeline = syncedTimeline
    } catch (error) {
      console.error('[requester] Blood request sync failed', error)
      throw error
    }

    return newRequest
  }

  const updateRequest = (id, updates) => {
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updates } : r))
    )
  }

  const cancelRequest = async (id) => {
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'cancelled' } : r))
    )

    try {
      await cancelBloodRequest(id)
    } catch {
    }
  }

  const markNotificationRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
  }

  const value = {
    user,
    requests,
    notifications,
    loginUser,
    logoutUser,
    saveProfile,
    addRequest,
    updateRequest,
    cancelRequest,
    markNotificationRead,
  }

  return (
    <RequesterContext.Provider value={value}>
      {children}
    </RequesterContext.Provider>
  )
}

export const useRequester = () => {
  const context = useContext(RequesterContext)
  if (!context) {
    throw new Error('useRequester must be used within a RequesterProvider')
  }
  return context
}
