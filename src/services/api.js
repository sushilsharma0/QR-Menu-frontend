import axios from 'axios'
import toast from '@utils/toast'
import {
  getAuthToken,
  setAuthSession,
  clearAuthSession,
  getAuthUserRaw,
  getOrCreateDeviceId,
  getDeviceFingerprint,
  getDeviceMetadata,
  getCachedGeoLocation,
  getRefreshToken,
  getSessionId,
  setRestaurantSessionSecrets,
} from '../utils/authStorage'
import { getApiBaseUrl } from '../utils/runtimeConfig'
import { getSelectedBranchId } from '../utils/branchStorage'

const API_URL = getApiBaseUrl()
const FEATURE_LABELS = {
  menu: 'Menu & categories',
  orders: 'Order management',
  customerOrders: 'QR / customer orders',
  tables: 'Tables & QR codes',
  employees: 'Employees',
  promotions: 'Promotions',
  branches: 'Branch management',
  cashier: 'Cashier & payments',
  analytics: 'Dashboard analytics',
  billing: 'Subscription billing',
  activityLogs: 'Activity logs',
  supportTickets: 'Support tickets',
  accountSettings: 'Account settings',
}

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = getAuthToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    const branchId = !config.skipBranchHeader && getSelectedBranchId()
    if (branchId) {
      config.headers['X-Branch-Id'] = branchId
    }
    config.headers['X-Device-Id'] = getOrCreateDeviceId()
    config.headers['X-Device-Fingerprint'] = getDeviceFingerprint()
    const deviceMetadata = getDeviceMetadata()
    config.headers['X-Device-Timezone'] = deviceMetadata.timezone
    config.headers['X-Device-Screen'] = deviceMetadata.screen
    const cachedLocation = getCachedGeoLocation()
    if (cachedLocation?.latitude && cachedLocation?.longitude) {
      config.headers['X-Geo-Latitude'] = String(cachedLocation.latitude)
      config.headers['X-Geo-Longitude'] = String(cachedLocation.longitude)
    }
    // Don't set Content-Type for FormData - let browser set it with boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type']
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status
    const message = error.response?.data?.message || error.message || 'Request failed'
    const errorCode = error.response?.data?.errors?.code
    const requestUrl = error.config?.url || ''
    const isLoginRequest =
      requestUrl.includes('/platform/auth/login') ||
      requestUrl.includes('/restaurant/auth/login') ||
      requestUrl.includes('/restaurant/employees/login') ||
      requestUrl.includes('/restaurant/branch-auth/login')
    const shouldSkipToast = Boolean(error.config?.skipErrorToast)

    const canRefreshRestaurantSession =
      status === 401 &&
      !error.config?._retry &&
      !requestUrl.includes('/restaurant/auth/refresh') &&
      getRefreshToken() &&
      getSessionId()

    if (canRefreshRestaurantSession) {
      try {
        error.config._retry = true
        const refreshResponse = await api.post('/restaurant/auth/refresh', {
          refreshToken: getRefreshToken(),
          sessionId: getSessionId(),
        }, { skipErrorToast: true })
        const data = refreshResponse.data?.data || {}
        const currentUserRaw = getAuthUserRaw()
        const currentUser = currentUserRaw ? JSON.parse(currentUserRaw) : null
        const nextUser = data.user ? { ...data.user, scope: 'restaurant' } : currentUser
        setAuthSession(data.token, nextUser ? JSON.stringify(nextUser) : currentUserRaw)
        setRestaurantSessionSecrets({
          refreshToken: data.refreshToken,
          sessionId: data.session?.id || getSessionId(),
        })
        error.config.headers.Authorization = `Bearer ${data.token}`
        return api(error.config)
      } catch {
        // Fall through to normal logout handling.
      }
    }

    if (status === 401 && !isLoginRequest) {
      // Caller can opt out of the global redirect/toast UX (e.g. callback
      // pages that render their own error state).
      if (shouldSkipToast) {
        return Promise.reject(error)
      }

      clearAuthSession()
      toast.error('Session expired. Please login again.')
      error.__toastShown = true

      if (window.location.pathname !== '/login') {
        const path = window.location.pathname || ''
        let qs = ''
        if (
          path.startsWith('/kitchen') ||
          path.startsWith('/cashier') ||
          path.startsWith('/employee')
        ) {
          qs = '?role=employee'
        } else if (path.startsWith('/branch')) {
          window.location.href = '/branch/login'
          return Promise.reject(error)
        } else if (path.startsWith('/restaurant')) {
          qs = '?role=restaurant'
        } else if (path.startsWith('/platform')) {
          qs = '?role=platform'
        }
        window.location.href = `/login${qs}`
      }
      return Promise.reject(error)
    }

    if (
      status === 403 &&
      errorCode === 'MUST_CHANGE_PASSWORD' &&
      !window.location.pathname.startsWith('/employee/change-password')
    ) {
      window.location.href = '/employee/change-password'
      return Promise.reject(error)
    }
    if (status === 403 && errorCode === 'TRIAL_OR_PLAN_EXPIRED') {
      // Routing UX is handled in RestaurantLayout (correct /restaurant/:slug/:id/... paths).
      // Avoid redirecting to invalid /restaurant/subscription and avoid toast spam on data fetches.
      return Promise.reject(error)
    }
    if (status === 403 && errorCode === 'KYC_REQUIRED') {
      if (!shouldSkipToast) {
        toast.error(message || 'Complete KYC verification to use this action.')
        error.__toastShown = true
      }
      return Promise.reject(error)
    }
    if (status === 403 && errorCode === 'PLAN_FEATURE_DISABLED') {
      if (!shouldSkipToast) {
        const featureKey = error.response?.data?.errors?.feature
        const featureLabel = FEATURE_LABELS[featureKey] || 'This feature'
        toast.error(`${featureLabel} is not included in your subscription. Contact super admin.`)
        error.__toastShown = true
      }
      return Promise.reject(error)
    }

    return Promise.reject(error)
  }
)

// ==================== AUTH APIs ====================

// Platform Auth
export const platformLogin = (email, password) => 
  api.post('/platform/auth/login', { email, password })

export const platformLogout = () => 
  api.post('/platform/auth/logout')

export const getPlatformProfile = () => 
  api.get('/platform/auth/profile')

export const updatePlatformProfile = (data) => 
  api.put('/platform/auth/profile', data)

export const changePlatformPassword = (data) => 
  api.post('/platform/auth/change-password', data)

// Restaurant Auth
export const restaurantRegister = (data) => 
  api.post('/restaurant/auth/register', data)

export const restaurantLogin = (email, password) => 
  api.post('/restaurant/auth/login', { email, password })

export const restaurantForgotPassword = (email) => 
  api.post('/restaurant/auth/forgot-password', { email })

export const restaurantResetPassword = (data) => 
  api.post('/restaurant/auth/reset-password', data)

export const updateRestaurantProfile = (data) => 
  api.put('/restaurant/auth/profile', data)

export const changeRestaurantPassword = (data) => 
  api.post('/restaurant/auth/change-password', data)

export const verifyRestaurantPassword = (password) =>
  api.post('/restaurant/auth/verify-password', { password })

export const getRestaurantSessions = () =>
  api.get('/restaurant/auth/sessions')

export const getRestaurantLoginHistory = () =>
  api.get('/restaurant/auth/login-history')

export const revokeRestaurantSession = (sessionId) =>
  api.delete(`/restaurant/auth/sessions/${sessionId}`)

export const revokeOtherRestaurantSessions = () =>
  api.post('/restaurant/auth/sessions/revoke-others')

export const updateCurrentRestaurantSessionLocation = (location) =>
  api.patch('/restaurant/auth/sessions/current/location', location)

// Employee Auth
export const employeeLogin = (username, password, restaurantId) => 
  api.post('/restaurant/employees/login', { username, password, restaurantId })

export const employeeChangePassword = (data) => 
  api.patch('/restaurant/employees/change-password', data)

// ==================== PLATFORM APIs ====================

// Restaurant Management
export const getAllRestaurants = (params) => 
  api.get('/platform/restaurants', { params })

export const getRestaurantById = (id) => 
  api.get(`/platform/restaurants/${id}`)

export const createRestaurant = (data) => 
  api.post('/platform/restaurants', data)

export const updateRestaurant = (id, data) => 
  api.put(`/platform/restaurants/${id}`, data)

export const deleteRestaurant = (id) => 
  api.delete(`/platform/restaurants/${id}`)

export const toggleRestaurantStatus = (id) => 
  api.patch(`/platform/restaurants/${id}/toggle-status`)

export const resetRestaurantPassword = (id, newPassword) => 
  api.patch(`/platform/restaurants/${id}/reset-password`, { newPassword })

export const getRestaurantStats = () => 
  api.get('/platform/restaurants/stats')

// KYC Management
export const getAllKYC = (params) => 
  api.get('/platform/kyc', { params })

export const getKYCById = (id) => 
  api.get(`/platform/kyc/${id}`)

export const getKYCByRestaurant = (restaurantId) => 
  api.get(`/platform/kyc/restaurant/${restaurantId}`)

export const approveKYC = (id, notes) => 
  api.patch(`/platform/kyc/${id}/approve`, { notes })

export const rejectKYC = (id, reason, notes) => 
  api.patch(`/platform/kyc/${id}/reject`, { reason, notes })

export const getKYCStats = () => 
  api.get('/platform/kyc/stats')

// Subscription Management
export const getAllPlans = () => 
  api.get('/platform/subscriptions/plans')

export const getPlanById = (id) => 
  api.get(`/platform/subscriptions/plans/${id}`)

export const createPlan = (data) => 
  api.post('/platform/subscriptions/plans', data)

export const updatePlan = (id, data) => 
  api.put(`/platform/subscriptions/plans/${id}`, data)

export const deletePlan = (id) => 
  api.delete(`/platform/subscriptions/plans/${id}`)

export const assignPlanToRestaurant = (restaurantId, planId, notes) => 
  api.post('/platform/subscriptions/assign', { restaurantId, planId, notes })

export const getPendingPlanRequests = () => 
  api.get('/platform/subscriptions/requests/pending')

export const approvePlanRequest = (restaurantId, notes) => 
  api.post(`/platform/subscriptions/requests/${restaurantId}/approve`, { notes })

export const rejectPlanRequest = (restaurantId, reason) => 
  api.post(`/platform/subscriptions/requests/${restaurantId}/reject`, { reason })

// Admin Management
export const getAllAdmins = () => 
  api.get('/platform/admins')

export const getAdminById = (id) => 
  api.get(`/platform/admins/${id}`)

export const createAdmin = (data) => 
  api.post('/platform/admins', data)

export const updateAdmin = (id, data) => 
  api.put(`/platform/admins/${id}`, data)

export const deleteAdmin = (id) => 
  api.delete(`/platform/admins/${id}`)

export const toggleAdminStatus = (id) => 
  api.patch(`/platform/admins/${id}/toggle-status`)

// Dashboard APIs
export const getPlatformDashboardStats = () => 
  api.get('/platform/dashboard/stats')

export const getRevenueAnalytics = (params) => 
  api.get('/platform/dashboard/analytics/revenue', { params })

export const getRestaurantGrowth = () => 
  api.get('/platform/dashboard/analytics/restaurants')

export const getSubscriptionAnalytics = () => 
  api.get('/platform/dashboard/analytics/subscriptions')

// CMS APIs
export const getAllCMS = () => 
  api.get('/platform/cms')

export const getCMSByKey = (key) => 
  api.get(`/platform/cms/${key}`)

export const upsertCMS = (data) => 
  api.post('/platform/cms', data)

export const deleteCMS = (key) => 
  api.delete(`/platform/cms/${key}`)

export const toggleCMSStatus = (key) => 
  api.patch(`/platform/cms/${key}/toggle-status`)

// ==================== RESTAURANT APIs ====================

// Menu Management
export const getCategories = () => 
  api.get('/restaurant/menu/categories')

export const createCategory = (data) => 
  api.post('/restaurant/menu/categories', data)

export const updateCategory = (id, data) => 
  api.put(`/restaurant/menu/categories/${id}`, data)

export const deleteCategory = (id) => 
  api.delete(`/restaurant/menu/categories/${id}`)

export const getMenuItems = (params) => 
  api.get('/restaurant/menu/items', { params })

export const getMenuItemById = (id) => 
  api.get(`/restaurant/menu/items/${id}`)

export const getMenuItemByCategoryName = (categoryName) => 
  api.get(`/restaurant/menu/items//${categoryName}`)

export const createMenuItem = (data) => 
  api.post('/restaurant/menu/items', data)

export const updateMenuItem = (id, data) => 
  api.put(`/restaurant/menu/items/${id}`, data)

export const deleteMenuItem = (id) => 
  api.delete(`/restaurant/menu/items/${id}`)

export const toggleMenuItemAvailability = (id) => 
  api.patch(`/restaurant/menu/items/${id}/toggle-availability`)

export const getPublicMenu = (restaurantSlug) => 
  api.get(`/restaurant/menu/public/${restaurantSlug}`)

// Table Management
export const getTables = () => {
  api.get('/restaurant/tables')
}

export const getTableById = (id) => 
  api.get(`/restaurant/tables/${id}`)

export const createTable = (data) => 
  api.post('/restaurant/tables', data)

export const updateTable = (id, data) => 
  api.put(`/restaurant/tables/${id}`, data)

export const deleteTable = (id) => 
  api.delete(`/restaurant/tables/${id}`)

export const regenerateQR = (id) => 
  api.patch(`/restaurant/tables/${id}/regenerate-qr`)

export const getTableByQRToken = (token) => 
  api.get(`/restaurant/tables/qr/${token}`)

// Order Management
export const getRestaurantOrders = (params) => 
  api.get('/restaurant/orders', { params })

export const getOrderById = (id) => 
  api.get(`/restaurant/orders/${id}`)

export const updateOrderStatus = (id, status) => 
  api.patch(`/restaurant/orders/${id}/status`, { status })

export const cancelOrder = (id, reason) => 
  api.patch(`/restaurant/orders/${id}/cancel`, { reason })

export const getOrderStats = () => 
  api.get('/restaurant/orders/stats')

// Customer Order Management
export const createCustomerOrder = (data) => 
  api.post('/restaurant/customer-orders', data)

export const getCustomerOrders = (params) => 
  api.get('/restaurant/customer-orders', { params })

export const getCustomerOrderById = (id) => 
  api.get(`/restaurant/customer-orders/${id}`)

export const updateCustomerOrderStatus = (id, status, estimatedWaitTime) => 
  api.patch(`/restaurant/customer-orders/${id}/status`, { status, estimatedWaitTime })

export const cancelCustomerOrder = (id, reason) => 
  api.patch(`/restaurant/customer-orders/${id}/cancel`, { reason })

export const getCustomerOrderStats = () => 
  api.get('/restaurant/customer-orders/stats')

export const trackOrderByQR = (qrToken) => 
  api.get(`/customer/order/${qrToken}`)

// Employee Management
export const getEmployees = () => 
  api.get('/restaurant/employees')

export const getEmployeeById = (id) => 
  api.get(`/restaurant/employees/${id}`)

export const createEmployee = (data) => 
  api.post('/restaurant/employees', data)

export const updateEmployee = (id, data) => 
  api.put(`/restaurant/employees/${id}`, data)

export const deleteEmployee = (id) => 
  api.delete(`/restaurant/employees/${id}`)

export const toggleEmployeeStatus = (id) => 
  api.patch(`/restaurant/employees/${id}/toggle-status`)

export const resetEmployeePassword = (id) => 
  api.patch(`/restaurant/employees/${id}/reset-password`)

// Restaurant KYC
export const submitKYC = (data) => 
  api.post('/restaurant/kyc/submit', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })

export const getKYCStatus = () => 
  api.get('/restaurant/kyc/status')

export const updateKYC = (data) => 
  api.put('/restaurant/kyc/update', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })

// Package/Subscription
export const getPackageStatus = () => 
  api.get('/restaurant/package/status')

export const getPackageHistory = (params) => 
  api.get('/restaurant/package/history', { params })

export const requestPackage = (packageId) => 
  api.post('/restaurant/package/request', { packageId })

export const toggleAutoRenew = (autoRenew) => 
  api.patch('/restaurant/package/auto-renew', { autoRenew })

export const initiateEsewaSubscriptionPayment = (planId) =>
  api.post('/restaurant/subscription/pay/esewa', { planId })

export const initiateKhaltiSubscriptionPayment = (planId) =>
  api.post('/restaurant/subscription/pay/khalti', { planId })

export const initiateManualSubscriptionPayment = (formData) =>
  api.post('/restaurant/subscription/pay/manual', formData)

export const getSubscriptionPayments = (params) =>
  api.get('/restaurant/subscription/payments', { params })

// Cashier
export const processPayment = (data) => 
  api.post('/restaurant/cashier/pay', data)

export const getTransactions = (params) => 
  api.get('/restaurant/cashier/transactions', { params })

export const getTransactionById = (id) => 
  api.get(`/restaurant/cashier/transactions/${id}`)

export const refundTransaction = (id, reason) => 
  api.post(`/restaurant/cashier/transactions/${id}/refund`, { reason })

// Notifications
export const getNotifications = (params) =>
  api.get('/notifications', { params })

export const getUnreadNotificationCount = () =>
  api.get('/notifications/unread-count')

export const markNotificationRead = (id) =>
  api.patch(`/notifications/${id}/read`)

export const markAllNotificationsRead = () =>
  api.patch('/notifications/read-all')

// Restaurant Dashboard
export const getRestaurantDashboardStats = () => 
  api.get('/restaurant/dashboard/stats')

export const getSalesAnalytics = (params) => 
  api.get('/restaurant/dashboard/analytics/sales', { params })

export const getPopularItems = (params) => 
  api.get('/restaurant/dashboard/analytics/popular-items', { params })

export const getOrderStatusStats = () => 
  api.get('/restaurant/dashboard/analytics/order-status')

// Inventory
export const getInventory = () => 
  api.get('/restaurant/inventory')

export const addInventoryItem = (data) => 
  api.post('/restaurant/inventory', data)

export const updateInventoryItem = (id, data) => 
  api.patch(`/restaurant/inventory/${id}`, data)

export const deleteInventoryItem = (id) => 
  api.delete(`/restaurant/inventory/${id}`)

// Recipes (menu BOM ↔ inventory)
export const searchRecipeInventory = (params) =>
  api.get('/restaurant/recipes/inventory-search', { params })

export const createRecipe = (data) => api.post('/restaurant/recipes', data)

export const updateRecipe = (menuItemId, data) =>
  api.put(`/restaurant/recipes/menu-item/${menuItemId}`, data)

export const getRecipeByMenuItem = (menuItemId) =>
  api.get(`/restaurant/recipes/menu-item/${menuItemId}`)

export const deleteRecipe = (menuItemId) =>
  api.delete(`/restaurant/recipes/menu-item/${menuItemId}`)

export default api
