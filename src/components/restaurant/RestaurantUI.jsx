import React from 'react'
import { DEFAULT_CURRENCY_SYMBOL } from '../../utils/currency'

export const orderStatusStyles = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-indigo-100 text-indigo-800',
  preparing: 'bg-blue-100 text-blue-800',
  ready: 'bg-emerald-100 text-emerald-800',
  served: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
}

export const paymentStatusStyles = {
  paid: 'bg-green-100 text-green-800',
  success: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  failed: 'bg-red-100 text-red-800',
  refunded: 'bg-gray-100 text-gray-700',
}

export const paymentMethodStyles = {
  cash: 'bg-green-100 text-green-800',
  card: 'bg-blue-100 text-blue-800',
  online: 'bg-purple-100 text-purple-800',
  upi: 'bg-indigo-100 text-indigo-800',
  wallet: 'bg-yellow-100 text-yellow-800',
}

export const formatRestaurantCurrency = (value, symbol = DEFAULT_CURRENCY_SYMBOL) =>
  `${symbol} ${Number(value || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`

export const formatRestaurantShortDate = (date) => {
  if (!date) return 'No data'
  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) return date
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export const formatRestaurantDateTime = (date) => {
  if (!date) return 'N/A'
  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) return 'N/A'
  return parsed.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
}

export function RestaurantPageLoader({ size = 'lg' }) {
  const sizes = {
    sm: 'h-8 w-8',
    lg: 'h-12 w-12',
  }

  return (
    <div className="flex h-64 items-center justify-center">
      <div className={`animate-spin rounded-full border-b-2 border-primary-600 ${sizes[size] || sizes.lg}`} />
    </div>
  )
}

export function RestaurantStatusPill({ value, styles = orderStatusStyles, uppercase = false, className = '' }) {
  const text = value || 'N/A'

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${styles[text] || 'bg-gray-100 text-gray-700'} ${className}`}
    >
      {uppercase ? String(text).toUpperCase() : text}
    </span>
  )
}
