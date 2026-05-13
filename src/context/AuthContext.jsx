import React, { createContext, useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../services/api'
import { defaultPortalPathForUser, branchPortalBase } from '../utils/tenantPaths'
import {
  readInitialAuthToken,
  getAuthUserRaw,
  getAuthToken,
  setAuthSession,
  clearAuthSession,
} from '../utils/authStorage'
import { clearBranchSelection, setBranchPortalContext } from '../utils/branchStorage'

/** Log out authenticated dashboard users after this much inactivity (visible tab) or hidden tab time */
const SESSION_IDLE_MS = 60 * 60 * 1000 // 1 hour

export const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(readInitialAuthToken)
  const [isLoading, setIsLoading] = useState(true)
  const isAuthenticated = Boolean(token && user)

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
      if (user.role === 'super_admin' || user.role === 'admin') loginRole = 'platform'
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
      } else if (user?.role === 'super_admin' || user?.role === 'admin') {
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
      
      console.log('📤 Login request:', { endpoint, identifier: String(email || '').slice(0, 5) + '***' })
      
      const response = await api.post(endpoint, requestData)
      
      console.log('📥 Login response:', response.data)
      
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

      // Update state
      setToken(newToken)
      setUser(authUser)

      toast.success(response.data?.message || `Welcome ${authUser.name || email}!`)

      if (authUser.role === 'restaurant') {
        if (!authUser.isKYCVerified) {
          toast('Kindly verify your KYC to unlock menu, tables, staff and order actions.', {
            duration: 6500,
          })
        }
        if (authUser.trialEndsAt && !authUser.hasPaidPlanActive) {
          const days = Math.ceil(
            (new Date(authUser.trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          )
          if (days > 0) {
            toast(`Your ${days}-day${days === 1 ? '' : 's'} free trial is active. Subscribe before it ends to keep access.`, {
              duration: 5500,
            })
          } else if (authUser.needsPlanUpgrade) {
            toast.error('Your trial has ended. Upgrade your plan from Subscription to continue.')
          }
        }
      }
      
      // Redirect based on role
      if (authUser.scope === 'employee' && authUser.mustChangePassword) {
        navigate('/employee/change-password')
      } else if (authUser.scope === 'employee') {
        navigate(defaultPortalPathForUser(authUser))
      } else if (authUser.role === 'super_admin' || authUser.role === 'admin') {
        navigate('/platform/dashboard')
      } else if (authUser.role === 'restaurant') {
        navigate(defaultPortalPathForUser(authUser))
      } else {
        navigate('/')
      }
      
      return { success: true }
      
    } catch (error) {
      console.error('❌ Login error:', error)
      const errorMsg = error.response?.data?.message || error.message || 'Login failed'
      if (!error.__toastShown) {
        toast.error(errorMsg)
      }
      return { success: false, error: errorMsg }
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
      const errorMsg = error.response?.data?.message || error.message || 'Login failed'
      if (!error.__toastShown) {
        toast.error(errorMsg)
      }
      return { success: false, error: errorMsg }
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

  const loginWithGoogle = async (credential) => {
    try {
      const response = await api.post('/restaurant/auth/google', { credential })
      const { token: newToken, user: userData, created } = response.data.data
      const authUser = { ...userData, scope: 'restaurant' }

      if (!newToken || !userData) {
        throw new Error('Invalid response structure from server')
      }

      setAuthSession(newToken, JSON.stringify(authUser))
      clearBranchSelection()
      setToken(newToken)
      setUser(authUser)

      toast.success(response.data?.message || 'Google sign-in successful')
      if (created) {
        toast('Complete your vendor profile and KYC after login to unlock all restaurant tools.', {
          duration: 7000,
        })
      }
      navigate(defaultPortalPathForUser(authUser))
      return { success: true }
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || 'Google sign-in failed'
      if (!error.__toastShown) {
        toast.error(errorMsg)
      }
      return { success: false, error: errorMsg }
    }
  }

  const mergeUser = (updates) => {
    setUser((prev) => {
      if (!prev) return prev
      const next = { ...prev, ...updates }
      const t = getAuthToken()
      if (t) setAuthSession(t, JSON.stringify(next))
      return next
    })
  }

  return (
    <AuthContext.Provider value={{ user, token, isLoading, isAuthenticated, login, loginBranch, loginBranchEmail, loginWithGoogle, logout, mergeUser }}>
      {children}
    </AuthContext.Provider>
  )
}
