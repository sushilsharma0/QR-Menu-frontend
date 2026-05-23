import React, { createContext, useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from '@utils/toast'
import { formatAuthLoginToast } from '../utils/authLoginErrors'
import api from '../services/api'
import { defaultPortalPathForUser, branchPortalBase } from '../utils/tenantPaths'
import {
  readInitialAuthToken,
  getAuthUserRaw,
  getAuthToken,
  setAuthSession,
  setRestaurantSessionSecrets,
  clearAuthSession,
  requestBrowserLocation,
} from '../utils/authStorage'
import { clearBranchSelection, setBranchPortalContext } from '../utils/branchStorage'

/** Log out authenticated dashboard users after this much inactivity (visible tab) or hidden tab time */
const SESSION_IDLE_MS = 60 * 60 * 1000 // 1 hour
const RESTAURANT_REMINDER_PREFIX = 'qrmenu:restaurant-daily-reminder'

const daysUntil = (dateValue) => {
  if (!dateValue) return null
  const end = new Date(dateValue)
  if (Number.isNaN(end.getTime())) return null
  return Math.max(0, Math.ceil((end.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
}

const restaurantReminderMessage = (authUser) => {
  if (authUser?.role !== 'restaurant') return null

  if (authUser.needsPlanUpgrade) {
    return authUser.planEndDate && !authUser.isTrialActive
      ? 'Your subscription has expired. Renew or choose a plan to unlock paused features.'
      : 'Your trial has ended. Choose a plan to continue using locked features.'
  }

  const trialDaysLeft = authUser.hasPaidPlanActive ? null : daysUntil(authUser.trialEndsAt)
  if (typeof trialDaysLeft === 'number' && trialDaysLeft <= 7) {
    const trialText =
      trialDaysLeft === 0
        ? 'Your trial ends today.'
        : `Your trial ends in ${trialDaysLeft} day(s).`
    return `${trialText} You can verify KYC and choose a plan anytime from your account.`
  }

  if (authUser.isKYCVerified !== true) {
    return 'Reminder: verify KYC when convenient and choose a plan before your trial ends.'
  }

  return null
}

const showRestaurantDailyReminder = (authUser) => {
  const message = restaurantReminderMessage(authUser)
  if (!message || typeof window === 'undefined') return

  const id = authUser.id || authUser._id || authUser.email || 'restaurant'
  const today = new Date().toISOString().slice(0, 10)
  const key = `${RESTAURANT_REMINDER_PREFIX}:${id}:${today}`
  if (window.localStorage.getItem(key)) return
  window.localStorage.setItem(key, '1')
  toast(message, { duration: 8000 })
}

export const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(readInitialAuthToken)
  const [isLoading, setIsLoading] = useState(true)
  const isAuthenticated = Boolean(token && user)

  const captureRestaurantSessionLocation = async () => {
    try {
      const location = await requestBrowserLocation()
      await api.patch('/restaurant/auth/sessions/current/location', location, {
        skipErrorToast: true,
      })
    } catch {
      // Location permission is optional. The session remains valid if the user denies it.
    }
  }

  useEffect(() => {
    const storedUser = getAuthUserRaw()
    if (storedUser && token) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (e) {
        console.error('Failed to parse user:', e)
        clearAuthSession()
      }
    }
    setIsLoading(false)
  }, [token])

  const logout = useCallback(async (options = {}) => {
    let loginRole = options.loginRole
    if (loginRole === undefined && options.idleTimeout && user) {
      if (user.role === 'super_admin' || user.role === 'admin' || user.role === 'support') loginRole = 'platform'
      else if (user.scope === 'employee') loginRole = 'employee'
      else if (user.scope === 'branch_user') loginRole = 'branch'
      else if (user.role === 'restaurant') loginRole = 'restaurant'
    }

    try {
      if (user?.scope === 'employee') {
        await api.post('/restaurant/employees/logout', {}, { skipErrorToast: true })
      } else if (user?.scope === 'branch_user') {
        await api.post('/restaurant/branch-auth/logout', {}, { skipErrorToast: true })
      } else if (user?.role === 'restaurant') {
        await api.post('/restaurant/auth/logout', {}, { skipErrorToast: true })
      } else if (user?.role === 'super_admin' || user?.role === 'admin' || user?.role === 'support') {
        await api.post('/platform/auth/logout', {}, { skipErrorToast: true })
      }
    } catch (e) {
      // best-effort server logout logging; local logout still proceeds
    }

    clearAuthSession()
    clearBranchSelection()
    setToken(null)
    setUser(null)
    if (options.idleTimeout) {
      toast.error('Your session ended after being inactive. Please sign in again.')
    } else {
      toast.success('Logged out successfully')
    }
    const loginPath =
      loginRole === 'branch'
        ? '/login'
        : loginRole === 'platform' || loginRole === 'restaurant' || loginRole === 'employee'
          ? `/login?role=${loginRole}`
          : '/login'
    navigate(loginPath)
  }, [navigate, user])

  /** Auto logout after 1h idle (no input while tab visible) or 1h with tab in background */
  useEffect(() => {
    if (!token || !user) return undefined

    const lastActivityRef = { current: Date.now() }
    let hiddenAt = null

    const bumpActivity = () => {
      lastActivityRef.current = Date.now()
    }

    const activityEvents = ['mousedown', 'keydown', 'touchstart', 'scroll', 'click']
    activityEvents.forEach((evt) => {
      window.addEventListener(evt, bumpActivity, { passive: true })
    })

    const tick = () => {
      if (document.hidden) return
      if (Date.now() - lastActivityRef.current >= SESSION_IDLE_MS) {
        logout({ idleTimeout: true })
      }
    }
    const intervalId = window.setInterval(tick, 60 * 1000)

    const onVisibility = () => {
      if (document.hidden) {
        hiddenAt = Date.now()
      } else {
        if (hiddenAt != null && Date.now() - hiddenAt >= SESSION_IDLE_MS) {
          logout({ idleTimeout: true })
          return
        }
        hiddenAt = null
        bumpActivity()
      }
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      activityEvents.forEach((evt) => {
        window.removeEventListener(evt, bumpActivity)
      })
      window.clearInterval(intervalId)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [token, user, logout])

  const login = async (email, password, role, restaurantId = null) => {
    try {
      let endpoint = ''
      let requestData = {}
      
      if (role === 'platform') {
        endpoint = '/platform/auth/login'
        requestData = { email, password }
      } else if (role === 'restaurant') {
        endpoint = '/restaurant/auth/login'
        requestData = { email, password }
      } else if (role === 'employee') {
        endpoint = '/restaurant/employees/login'
        requestData = { username: email, password, restaurantId }
      }
      
      const response = await api.post(endpoint, requestData)
      
      const { token: newToken, user: userData, employee: employeeData } = response.data.data
      const rawUser = userData || employeeData
      const authUser = {
        ...rawUser,
        scope: role === 'employee' ? 'employee' : role
      }
      
      if (!newToken || !rawUser) {
        throw new Error('Invalid response structure from server')
      }

      if (role === 'restaurant') {
        clearBranchSelection()
      }
      if (role === 'employee') {
        clearBranchSelection()
      }

      setAuthSession(newToken, JSON.stringify(authUser))
      if (role === 'restaurant') {
        setRestaurantSessionSecrets({
          refreshToken: response.data.data.refreshToken,
          sessionId: response.data.data.session?.id,
        })
        captureRestaurantSessionLocation()
      }

      // Update state
      setToken(newToken)
      setUser(authUser)

      toast.success(response.data?.message || `Welcome ${authUser.name || email}!`)

      if (authUser.role === 'restaurant') {
        showRestaurantDailyReminder(authUser)
      }
      
      // Redirect based on role
      if (authUser.scope === 'employee' && authUser.mustChangePassword) {
        navigate('/employee/change-password')
      } else if (authUser.scope === 'employee') {
        navigate(defaultPortalPathForUser(authUser))
      } else if (authUser.role === 'super_admin' || authUser.role === 'admin' || authUser.role === 'support') {
        navigate('/platform/dashboard')
      } else if (authUser.role === 'restaurant') {
        navigate(defaultPortalPathForUser(authUser))
      } else {
        navigate('/')
      }
      
      return { success: true }
      
    } catch (error) {
      console.error('❌ Login error:', error)
      const status = error.response?.status
      const payload = error.response?.data?.errors || error.response?.data?.data
      const errorMsg = error.response?.data?.message || error.message || 'Login failed'
      if (!error.__toastShown) {
        if (status === 423) {
          const until = payload?.lockedUntil
            ? new Date(payload.lockedUntil).toLocaleString()
            : null
          toast.error(until ? `${errorMsg} (until ${until})` : errorMsg, { duration: 9000 })
        } else {
          toast.error(errorMsg)
        }
      }
      return { success: false, error: errorMsg, locked: status === 423 }
    }
  }

  const loginBranch = async (restaurantId, portalKey, branchSlug, username, password) => {
    try {
      const response = await api.post('/restaurant/branch-auth/login', {
        restaurantId: String(restaurantId).trim(),
        portalKey: String(portalKey).trim(),
        branchSlug: String(branchSlug).trim().toLowerCase(),
        username: username.trim(),
        password,
      })
      const { token: newToken, user: userData } = response.data.data || {}
      const authUser = { ...userData, scope: 'branch_user' }
      if (!newToken || !userData) {
        throw new Error('Invalid response structure from server')
      }
      setAuthSession(newToken, JSON.stringify(authUser))
      if (authUser.branchId) setBranchPortalContext(authUser.branchId)
      setToken(newToken)
      setUser(authUser)
      toast.success(response.data?.message || 'Welcome')
      navigate(
        `${branchPortalBase(authUser.restaurantId, authUser.branchPortalKey, authUser.branchSlug)}/dashboard`,
        { replace: true },
      )
      return { success: true }
    } catch (error) {
      const { text: errorMsg, duration } = formatAuthLoginToast(error)
      if (!error.__toastShown) {
        toast.error(errorMsg, { duration })
        error.__toastShown = true
      }
      return { success: false, error: errorMsg, locked: error.response?.status === 423 }
    }
  }

  const loginBranchEmail = async (identifier, restaurantId, password) => {
    try {
      const response = await api.post('/auth/login', {
        identifier: String(identifier || '').trim(),
        password,
        restaurantId: String(restaurantId || '').trim(),
      })
      const { token: newToken, user: userData } = response.data.data || {}
      const authUser = { ...userData, scope: 'branch_user' }
      if (!newToken || !userData) {
        throw new Error('Invalid response structure from server')
      }
      setAuthSession(newToken, JSON.stringify(authUser))
      if (authUser.branchId) setBranchPortalContext(authUser.branchId)
      setToken(newToken)
      setUser(authUser)
      toast.success(response.data?.message || 'Welcome')
      navigate(
        `${branchPortalBase(authUser.restaurantId, authUser.branchPortalKey, authUser.branchSlug)}/dashboard`,
        { replace: true },
      )
      return { success: true }
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || 'Login failed'
      if (!error.__toastShown) {
        toast.error(errorMsg)
      }
      return { success: false, error: errorMsg }
    }
  }

  const mergeUser = useCallback((updates) => {
    setUser((prev) => {
      if (!prev) return prev
      const next = { ...prev, ...updates }
      const t = getAuthToken()
      if (t) setAuthSession(t, JSON.stringify(next))
      return next
    })
  }, [])

  return (
    <AuthContext.Provider value={{ user, token, isLoading, isAuthenticated, login, loginBranch, loginBranchEmail, logout, mergeUser }}>
      {children}
    </AuthContext.Provider>
  )
}
