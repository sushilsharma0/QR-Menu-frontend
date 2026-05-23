/**
 * Branch portal modules for create/edit wizards — mirrors restaurant sidebar
 * (server/src/constants/branchModules.js + restaurantNavConfig.js).
 * Excludes restaurant-only: Branches, KYC, Subscription.
 */

export const BRANCH_MODULE_SECTIONS = [
  {
    id: 'overview',
    label: 'Overview',
    items: [
      { key: 'dashboard', label: 'Dashboard' },
      { key: 'salesReports', label: 'Sales reports' },
    ],
  },
  {
    id: 'operations',
    label: 'Operations',
    items: [
      { key: 'customerOrders', label: 'POS' },
      { key: 'orders', label: 'Orders' },
      { key: 'menu', label: 'Menu' },
      { key: 'tables', label: 'Tables & QR' },
      { key: 'promotions', label: 'Promotions' },
      { key: 'creditCustomers', label: 'Credit accounts' },
    ],
  },
  {
    id: 'finance',
    label: 'Finance',
    items: [
      { key: 'financeOverview', label: 'Finance overview' },
      { key: 'expenses', label: 'Expenses' },
      { key: 'budget', label: 'Budget' },
      { key: 'profitLoss', label: 'Profit & loss' },
      { key: 'inventory', label: 'Inventory' },
      { key: 'payroll', label: 'Payroll' },
      { key: 'billing', label: 'Invoices & billing' },
      { key: 'accounting', label: 'Accounting (journals, tax, period locks)' },
    ],
  },
  {
    id: 'business',
    label: 'Business',
    items: [{ key: 'employees', label: 'Staff' }],
  },
  {
    id: 'account',
    label: 'Account',
    items: [
      { key: 'accountSettings', label: 'Settings & public profile' },
      { key: 'backup', label: 'Backup & recovery' },
      { key: 'supportTickets', label: 'Support tickets' },
      { key: 'activityLogs', label: 'Audit logs' },
    ],
  },
]

export const BRANCH_MODULE_DEFS = BRANCH_MODULE_SECTIONS.flatMap((section) => section.items)

export const BRANCH_MODULE_KEYS = BRANCH_MODULE_DEFS.map((item) => item.key)

const LABEL_BY_KEY = Object.fromEntries(BRANCH_MODULE_DEFS.map((item) => [item.key, item.label]))

export function branchModuleLabel(key) {
  return LABEL_BY_KEY[key] || key
}

export function isBranchModuleEnabled(enabledModules, key) {
  if (!key) return true
  const modules = enabledModules || {}
  if (modules[key] === false) return false
  if (key === 'customerOrders' && modules.pos === false) return false
  if (key === 'salesReports' && modules.analytics === false) return false
  return true
}

export function buildEnabledModulesPayload(formModules = {}) {
  return Object.fromEntries(
    BRANCH_MODULE_KEYS.map((key) => [key, formModules[key] !== false]),
  )
}

export function enabledModuleLabelsForBranch(branch) {
  if (branch?.isDefault) return BRANCH_MODULE_DEFS.map((item) => item.label)
  return BRANCH_MODULE_DEFS.filter(({ key }) => isBranchModuleEnabled(branch?.enabledModules, key)).map(
    (item) => item.label,
  )
}
