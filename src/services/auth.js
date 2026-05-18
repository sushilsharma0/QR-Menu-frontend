import api from './api'
import {
  setAuthSession,
  setRestaurantSessionSecrets,
  clearAuthSession,
  getAuthToken,
  getAuthUserRaw,
  requestBrowserLocation,
} from '../utils/authStorage'

const captureRestaurantSessionLocation = async () => {
  try {
    const location = await requestBrowserLocation()
    await api.patch('/restaurant/auth/sessions/current/location', location, {
      skipErrorToast: true,
    })
  } catch {
    // Location access is optional; ignore denied or unavailable permissions.
  }
}

// Platform Auth
export const platformLogin = async (email, password) => {
  const response = await api.post('/platform/auth/login', { email, password })
  if (response.data.data.token) {
    setAuthSession(
      response.data.data.token,
      JSON.stringify(response.data.data.user),
    )
  }
  return response.data
}

export const platformLogout = async () => {
  await api.post('/platform/auth/logout')
  clearAuthSession()
}

export const getPlatformUser = async () => {
  const response = await api.get('/platform/auth/profile')
  return response.data
}

export const updatePlatformUser = async (data) => {
  const response = await api.put('/platform/auth/profile', data)
  if (response.data.data) {
    const t = getAuthToken()
    if (t) setAuthSession(t, JSON.stringify(response.data.data))
  }
  return response.data
}

export const changePlatformPassword = async (currentPassword, newPassword) => {
  return api.post('/platform/auth/change-password', { currentPassword, newPassword })
}

// Restaurant Auth
export const restaurantRegister = async (userData) => {
  const response = await api.post('/restaurant/auth/register', userData)
  return response.data
}

export const restaurantLogin = async (email, password) => {
  const response = await api.post('/restaurant/auth/login', { email, password })
  if (response.data.data.token) {
    const payload = response.data.data.user || response.data.data.restaurant
    setAuthSession(
      response.data.data.token,
      payload ? JSON.stringify({ ...payload, scope: 'restaurant' }) : null,
    )
    setRestaurantSessionSecrets({
      refreshToken: response.data.data.refreshToken,
      sessionId: response.data.data.session?.id,
    })
    captureRestaurantSessionLocation()
  }
  return response.data
}

export const restaurantLogout = async () => {
  clearAuthSession()
}

export const getRestaurantUser = async () => {
  const response = await api.get('/restaurant/auth/profile')
  return response.data
}

export const updateRestaurantProfile = async (data) => {
  const formData = new FormData()
  Object.keys(data).forEach(key => {
    if (data[key] !== undefined) formData.append(key, data[key])
  })
  const response = await api.put('/restaurant/auth/profile', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  if (response.data.data) {
    const t = getAuthToken()
    if (t) setAuthSession(t, JSON.stringify(response.data.data))
  }
  return response.data
}

export const restaurantForgotPassword = async (email) => {
  return api.post('/restaurant/auth/forgot-password', { email })
}

export const restaurantResetPassword = async (email, otp, newPassword) => {
  return api.post('/restaurant/auth/reset-password', { email, otp, newPassword })
}

export const changeRestaurantPassword = async (currentPassword, newPassword) => {
  return api.post('/restaurant/auth/change-password', { currentPassword, newPassword })
}

// Employee Auth
export const employeeLogin = async (username, password, restaurantId) => {
  const response = await api.post('/restaurant/employees/login', { username, password, restaurantId })
  if (response.data.data.token) {
    setAuthSession(
      response.data.data.token,
      JSON.stringify(response.data.data.employee),
    )
  }
  return response.data
}

export const employeeChangePassword = async (currentPassword, newPassword) => {
  return api.patch('/restaurant/employees/change-password', { currentPassword, newPassword })
}

export const logout = () => {
  clearAuthSession()
  window.location.href = '/login'
}

export const isAuthenticated = () => {
  return !!getAuthToken()
}

export const getCurrentUser = () => {
  const user = getAuthUserRaw()
  return user ? JSON.parse(user) : null
}

export const getToken = () => {
  return getAuthToken()
}

export default {
  platformLogin,
  platformLogout,
  getPlatformUser,
  updatePlatformUser,
  changePlatformPassword,
  restaurantRegister,
  restaurantLogin,
  restaurantLogout,
  getRestaurantUser,
  updateRestaurantProfile,
  restaurantForgotPassword,
  restaurantResetPassword,
  changeRestaurantPassword,
  employeeLogin,
  employeeChangePassword,
  logout,
  isAuthenticated,
  getCurrentUser,
  getToken,
}
