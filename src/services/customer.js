import api from './api'

const GUEST_ID_STORAGE_KEY = 'customer_guest_id_v1'
const CUSTOMER_ID_STORAGE_KEY = 'customer_identity_id_v1'
const CUSTOMER_PROFILE_STORAGE_KEY = 'customer_identity_profile_v1'
const CART_COUNT_STORAGE_KEY = 'customer_cart_count_v1'
const ORDER_TOKENS_STORAGE_KEY = 'customer_order_tokens_v1'

// Public Menu
export const getRestaurantMenu = async (restaurantSlug, qrToken = null) => {
  const response = await api.get(`/restaurant/menu/public/${restaurantSlug}`, {
    params: qrToken ? { qrToken } : {},
  })
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
export const getStoredCustomerId = () => localStorage.getItem(CUSTOMER_ID_STORAGE_KEY) || ''
export const getStoredCustomerProfile = () => {
  try {
    return JSON.parse(localStorage.getItem(CUSTOMER_PROFILE_STORAGE_KEY) || '{}')
  } catch {
    return {}
  }
}

export const setCartItemCount = (count) => {
  localStorage.setItem(CART_COUNT_STORAGE_KEY, String(Math.max(0, Number(count) || 0)))
}

export const getCartItemCount = () => Number(localStorage.getItem(CART_COUNT_STORAGE_KEY) || 0)

const readStoredOrderTokenMap = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(ORDER_TOKENS_STORAGE_KEY) || '{}')
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
  } catch {
    return {}
  }
}

export const getStoredOrderTokens = (tableQrToken) => {
  if (!tableQrToken) return []
  const tokenMap = readStoredOrderTokenMap()
  return Array.isArray(tokenMap[tableQrToken]) ? tokenMap[tableQrToken].filter(Boolean) : []
}

export const rememberCustomerOrderToken = (tableQrToken, orderQrToken) => {
  if (!tableQrToken || !orderQrToken) return
  const tokenMap = readStoredOrderTokenMap()
  const nextTokens = [
    String(orderQrToken),
    ...getStoredOrderTokens(tableQrToken).filter((token) => token !== String(orderQrToken)),
  ].slice(0, 50)
  tokenMap[tableQrToken] = nextTokens
  localStorage.setItem(ORDER_TOKENS_STORAGE_KEY, JSON.stringify(tokenMap))
}

// Concurrent / repeat callers (Cart page mount, context hydrate, ItemDetails
// hydrate firing in the same paint) used to spam POST /customer/guest/session
// — which trips the server rate limiter. Two layers of protection:
//   1. an in-flight Map keyed by qrToken so duplicate calls share one Promise.
//   2. a small TTL cache (default 30s) so back-to-back screen mounts skip the
//      network entirely.
const _sessionInFlight = new Map()
const _sessionCache = new Map() // qrToken -> { at, data }
const SESSION_CACHE_TTL_MS = 30_000

export const ensureGuestSession = async (qrToken, { force = false } = {}) => {
  const key = String(qrToken || '')

  if (!force) {
    const cached = _sessionCache.get(key)
    if (cached && Date.now() - cached.at < SESSION_CACHE_TTL_MS) {
      return cached.data
    }
    const inflight = _sessionInFlight.get(key)
    if (inflight) return inflight
  }

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

  const run = (async () => {
    let response
    try {
      response = await api.post('/customer/guest/session', buildPayload(existingGuestId), { skipErrorToast: true })
    } catch (err) {
      // If persisted guest id becomes invalid/stale, retry once with a fresh session.
      if (existingGuestId) {
        localStorage.removeItem(GUEST_ID_STORAGE_KEY)
        try {
          response = await api.post('/customer/guest/session', buildPayload(''), { skipErrorToast: true })
        } catch (innerErr) {
          throw innerErr
        }
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
    _sessionCache.set(key, { at: Date.now(), data })
    return data
  })()

  _sessionInFlight.set(key, run)
  try {
    return await run
  } finally {
    _sessionInFlight.delete(key)
  }
}

export const invalidateGuestSession = (qrToken) => {
  if (qrToken) {
    _sessionCache.delete(String(qrToken))
    _sessionInFlight.delete(String(qrToken))
  } else {
    _sessionCache.clear()
    _sessionInFlight.clear()
  }
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

export const requestCustomerIdentityOtp = async ({ qrToken, guestId, email }) => {
  const response = await api.post('/customer/identity/request-otp', {
    qrToken,
    guestId,
    email,
    purpose: 'signup',
  })
  return response?.data?.data || {}
}

export const claimCustomerIdentity = async ({ qrToken, guestId, name, phone = '', email = '', otp = '', password = '', purpose = 'signup' }) => {
  const response = await api.post('/customer/identity/claim', {
    qrToken,
    guestId,
    name,
    phone,
    email,
    otp,
    password,
    purpose,
  })
  const data = response?.data?.data || {}
  if (data.guestId) localStorage.setItem(GUEST_ID_STORAGE_KEY, data.guestId)
  if (data.customerId) localStorage.setItem(CUSTOMER_ID_STORAGE_KEY, data.customerId)
  if (data.customer) localStorage.setItem(CUSTOMER_PROFILE_STORAGE_KEY, JSON.stringify(data.customer))
  return data
}

export const getCustomerIdentity = async ({ qrToken, guestId, customerId = getStoredCustomerId() }) => {
  if (!qrToken || !guestId) return null
  const response = await api.get('/customer/identity/me', {
    params: { qrToken, guestId, customerId },
    skipErrorToast: true,
  })
  const data = response?.data?.data || null
  if (data?.customerId) localStorage.setItem(CUSTOMER_ID_STORAGE_KEY, data.customerId)
  if (data?.customer) localStorage.setItem(CUSTOMER_PROFILE_STORAGE_KEY, JSON.stringify(data.customer))
  return data
}

export const updateCustomerIdentityProfile = async ({ qrToken, guestId, customerId = getStoredCustomerId(), name, phone = '', email = '' }) => {
  const response = await api.patch('/customer/identity/profile', {
    qrToken,
    guestId,
    customerId,
    name,
    phone,
    email,
  })
  const data = response?.data?.data || {}
  if (data.customer) localStorage.setItem(CUSTOMER_PROFILE_STORAGE_KEY, JSON.stringify(data.customer))
  return data
}

export const changeCustomerIdentityPassword = async ({ qrToken, guestId, customerId = getStoredCustomerId(), currentPassword, newPassword }) => {
  const response = await api.post('/customer/identity/change-password', {
    qrToken,
    guestId,
    customerId,
    currentPassword,
    newPassword,
  })
  return response?.data?.data || {}
}

export const requestCustomerPasswordReset = async ({ qrToken, guestId, email }) => {
  const response = await api.post('/customer/identity/forgot-password', { qrToken, guestId, email })
  return response?.data?.data || {}
}

export const resetCustomerPassword = async ({ qrToken, guestId, email, otp, newPassword }) => {
  const response = await api.post('/customer/identity/reset-password', {
    qrToken,
    guestId,
    email,
    otp,
    newPassword,
  })
  return response?.data?.data || {}
}

export const verifyCustomerPasswordResetOtp = async ({ qrToken, guestId, email, otp }) => {
  const response = await api.post('/customer/identity/verify-reset-otp', {
    qrToken,
    guestId,
    email,
    otp,
  })
  return response?.data?.data || {}
}

export const getStoredCustomerOrders = async ({ qrToken }) => {
  const tokens = getStoredOrderTokens(qrToken)
  if (!tokens.length) return []

  const settled = await Promise.allSettled(
    tokens.map((orderQrToken) =>
      api.get(`/customer/order/${orderQrToken}`, { skipErrorToast: true }).then((response) => {
        const order = response?.data?.data || null
        if (!order || order.tableQrToken !== qrToken) return null
        return {
          _id: order.orderId,
          qrToken: order.qrToken || orderQrToken,
          orderNumber: order.orderNumber,
          status: order.status,
          paymentStatus: order.paymentStatus,
          paymentMethod: order.paymentMethod,
          customerName: order.customerName,
          table: { tableNumber: order.tableNumber },
          items: order.items || [],
          totalAmount: order.subtotal,
          taxAmount: order.taxAmount,
          discountAmount: order.discountAmount,
          serviceChargeAmount: order.serviceChargeAmount,
          grandTotal: order.grandTotal ?? order.totalAmount,
          createdAt: order.orderTime,
        }
      }),
    ),
  )

  return settled
    .filter((entry) => entry.status === 'fulfilled' && entry.value)
    .map((entry) => entry.value)
}

export const applyRestaurantCreditAccount = async ({ qrToken, guestId, name, email, phone = '' }) => {
  const response = await api.post('/customer/credit/apply', {
    qrToken,
    guestId,
    name,
    email,
    phone,
  })
  return response.data
}

export const requestCreditCheckoutOtp = async ({ qrToken, guestId, email }) => {
  const response = await api.post('/customer/credit/request-otp', { qrToken, guestId, email })
  return response.data
}

/** After serve: finalize pay-now / house credit for deferred QR checkouts */
export const submitPostServeOrderPayment = async (payload) => {
  const { qrToken, ...body } = payload
  const response = await api.post(`/customer/order/${qrToken}/pay`, body)
  return response.data
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

/**
 * Public restaurant profile (About + Privacy) entered by the restaurant admin.
 * Customer About / Privacy pages render entirely from this response.
 */
export const getRestaurantPublicProfile = async (restaurantSlug) => {
  const response = await api.get(`/customer/restaurant/${restaurantSlug}/profile`)
  return response?.data?.data || null
}

const cleanText = (value) => {
  if (typeof value !== 'string') return ''
  const v = value.trim()
  if (!v) return ''
  const lower = v.toLowerCase()
  if (lower === 'undefined' || lower === 'null') return ''
  return v
}

// Helper functions for customer flow
export const getRestaurantInfo = async (restaurantSlug, qrToken = null) => {
  const [menuRes, profile] = await Promise.all([
    getRestaurantMenu(restaurantSlug, qrToken),
    getRestaurantPublicProfile(restaurantSlug).catch(() => null),
  ])
  const menuRestaurant = menuRes?.data?.restaurant || {}
  const about = profile?.about || {}
  return {
    id: menuRestaurant.id || profile?.id,
    name: menuRestaurant.name || profile?.name,
    logo: menuRestaurant.logo || profile?.logo,
    backgroundPhoto: menuRestaurant.backgroundPhoto || profile?.backgroundPhoto,
    description: cleanText(menuRestaurant.description) || cleanText(profile?.description),
    tagline: cleanText(about.tagline),
    currency: menuRestaurant.currency || profile?.currency || 'Rs.',
    openingTime: menuRestaurant.openingTime || profile?.openingTime,
    closingTime: menuRestaurant.closingTime || profile?.closingTime,
  }
}

export const getCategories = async (restaurantSlug, qrToken = null) => {
  const menu = await getRestaurantMenu(restaurantSlug, qrToken)
  return menu.data.menu || []
}

export const getAllItems = async (restaurantSlug, qrToken = null) => {
  const menu = await getRestaurantMenu(restaurantSlug, qrToken)
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

export const getItemsByCategory = async (restaurantSlug, categoryId, qrToken = null) => {
  const menu = await getRestaurantMenu(restaurantSlug, qrToken)
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
  getStoredCustomerId,
  getStoredCustomerProfile,
  ensureGuestSession,
  requestCustomerIdentityOtp,
  claimCustomerIdentity,
  getCustomerIdentity,
  updateCustomerIdentityProfile,
  changeCustomerIdentityPassword,
  requestCustomerPasswordReset,
  resetCustomerPassword,
  verifyCustomerPasswordResetOtp,
  addItemToGuestCart,
  getGuestCart,
  updateGuestCartItem,
  removeGuestCartItem,
  clearGuestCart,
  getGuestOrders,
  getCartItemCount,
  setCartItemCount,
  getStoredOrderTokens,
  rememberCustomerOrderToken,
  getStoredCustomerOrders,
  getRestaurantInfo,
  getCategories,
  getAllItems,
  getItemsByCategory,
}
