import api from './api'

// Platform Auth
export const platformLogin = async (email, password) => {
  const response = await api.post('/platform/auth/login', { email, password })
  if (response.data.data.token) {
    localStorage.setItem('token', response.data.data.token)
    localStorage.setItem('user', JSON.stringify(response.data.data.user))
  }
  return response.data
}

export const platformLogout = async () => {
  await api.post('/platform/auth/logout')
  localStorage.removeItem('token')
  localStorage.removeItem('user')
}

export const getPlatformUser = async () => {
  const response = await api.get('/platform/auth/profile')
  return response.data
}

export const updatePlatformUser = async (data) => {
  const response = await api.put('/platform/auth/profile', data)
  if (response.data.data) {
    localStorage.setItem('user', JSON.stringify(response.data.data))
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
    localStorage.setItem('token', response.data.data.token)
    const payload = response.data.data.user || response.data.data.restaurant
    if (payload) {
      localStorage.setItem('user', JSON.stringify({ ...payload, scope: 'restaurant' }))
    }
  }
  return response.data
}

export const restaurantLogout = async () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
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
    localStorage.setItem('user', JSON.stringify(response.data.data))
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
    localStorage.setItem('token', response.data.data.token)
    localStorage.setItem('user', JSON.stringify(response.data.data.employee))
  }
  return response.data
}

export const employeeChangePassword = async (currentPassword, newPassword) => {
  return api.patch('/restaurant/employees/change-password', { currentPassword, newPassword })
}

export const logout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  window.location.href = '/login'
}

export const isAuthenticated = () => {
  const token = localStorage.getItem('token')
  return !!token
}

export const getCurrentUser = () => {
  const user = localStorage.getItem('user')
  return user ? JSON.parse(user) : null
}

export const getToken = () => {
  return localStorage.getItem('token')
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