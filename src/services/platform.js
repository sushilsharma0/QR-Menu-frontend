import api from './api'

// Restaurant Management
export const getRestaurants = async (params = {}) => {
  const response = await api.get('/platform/restaurants', { params })
  return response.data
}

export const getRestaurant = async (id) => {
  const response = await api.get(`/platform/restaurants/${id}`)
  return response.data
}

export const createRestaurant = async (data) => {
  const response = await api.post('/platform/restaurants', data)
  return response.data
}

export const updateRestaurant = async (id, data) => {
  const response = await api.put(`/platform/restaurants/${id}`, data)
  return response.data
}

export const deleteRestaurant = async (id) => {
  const response = await api.delete(`/platform/restaurants/${id}`)
  return response.data
}

export const toggleRestaurantStatus = async (id) => {
  const response = await api.patch(`/platform/restaurants/${id}/toggle-status`)
  return response.data
}

export const resetRestaurantPassword = async (id, newPassword) => {
  const response = await api.patch(`/platform/restaurants/${id}/reset-password`, { newPassword })
  return response.data
}

export const getRestaurantStatistics = async () => {
  const response = await api.get('/platform/restaurants/stats')
  return response.data
}

// KYC Management
export const getKYCApplications = async (params = {}) => {
  const response = await api.get('/platform/kyc', { params })
  return response.data
}

export const getKYCApplication = async (id) => {
  const response = await api.get(`/platform/kyc/${id}`)
  return response.data
}

export const getKYCByRestaurant = async (restaurantId) => {
  const response = await api.get(`/platform/kyc/restaurant/${restaurantId}`)
  return response.data
}

export const approveKYCApplication = async (id, notes) => {
  const response = await api.patch(`/platform/kyc/${id}/approve`, { notes })
  return response.data
}

export const rejectKYCApplication = async (id, reason, notes) => {
  const response = await api.patch(`/platform/kyc/${id}/reject`, { reason, notes })
  return response.data
}

export const getKYCStatistics = async () => {
  const response = await api.get('/platform/kyc/stats')
  return response.data
}

// Subscription Management
export const getPlans = async () => {
  const response = await api.get('/platform/subscriptions/plans')
  return response.data
}

export const getPlan = async (id) => {
  const response = await api.get(`/platform/subscriptions/plans/${id}`)
  return response.data
}

export const createPlan = async (data) => {
  const response = await api.post('/platform/subscriptions/plans', data)
  return response.data
}

export const updatePlan = async (id, data) => {
  const response = await api.put(`/platform/subscriptions/plans/${id}`, data)
  return response.data
}

export const deletePlan = async (id) => {
  const response = await api.delete(`/platform/subscriptions/plans/${id}`)
  return response.data
}

export const assignPlan = async (restaurantId, planId, notes) => {
  const response = await api.post('/platform/subscriptions/assign', { restaurantId, planId, notes })
  return response.data
}

export const getPendingRequests = async () => {
  const response = await api.get('/platform/subscriptions/requests/pending')
  return response.data
}

export const approveRequest = async (restaurantId, notes) => {
  const response = await api.post(`/platform/subscriptions/requests/${restaurantId}/approve`, { notes })
  return response.data
}

export const rejectRequest = async (restaurantId, reason) => {
  const response = await api.post(`/platform/subscriptions/requests/${restaurantId}/reject`, { reason })
  return response.data
}

// Admin Management
export const getAdmins = async () => {
  const response = await api.get('/platform/admins')
  return response.data
}

export const getAdmin = async (id) => {
  const response = await api.get(`/platform/admins/${id}`)
  return response.data
}

export const createAdmin = async (data) => {
  const response = await api.post('/platform/admins', data)
  return response.data
}

export const updateAdmin = async (id, data) => {
  const response = await api.put(`/platform/admins/${id}`, data)
  return response.data
}

export const deleteAdmin = async (id) => {
  const response = await api.delete(`/platform/admins/${id}`)
  return response.data
}

export const toggleAdminStatus = async (id) => {
  const response = await api.patch(`/platform/admins/${id}/toggle-status`)
  return response.data
}

// Dashboard
export const getDashboardStats = async () => {
  const response = await api.get('/platform/dashboard/stats')
  return response.data
}

export const getRevenueAnalytics = async (params = {}) => {
  const response = await api.get('/platform/dashboard/analytics/revenue', { params })
  return response.data
}

export const getRestaurantGrowth = async () => {
  const response = await api.get('/platform/dashboard/analytics/restaurants')
  return response.data
}

export const getSubscriptionAnalytics = async () => {
  const response = await api.get('/platform/dashboard/analytics/subscriptions')
  return response.data
}

// CMS
export const getCMSContents = async (params = {}) => {
  const response = await api.get('/platform/cms', { params })
  return response.data
}

export const getCMSContent = async (key) => {
  const response = await api.get(`/platform/cms/${key}`)
  return response.data
}

export const upsertCMSContent = async (data) => {
  const response = await api.post('/platform/cms', data)
  return response.data
}

export const deleteCMSContent = async (key) => {
  const response = await api.delete(`/platform/cms/${key}`)
  return response.data
}

export const toggleCMSContentStatus = async (key) => {
  const response = await api.patch(`/platform/cms/${key}/toggle-status`)
  return response.data
}

export default {
  getRestaurants,
  getRestaurant,
  createRestaurant,
  updateRestaurant,
  deleteRestaurant,
  toggleRestaurantStatus,
  resetRestaurantPassword,
  getRestaurantStatistics,
  getKYCApplications,
  getKYCApplication,
  getKYCByRestaurant,
  approveKYCApplication,
  rejectKYCApplication,
  getKYCStatistics,
  getPlans,
  getPlan,
  createPlan,
  updatePlan,
  deletePlan,
  assignPlan,
  getPendingRequests,
  approveRequest,
  rejectRequest,
  getAdmins,
  getAdmin,
  createAdmin,
  updateAdmin,
  deleteAdmin,
  toggleAdminStatus,
  getDashboardStats,
  getRevenueAnalytics,
  getRestaurantGrowth,
  getSubscriptionAnalytics,
  getCMSContents,
  getCMSContent,
  upsertCMSContent,
  deleteCMSContent,
  toggleCMSContentStatus,
}