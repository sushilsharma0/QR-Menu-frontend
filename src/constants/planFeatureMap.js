/** Maps restaurant portal paths/segments to plan feature keys (sync with server planFeatures.js). */

import { parseRestaurantPortalPath } from '../utils/tenantPaths'

export const PLAN_FEATURE_LABELS = {
  dashboard: 'Dashboard',
  salesReports: 'Sales reports',
  menu: 'Menu',
  orders: 'Order management',
  customerOrders: 'POS & new orders',
  tables: 'Tables & QR',
  promotions: 'Promotions',
  cashier: 'Cashier (staff portal)',
  employees: 'Staff management',
  branches: 'Branches',
  creditCustomers: 'Credit accounts',
  financeOverview: 'Finance overview',
  expenses: 'Expenses',
  budget: 'Budget',
  profitLoss: 'Profit & loss',
  accounting: 'Accounting',
  payroll: 'Payroll',
  inventory: 'Inventory',
  billing: 'Invoices',
  activityLogs: 'Audit logs',
  supportTickets: 'Support',
  accountSettings: 'Settings & profile',
  backup: 'Backup',
}

/** Paths always available (not gated by plan features or pre-KYC lock). */
export const PLAN_ALWAYS_OPEN_SEGMENTS = new Set(['subscription', 'kyc', 'security'])

export function isPortalSetupSegment(segment) {
  const root = String(segment || '').replace(/^\/+/, '').split('/')[0]
  return PLAN_ALWAYS_OPEN_SEGMENTS.has(root)
}

export function featureKeyForSegment(segment) {
  const seg = String(segment || '').replace(/^\/+/, '')
  const root = seg.split('/')[0]

  if (PLAN_ALWAYS_OPEN_SEGMENTS.has(root)) return null
  if (seg === 'dashboard') return 'dashboard'
  if (seg === 'orders/activity') return 'salesReports'
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
  if (root === 'backup-recovery') return 'backup'
  if (root === 'settings' || root === 'public-profile' || root === 'profile') return 'accountSettings'
  if (seg === 'finance/dashboard') return 'financeOverview'
  if (seg === 'finance/expenses') return 'expenses'
  if (seg === 'finance/budget') return 'budget'
  if (seg === 'finance/profit-loss') return 'profitLoss'
  if (seg === 'finance/inventory') return 'inventory'
  if (seg === 'finance/payroll') return 'payroll'
  if (seg === 'finance/invoices') return 'billing'
  if (root === 'finance') return 'financeOverview'
  if (root === 'notifications') return null
  return null
}

export function featureKeyForPath(pathname) {
  const parsed = parseRestaurantPortalPath(pathname)
  if (!parsed?.tail) return null
  return featureKeyForSegment(parsed.tail)
}

export function isNavUnlockedWhenBillingLocked(segment) {
  return isPortalSetupSegment(segment)
}

export function isNavUnlockedWhenKycPending(segment) {
  return isPortalSetupSegment(segment)
}

export function isPathAllowedBeforeKyc(pathname) {
  const parsed = parseRestaurantPortalPath(pathname)
  if (!parsed?.tail) return true
  return isPortalSetupSegment(parsed.tail)
}
