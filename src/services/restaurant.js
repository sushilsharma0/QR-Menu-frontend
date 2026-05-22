import api from './api'

// Menu Management
export const getCategories = async () => {
  const response = await api.get('/restaurant/menu/categories')
  return response.data
}

export const createCategory = async (data) => {
  const response = await api.post('/restaurant/menu/categories', data)
  return response.data
}

export const updateCategory = async (id, data) => {
  const response = await api.put(`/restaurant/menu/categories/${id}`, data)
  return response.data
}

export const deleteCategory = async (id) => {
  const response = await api.delete(`/restaurant/menu/categories/${id}`)
  return response.data
}

export const getMenuItems = async (params = {}) => {
  const response = await api.get('/restaurant/menu/items', { params })
  return response.data
}

export const getMenuItem = async (id) => {
  const response = await api.get(`/restaurant/menu/items/${id}`)
  return response.data
}

export const createMenuItem = async (data) => {
  const response = await api.post('/restaurant/menu/items', data)
  return response.data
}

export const updateMenuItem = async (id, data) => {
  const response = await api.put(`/restaurant/menu/items/${id}`, data)
  return response.data
}

export const deleteMenuItem = async (id) => {
  const response = await api.delete(`/restaurant/menu/items/${id}`)
  return response.data
}

export const toggleMenuItemAvailability = async (id) => {
  const response = await api.patch(`/restaurant/menu/items/${id}/toggle-availability`)
  return response.data
}

export const getPublicMenu = async (restaurantSlug) => {
  const response = await api.get(`/restaurant/menu/public/${restaurantSlug}`)
  return response.data
}

// Table Management
export const getTables = async () => {
  const response = await api.get('/restaurant/tables')
  return response.data
}

export const getTable = async (id) => {
  const response = await api.get(`/restaurant/tables/${id}`)
  return response.data
}

export const createTable = async (data) => {
  const response = await api.post('/restaurant/tables', data)
  return response.data
}

export const updateTable = async (id, data) => {
  const response = await api.put(`/restaurant/tables/${id}`, data)
  return response.data
}

export const deleteTable = async (id) => {
  const response = await api.delete(`/restaurant/tables/${id}`)
  return response.data
}

export const regenerateTableQR = async (id) => {
  const response = await api.patch(`/restaurant/tables/${id}/regenerate-qr`)
  return response.data
}

export const verifyTableQR = async (token) => {
  const response = await api.get(`/restaurant/tables/qr/${token}`)
  return response.data
}

// Order Management
export const getOrders = async (params = {}) => {
  const response = await api.get('/restaurant/orders', { params })
  return response.data
}

export const getOrder = async (id) => {
  const response = await api.get(`/restaurant/orders/${id}`)
  return response.data
}

export const updateOrderStatus = async (id, status) => {
  const response = await api.patch(`/restaurant/orders/${id}/status`, { status })
  return response.data
}

export const cancelOrder = async (id, reason) => {
  const response = await api.patch(`/restaurant/orders/${id}/cancel`, { reason })
  return response.data
}

export const getOrderStatistics = async () => {
  const response = await api.get('/restaurant/orders/stats')
  return response.data
}

// Customer Order Management
export const placeCustomerOrder = async (data) => {
  const response = await api.post('/restaurant/customer-orders', data)
  return response.data
}

export const getCustomerOrders = async (params = {}) => {
  const response = await api.get('/restaurant/customer-orders', { params })
  return response.data
}

export const getCustomerOrder = async (id) => {
  const response = await api.get(`/restaurant/customer-orders/${id}`)
  return response.data
}

export const updateCustomerOrderStatus = async (id, status, estimatedWaitTime = null) => {
  const response = await api.patch(`/restaurant/customer-orders/${id}/status`, { status, estimatedWaitTime })
  return response.data
}

export const cancelCustomerOrder = async (id, reason) => {
  const response = await api.patch(`/restaurant/customer-orders/${id}/cancel`, { reason })
  return response.data
}

export const getCustomerOrderStatistics = async () => {
  const response = await api.get('/restaurant/customer-orders/stats')
  return response.data
}

export const trackOrder = async (qrToken) => {
  const response = await api.get(`/customer/order/${qrToken}`)
  return response.data
}

// Employee Management
export const getEmployees = async () => {
  const response = await api.get('/restaurant/employees')
  return response.data
}

export const getEmployee = async (id) => {
  const response = await api.get(`/restaurant/employees/${id}`)
  return response.data
}

export const createEmployee = async (data) => {
  const response = await api.post('/restaurant/employees', data)
  return response.data
}

export const updateEmployee = async (id, data) => {
  const response = await api.put(`/restaurant/employees/${id}`, data)
  return response.data
}

export const deleteEmployee = async (id) => {
  const response = await api.delete(`/restaurant/employees/${id}`)
  return response.data
}

export const toggleEmployeeStatus = async (id) => {
  const response = await api.patch(`/restaurant/employees/${id}/toggle-status`)
  return response.data
}

export const resetEmployeePassword = async (id) => {
  const response = await api.patch(`/restaurant/employees/${id}/reset-password`)
  return response.data
}

// Restaurant KYC
export const submitRestaurantKYC = async (data) => {
  const response = await api.post('/restaurant/kyc/submit', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return response.data
}

export const getRestaurantKYCStatus = async () => {
  const response = await api.get('/restaurant/kyc/status')
  return response.data
}

export const updateRestaurantKYC = async (data) => {
  const response = await api.put('/restaurant/kyc/update', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return response.data
}

// Package/Subscription
export const getCurrentPackage = async () => {
  const response = await api.get('/restaurant/package/status')
  return response.data
}

export const getPackageHistory = async (params = {}) => {
  const response = await api.get('/restaurant/package/history', { params })
  return response.data
}

export const requestNewPackage = async (packageId) => {
  const response = await api.post('/restaurant/package/request', { packageId })
  return response.data
}

export const getSubscriptionInvoices = async (params = {}) => {
  const response = await api.get('/restaurant/billing/invoices', { params })
  return response.data
}

export const getSubscriptionInvoice = async (id) => {
  const response = await api.get(`/restaurant/billing/invoices/${id}`)
  return response.data
}

export const getOrderActivityReport = async (params = {}) => {
  const response = await api.get('/restaurant/customer-orders/activity-report', { params })
  return response.data
}

// Cashier
export const processPayment = async (data) => {
  const response = await api.post('/restaurant/cashier/pay', data)
  return response.data
}

export const getTransactions = async (params = {}) => {
  const response = await api.get('/restaurant/cashier/transactions', { params })
  return response.data
}

export const getTransaction = async (id) => {
  const response = await api.get(`/restaurant/cashier/transactions/${id}`)
  return response.data
}

export const refundTransaction = async (id, reason) => {
  const response = await api.post(`/restaurant/cashier/transactions/${id}/refund`, { reason })
  return response.data
}

// Dashboard
export const getDashboardStats = async () => {
  const response = await api.get('/restaurant/dashboard/stats')
  return response.data
}

export const getSalesAnalytics = async (params = {}) => {
  const response = await api.get('/restaurant/dashboard/analytics/sales', { params })
  return response.data
}

export const getPopularItems = async (params = {}) => {
  const response = await api.get('/restaurant/dashboard/analytics/popular-items', { params })
  return response.data
}

export const getOrderStatusStats = async () => {
  const response = await api.get('/restaurant/dashboard/analytics/order-status')
  return response.data
}

// Inventory
export const getInventory = async () => {
  const response = await api.get('/restaurant/inventory')
  return response.data
}

export const addInventoryItem = async (data) => {
  const response = await api.post('/restaurant/inventory', data)
  return response.data
}

export const updateInventoryItem = async (id, data) => {
  const response = await api.patch(`/restaurant/inventory/${id}`, data)
  return response.data
}

export const deleteInventoryItem = async (id) => {
  const response = await api.delete(`/restaurant/inventory/${id}`)
  return response.data
}

// Promotions
export const getPromotions = async () => {
  const response = await api.get('/restaurant/promotions')
  return response.data
}

export const createPromotion = async (data) => {
  const response = await api.post('/restaurant/promotions', data)
  return response.data
}

export const updatePromotion = async (id, data) => {
  const response = await api.put(`/restaurant/promotions/${id}`, data)
  return response.data
}

export const deletePromotion = async (id) => {
  const response = await api.delete(`/restaurant/promotions/${id}`)
  return response.data
}

export default {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getMenuItems,
  getMenuItem,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  toggleMenuItemAvailability,
  getPublicMenu,
  getTables,
  getTable,
  createTable,
  updateTable,
  deleteTable,
  regenerateTableQR,
  verifyTableQR,
  getOrders,
  getOrder,
  updateOrderStatus,
  cancelOrder,
  getOrderStatistics,
  placeCustomerOrder,
  getCustomerOrders,
  getCustomerOrder,
  updateCustomerOrderStatus,
  cancelCustomerOrder,
  getCustomerOrderStatistics,
  trackOrder,
  getEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  toggleEmployeeStatus,
  resetEmployeePassword,
  submitRestaurantKYC,
  getRestaurantKYCStatus,
  updateRestaurantKYC,
  getCurrentPackage,
  getPackageHistory,
  requestNewPackage,
  processPayment,
  getTransactions,
  getTransaction,
  refundTransaction,
  getDashboardStats,
  getSalesAnalytics,
  getPopularItems,
  getOrderStatusStats,
  getInventory,
  addInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  getPromotions,
  createPromotion,
  updatePromotion,
  deletePromotion,
}
