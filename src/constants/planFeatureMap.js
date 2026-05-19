/** Maps restaurant portal paths/segments to plan feature keys (sync with server planFeatures.js). */

import { parseRestaurantPortalPath } from '../utils/tenantPaths'

export const PLAN_FEATURE_LABELS = {
  analytics: 'Dashboard & sales reports',
  menu: 'Menu & categories',
  orders: 'Order management',
  customerOrders: 'POS & QR customer orders',
  tables: 'Tables & QR codes',
  promotions: 'Promotions',
  cashier: 'Cashier payments',
  employees: 'Employees & payroll',
  branches: 'Branch management',
  creditCustomers: 'Credit customers',
  inventory: 'Inventory',
  billing: 'Invoices & billing',
  activityLogs: 'Audit logs',
  supportTickets: 'Support tickets',
  accountSettings: 'Settings & public profile',
  backup: 'Backup & restore',
}

/** Paths always available (not gated by plan features). */
export const PLAN_ALWAYS_OPEN_SEGMENTS = new Set(['subscription', 'kyc', 'security'])

export function featureKeyForSegment(segment) {
  const seg = String(segment || '').replace(/^\/+/, '')
  const root = seg.split('/')[0]

  if (PLAN_ALWAYS_OPEN_SEGMENTS.has(root)) return null
  if (seg === 'dashboard' || seg === 'orders/activity') return 'analytics'
  if (root === 'pos') return 'customerOrders'
  if (root === 'menu') return 'menu'
  if (root === 'orders') return 'orders'
  if (root === 'tables') return 'tables'
  if (root === 'promotions') return 'promotions'
  if (root === 'credit-customers') return 'creditCustomers'
  if (root === 'employees') return 'employees'
  if (root === 'branches') return 'branches'
  if (root === 'tickets') return 'supportTickets'
  if (root === 'logs') return 'activityLogs'
  if (root === 'settings' || root === 'public-profile' || root === 'profile') return 'accountSettings'
  if (seg === 'finance/inventory') return 'inventory'
  if (seg === 'finance/invoices') return 'billing'
  if (seg === 'finance/payroll') return 'employees'
  if (root === 'finance') return 'analytics'
  if (root === 'notifications') return null
  return null
}

export function featureKeyForPath(pathname) {
  const parsed = parseRestaurantPortalPath(pathname)
  if (!parsed?.tail) return null
  return featureKeyForSegment(parsed.tail)
}

export function isNavUnlockedWhenBillingLocked(segment) {
  const root = String(segment || '').split('/')[0]
  return root === 'subscription' || root === 'kyc' || root === 'security'
}
