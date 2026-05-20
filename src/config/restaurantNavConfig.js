import {
  FiBarChart2,
  FiBookOpen,
  FiCoffee,
  FiCreditCard,
  FiDatabase,
  FiDollarSign,
  FiFileText,
  FiHelpCircle,
  FiHome,
  FiMapPin,
  FiPercent,
  FiPieChart,
  FiSettings,
  FiShield,
  FiShoppingBag,
  FiTerminal,
  FiUsers,
} from 'react-icons/fi'

/**
 * Collapsible sidebar sections. Each child maps to a route segment and optional featureKey
 * (sync with server/src/constants/planFeatures.js).
 */
export const RESTAURANT_NAV_SECTIONS = [
  {
    id: 'overview',
    label: 'Overview',
    icon: FiHome,
    defaultOpen: true,
    items: [
      { segment: 'dashboard', icon: FiHome, label: 'Dashboard', featureKey: 'dashboard' },
      { segment: 'orders/activity', icon: FiBarChart2, label: 'Sales reports', featureKey: 'salesReports' },
    ],
  },
  {
    id: 'operations',
    label: 'Operations',
    icon: FiShoppingBag,
    defaultOpen: true,
    items: [
      { segment: 'pos', icon: FiCoffee, label: 'POS', featureKey: 'customerOrders' },
      { segment: 'orders', icon: FiShoppingBag, label: 'Orders', featureKey: 'orders' },
      { segment: 'menu', icon: FiBookOpen, label: 'Menu', featureKey: 'menu' },
      { segment: 'tables', icon: FiMapPin, label: 'Tables & QR', featureKey: 'tables' },
      { segment: 'promotions', icon: FiPercent, label: 'Promotions', featureKey: 'promotions' },
    ],
  },
  {
    id: 'finance',
    label: 'Finance',
    icon: FiPieChart,
    defaultOpen: false,
    items: [
      { segment: 'finance/dashboard', icon: FiBarChart2, label: 'Overview', featureKey: 'financeOverview' },
      { segment: 'finance/expenses', icon: FiCreditCard, label: 'Expenses', featureKey: 'expenses' },
      { segment: 'finance/budget', icon: FiPieChart, label: 'Budget', featureKey: 'budget' },
      { segment: 'finance/profit-loss', icon: FiPercent, label: 'Profit & loss', featureKey: 'profitLoss' },
      { segment: 'finance/inventory', icon: FiBookOpen, label: 'Inventory', featureKey: 'inventory' },
      { segment: 'finance/payroll', icon: FiUsers, label: 'Payroll', featureKey: 'payroll' },
      { segment: 'finance/invoices', icon: FiFileText, label: 'Invoices', featureKey: 'billing' },
    ],
  },
  {
    id: 'business',
    label: 'Business',
    icon: FiUsers,
    defaultOpen: false,
    items: [
      { segment: 'employees', icon: FiUsers, label: 'Staff', featureKey: 'employees' },
      { segment: 'branches', icon: FiMapPin, label: 'Branches', featureKey: 'branches' },
      { segment: 'credit-customers', icon: FiDollarSign, label: 'Credit accounts', featureKey: 'creditCustomers' },
    ],
  },
  {
    id: 'account',
    label: 'Account',
    icon: FiSettings,
    defaultOpen: false,
    items: [
      { segment: 'kyc', icon: FiShield, label: 'KYC' },
      { segment: 'subscription', icon: FiCreditCard, label: 'Subscription' },
      { segment: 'settings', icon: FiSettings, label: 'Settings', featureKey: 'accountSettings' },
      { segment: 'backup-recovery', icon: FiDatabase, label: 'Backup & Recovery', featureKey: 'backup' },
      { segment: 'tickets', icon: FiHelpCircle, label: 'Support', featureKey: 'supportTickets' },
      { segment: 'logs', icon: FiTerminal, label: 'Audit logs', featureKey: 'activityLogs' },
      { segment: 'security', icon: FiShield, label: 'Devices' },
      { segment: 'public-profile', icon: FiFileText, label: 'Public profile', featureKey: 'accountSettings' },
    ],
  },
]

/** Flat list (legacy / utilities). */
export const RESTAURANT_NAV_GROUPS = RESTAURANT_NAV_SECTIONS.map((section) => ({
  label: section.label,
  items: section.items,
}))

export function flattenNavItems(sections = RESTAURANT_NAV_SECTIONS) {
  return sections.flatMap((s) => s.items)
}

/** True if pathname tail matches any child in this section. */
export function sectionContainsSegment(section, segmentTail) {
  const tail = String(segmentTail || '').replace(/^\/+/, '')
  return section.items.some((item) => {
    const seg = item.segment.replace(/^\/+/, '')
    if (seg === 'orders') return tail === 'orders' || tail.startsWith('orders/')
    return tail === seg || tail.startsWith(`${seg}/`)
  })
}
