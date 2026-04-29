import api from './api'

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

// Helper functions for customer flow
export const getRestaurantInfo = async (restaurantSlug) => {
  const menu = await getRestaurantMenu(restaurantSlug)
  return {
    id: menu.data.restaurant?.id,
    name: menu.data.restaurant?.name,
    logo: menu.data.restaurant?.logo,
    description: menu.data.restaurant?.description,
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
  getRestaurantInfo,
  getCategories,
  getAllItems,
  getItemsByCategory,
}