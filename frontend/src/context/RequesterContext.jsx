import { createContext, useContext, useState, useEffect } from 'react'

const RequesterContext = createContext(null)

const getStoredUser = () => {
  try {
    const data = localStorage.getItem('requester_user')
    return data ? JSON.parse(data) : null
  } catch {
    return null
  }
}

const getStoredRequests = () => {
  try {
    const data = localStorage.getItem('requester_requests')
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

export const RequesterProvider = ({ children }) => {
  const [user, setUser] = useState(getStoredUser)
  const [requests, setRequests] = useState(getStoredRequests)
  const [notifications, setNotifications] = useState([
    { id: 1, text: 'Welcome to HemoConnect360 Requester Portal', time: 'Just now', read: false },
    { id: 2, text: 'Your account is ready. Start requesting blood.', time: '1 min ago', read: false },
  ])

  useEffect(() => {
    localStorage.setItem('requester_user', JSON.stringify(user))
  }, [user])

  useEffect(() => {
    localStorage.setItem('requester_requests', JSON.stringify(requests))
  }, [requests])

  const loginUser = (userData) => {
    setUser(userData)
  }

  const logoutUser = () => {
    setUser(null)
  }

  const addRequest = (requestData) => {
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
    setRequests((prev) => [newRequest, ...prev])
    return newRequest
  }

  const updateRequest = (id, updates) => {
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updates } : r))
    )
  }

  const cancelRequest = (id) => {
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'cancelled' } : r))
    )
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
