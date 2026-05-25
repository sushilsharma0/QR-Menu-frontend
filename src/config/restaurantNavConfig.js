import {
  FiBarChart2,
  FiBookOpen,
  FiCalendar,
  FiCoffee,
  FiCreditCard,
  FiDatabase,
  FiDollarSign,
  FiFileText,
  FiHelpCircle,
  FiHome,
  FiMapPin,
  FiMessageSquare,
  FiPercent,
  FiPieChart,
  FiSettings,
  FiShield,
  FiShoppingBag,
  FiTerminal,
  FiTruck,
  FiUsers,
} from 'react-icons/fi'

/**
 * Collapsible sidebar sections. Each child maps to a route segment and optional featureKey
 * (sync with server/src/constants/planFeatures.js).
 */
export const RESTAURANT_QUICK_LINKS = [
  { segment: 'pos', icon: FiCoffee, label: 'POS', featureKey: 'customerOrders' },
  { segment: 'orders', icon: FiShoppingBag, label: 'Orders', featureKey: 'orders' },
]

/** Tailwind accent tokens keyed by section.accentKey */
export const RESTAURANT_SECTION_ACCENTS = {
  overview: {
    sectionIcon: 'bg-primary-50 text-primary-700 ring-primary-100/80 dark:bg-primary-950/50 dark:text-primary-300 dark:ring-primary-800/60',
    sectionIconActive: 'bg-primary-100 text-primary-800 ring-primary-200 dark:bg-primary-900/60 dark:text-primary-200',
    panel: 'border-primary-100/90 bg-gradient-to-br from-primary-50/50 to-white dark:border-primary-900/50 dark:from-primary-950/20 dark:to-gray-900',
    rail: 'border-primary-200/80 dark:border-primary-800/50',
    itemActive: 'bg-primary-50 text-primary-800 ring-primary-100 dark:bg-primary-950/40 dark:text-primary-100 dark:ring-primary-800/60',
  },
  operations: {
    sectionIcon: 'bg-emerald-50 text-emerald-700 ring-emerald-100/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-800/50',
    sectionIconActive: 'bg-emerald-100 text-emerald-800 ring-emerald-200 dark:bg-emerald-900/50 dark:text-emerald-200',
    panel: 'border-emerald-100/90 bg-gradient-to-br from-emerald-50/40 to-white dark:border-emerald-900/40 dark:from-emerald-950/15 dark:to-gray-900',
    rail: 'border-emerald-200/70 dark:border-emerald-800/40',
    itemActive: 'bg-emerald-50 text-emerald-900 ring-emerald-100 dark:bg-emerald-950/35 dark:text-emerald-100 dark:ring-emerald-800/50',
  },
  finance: {
    sectionIcon: 'bg-amber-50 text-amber-700 ring-amber-100/80 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-800/50',
    sectionIconActive: 'bg-amber-100 text-amber-800 ring-amber-200 dark:bg-amber-900/50 dark:text-amber-200',
    panel: 'border-amber-100/90 bg-gradient-to-br from-amber-50/35 to-white dark:border-amber-900/40 dark:from-amber-950/15 dark:to-gray-900',
    rail: 'border-amber-200/70 dark:border-amber-800/40',
    itemActive: 'bg-amber-50 text-amber-900 ring-amber-100 dark:bg-amber-950/35 dark:text-amber-100 dark:ring-amber-800/50',
  },
  business: {
    sectionIcon: 'bg-sky-50 text-sky-700 ring-sky-100/80 dark:bg-sky-950/40 dark:text-sky-300 dark:ring-sky-800/50',
    sectionIconActive: 'bg-sky-100 text-sky-800 ring-sky-200 dark:bg-sky-900/50 dark:text-sky-200',
    panel: 'border-sky-100/90 bg-gradient-to-br from-sky-50/35 to-white dark:border-sky-900/40 dark:from-sky-950/15 dark:to-gray-900',
    rail: 'border-sky-200/70 dark:border-sky-800/40',
    itemActive: 'bg-sky-50 text-sky-900 ring-sky-100 dark:bg-sky-950/35 dark:text-sky-100 dark:ring-sky-800/50',
  },
  account: {
    sectionIcon: 'bg-slate-100 text-slate-700 ring-slate-200/80 dark:bg-slate-800/60 dark:text-slate-300 dark:ring-slate-700/60',
    sectionIconActive: 'bg-slate-200 text-slate-800 ring-slate-300 dark:bg-slate-700/70 dark:text-slate-100',
    panel: 'border-slate-200/90 bg-gradient-to-br from-slate-50/50 to-white dark:border-slate-700/50 dark:from-slate-900/30 dark:to-gray-900',
    rail: 'border-slate-200/70 dark:border-slate-700/50',
    itemActive: 'bg-slate-100 text-slate-900 ring-slate-200 dark:bg-slate-800/50 dark:text-slate-100 dark:ring-slate-700/60',
  },
}

export const RESTAURANT_NAV_SECTIONS = [
  {
    id: 'overview',
    label: 'Overview',
    description: 'Dashboard & performance',
    accentKey: 'overview',
    icon: FiHome,
    defaultOpen: true,
    items: [
      { segment: 'dashboard', icon: FiHome, label: 'Dashboard', featureKey: 'dashboard' },
      { segment: 'orders/activity', icon: FiBarChart2, label: 'Sales reports', featureKey: 'salesReports' },
      { segment: 'reports/food-cost', icon: FiPercent, label: 'Food cost', featureKey: 'salesReports' },
    ],
  },
  {
    id: 'operations',
    label: 'Operations',
    description: 'Daily service & menu',
    accentKey: 'operations',
    icon: FiShoppingBag,
    defaultOpen: true,
    items: [
      { segment: 'pos', icon: FiCoffee, label: 'POS', featureKey: 'customerOrders' },
      { segment: 'orders', icon: FiShoppingBag, label: 'Orders', featureKey: 'orders' },
      { segment: 'orders/dispatch', icon: FiTruck, label: 'Delivery dispatch', featureKey: 'orders' },
      { segment: 'menu', icon: FiBookOpen, label: 'Menu', featureKey: 'menu' },
      { segment: 'tables', icon: FiMapPin, label: 'Tables & QR', featureKey: 'tables' },
      { segment: 'reservations', icon: FiCalendar, label: 'Reservations', featureKey: 'tables' },
      { segment: 'promotions', icon: FiPercent, label: 'Promotions', featureKey: 'promotions' },
      { segment: 'feedback', icon: FiMessageSquare, label: 'Feedback', featureKey: 'orders' },
      { segment: 'customers', icon: FiUsers, label: 'Customers', featureKey: 'orders' },
    ],
  },
  {
    id: 'finance',
    label: 'Finance',
    description: 'Money, stock & payroll',
    accentKey: 'finance',
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
      { segment: 'finance/accounting', icon: FiBookOpen, label: 'Accounting', featureKey: 'accounting' },
    ],
  },
  {
    id: 'business',
    label: 'Business',
    description: 'Team & locations',
    accentKey: 'business',
    icon: FiUsers,
    defaultOpen: false,
    items: [
      { segment: 'employees', icon: FiUsers, label: 'Staff', featureKey: 'employees' },
      { segment: 'attendance', icon: FiCalendar, label: 'Attendance', featureKey: 'employees' },
      { segment: 'branches', icon: FiMapPin, label: 'Branches', featureKey: 'branches' },
      { segment: 'credit-customers', icon: FiDollarSign, label: 'Credit accounts', featureKey: 'creditCustomers' },
    ],
  },
  {
    id: 'account',
    label: 'Account',
    description: 'Plan, security & support',
    accentKey: 'account',
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
