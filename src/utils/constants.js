export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'
export const APP_NAME = import.meta.env.VITE_APP_NAME || 'QR Menu SaaS'

export const ORDER_STATUS = {
  pending: { label: 'Pending', color: 'yellow' },
  confirmed: { label: 'Confirmed', color: 'blue' },
  preparing: { label: 'Preparing', color: 'purple' },
  ready: { label: 'Ready', color: 'green' },
  served: { label: 'Served', color: 'gray' },
  cancelled: { label: 'Cancelled', color: 'red' },
}

export const PAYMENT_METHODS = ['cash', 'card', 'online', 'upi', 'wallet']

export const USER_ROLES = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  restaurant: 'Restaurant Owner',
  kitchen: 'Kitchen Staff',
  cashier: 'Cashier',
}