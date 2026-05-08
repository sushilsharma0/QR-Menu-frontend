import api from './api'

const GUEST_ID_STORAGE_KEY = 'customer_guest_id_v1'
const CART_COUNT_STORAGE_KEY = 'customer_cart_count_v1'

// Public Menu
export const getRestaurantMenu = async (restaurantSlug) => {
  const response = await api.get(`/restaurant/menu/public/${restaurantSlug}`)
  return response.data
}

// Table QR Verification
export const verifyTableQR = async (token) => {
  const response = await api.get(`/restaurant/tables/qr/${token}`)
  return response.data
}

// Customer Order
export const placeOrder = async (orderData) => {
  const response = await api.post('/restaurant/customer-orders', orderData)
  return response.data
}

export const trackOrder = async (qrToken) => {
  const response = await api.get(`/customer/order/${qrToken}`)
  return response.data
}

export const getOrderStatus = async (orderId) => {
  const response = await api.get(`/restaurant/customer-orders/${orderId}`)
  return response.data
}

export const getStoredGuestId = () => localStorage.getItem(GUEST_ID_STORAGE_KEY) || ''

export const setCartItemCount = (count) => {
  localStorage.setItem(CART_COUNT_STORAGE_KEY, String(Math.max(0, Number(count) || 0)))
}

export const getCartItemCount = () => Number(localStorage.getItem(CART_COUNT_STORAGE_KEY) || 0)

export const ensureGuestSession = async (qrToken) => {
  const existingGuestId = getStoredGuestId()
  const buildPayload = (guestId) => ({
    qrToken,
    guestId: guestId || undefined,
    deviceInfo: {
      userAgent: navigator.userAgent || '',
      platform: navigator.platform || '',
      language: navigator.language || '',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
    },
  })

  let response
  try {
    response = await api.post('/customer/guest/session', buildPayload(existingGuestId))
  } catch (err) {
    // If persisted guest id becomes invalid/stale, retry once with a fresh session.
    if (existingGuestId) {
      localStorage.removeItem(GUEST_ID_STORAGE_KEY)
      response = await api.post('/customer/guest/session', buildPayload(''))
    } else {
      throw err
    }
  }
  const data = response?.data?.data || {}
  if (data.guestId) {
    localStorage.setItem(GUEST_ID_STORAGE_KEY, data.guestId)
  }
  const count = (data?.cart?.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0)
  setCartItemCount(count)
  return data
}

export const addItemToGuestCart = async ({
  guestId,
  qrToken,
  menuItemId,
  quantity = 1,
  notes = '',
  cookingInstructions = '',
  customizations = [],
  addOns = [],
}) => {
  const response = await api.post(`/customer/cart/${guestId}/items`, {
    qrToken,
    menuItemId,
    quantity,
    notes,
    cookingInstructions,
    customizations,
    addOns,
  })
  const cart = response?.data?.data || { items: [] }
  const count = (cart.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0)
  setCartItemCount(count)
  return cart
}

export const getGuestCart = async ({ guestId, qrToken }) => {
  const response = await api.get(`/customer/cart/${guestId}`, { params: { qrToken } })
  const cart = response?.data?.data || { items: [] }
  const count = (cart.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0)
  setCartItemCount(count)
  return cart
}

export const updateGuestCartItem = async ({ guestId, qrToken, menuItemId, quantity, notes, lineId }) => {
  const response = await api.patch(`/customer/cart/${guestId}/items/${menuItemId}`, {
    qrToken,
    quantity,
    notes,
    lineId,
  })
  const cart = response?.data?.data || { items: [] }
  const count = (cart.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0)
  setCartItemCount(count)
  return cart
}

export const removeGuestCartItem = async ({ guestId, qrToken, menuItemId, lineId }) => {
  const params = { qrToken }
  if (lineId) params.lineId = lineId
  const response = await api.delete(`/customer/cart/${guestId}/items/${menuItemId}`, { params })
  const cart = response?.data?.data || { items: [] }
  const count = (cart.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0)
  setCartItemCount(count)
  return cart
}

export const clearGuestCart = async ({ guestId, qrToken }) => {
  await api.delete(`/customer/cart/${guestId}`, { params: { qrToken } })
  setCartItemCount(0)
}

export const getGuestOrders = async ({ guestId, qrToken }) => {
  const response = await api.get(`/customer/orders/${guestId}`, { params: { qrToken } })
  return response?.data?.data?.orders || []
}

export const postGuestTableRequest = async ({ qrToken, guestId, requestType, message = '' }) => {
  const response = await api.post('/customer/table-request', {
    qrToken,
    guestId,
    requestType,
    message,
  })
  return response?.data
}

export const getDiningInsights = async ({ restaurantSlug, guestId, qrToken }) => {
  const response = await api.get(`/customer/dining-insights/${restaurantSlug}`, {
    params: { guestId, qrToken },
  })
  return response?.data?.data || null
}

export const getGuestLoyalty = async ({ guestId, qrToken }) => {
  const response = await api.get(`/customer/loyalty/${guestId}`, { params: { qrToken } })
  return response?.data?.data || { points: 0, lifetimePoints: 0 }
}

// Helper functions for customer flow
export const getRestaurantInfo = async (restaurantSlug) => {
  const menu = await getRestaurantMenu(restaurantSlug)
  return {
    id: menu.data.restaurant?.id,
    name: menu.data.restaurant?.name,
    logo: menu.data.restaurant?.logo,
    backgroundPhoto: menu.data.restaurant?.backgroundPhoto,
    description: menu.data.restaurant?.description,
    currency: menu.data.restaurant?.currency || 'Rs.',
    openingTime: menu.data.restaurant?.openingTime,
    closingTime: menu.data.restaurant?.closingTime,
  }
}

export const getCategories = async (restaurantSlug) => {
  const menu = await getRestaurantMenu(restaurantSlug)
  return menu.data.menu || []
}

export const getAllItems = async (restaurantSlug) => {
  const menu = await getRestaurantMenu(restaurantSlug)
  const allItems = []
  menu.data.menu?.forEach(category => {
    category.items?.forEach(item => {
      allItems.push({
        ...item,
        categoryName: category.name,
        categoryId: category._id,
      })
    })
  })
  return allItems
}

export const getItemsByCategory = async (restaurantSlug, categoryId) => {
  const menu = await getRestaurantMenu(restaurantSlug)
  const category = menu.data.menu?.find(cat => cat._id === categoryId)
  return category?.items || []
}

export default {
  getRestaurantMenu,
  verifyTableQR,
  placeOrder,
  trackOrder,
  getOrderStatus,
  getStoredGuestId,
  ensureGuestSession,
  addItemToGuestCart,
  getGuestCart,
  updateGuestCartItem,
  removeGuestCartItem,
  clearGuestCart,
  getGuestOrders,
  getCartItemCount,
  setCartItemCount,
  getRestaurantInfo,
  getCategories,
  getAllItems,
  getItemsByCategory,
}