import {
  FiActivity,
  FiClipboard,
  FiCreditCard,
  FiDollarSign,
  FiFileText,
  FiHelpCircle,
  FiHome,
  FiLayers,
  FiLayout,
  FiPieChart,
  FiSettings,
  FiShield,
  FiSliders,
  FiStar,
  FiTerminal,
  FiTrendingUp,
  FiUserCheck,
  FiUsers,
} from 'react-icons/fi'

/**
 * Platform sidebar navigation.
 * - permission: required key (super_admin bypasses)
 * - superAdminOnly: super_admin only
 */
export const PLATFORM_NAV_SECTIONS = [
  {
    id: 'overview',
    label: 'Overview',
    icon: FiHome,
    defaultOpen: true,
    items: [{ path: '/platform/dashboard', icon: FiHome, label: 'Dashboard', permission: 'viewAnalytics' }],
  },
  {
    id: 'tenants',
    label: 'Tenants',
    icon: FiUsers,
    defaultOpen: false,
    items: [
      { path: '/platform/restaurants', icon: FiUsers, label: 'Restaurants', permission: 'manageRestaurants' },
      { path: '/platform/kyc', icon: FiFileText, label: 'KYC verification', permission: 'verifyKYC', badgeKey: 'kycPending' },
    ],
  },
  {
    id: 'billing',
    label: 'Billing & plans',
    icon: FiLayers,
    defaultOpen: false,
    items: [
      { path: '/platform/subscriptions', icon: FiLayers, label: 'Plans', permission: 'manageSubscriptionPlans', badgeKey: 'subscriptionRequests' },
      { path: '/platform/plan-access-settings', icon: FiSliders, label: 'Trial access', permission: 'manageTrialAccess' },
      { path: '/platform/subscription-payments', icon: FiDollarSign, label: 'Payments', permission: 'manageSubscriptionPayments', badgeKey: 'paymentReviews' },
      { path: '/platform/invoices', icon: FiClipboard, label: 'Invoices', permission: 'manageSubscriptionInvoices' },
      { path: '/platform/subscription-activity', icon: FiActivity, label: 'Activity log', permission: 'manageSubscriptionActivity' },
    ],
  },
  {
    id: 'content',
    label: 'Content & support',
    icon: FiLayout,
    defaultOpen: false,
    items: [
      { path: '/platform/cms', icon: FiLayout, label: 'Website CMS', permission: 'manageCMS' },
      { path: '/platform/reviews', icon: FiStar, label: 'Reviews', permission: 'manageReviews' },
      { path: '/platform/tickets', icon: FiHelpCircle, label: 'Tickets', permission: 'manageTickets' },
    ],
  },
  {
    id: 'finance',
    label: 'Finance',
    icon: FiTrendingUp,
    defaultOpen: false,
    items: [
      { path: '/platform/finance/settings', icon: FiDollarSign, label: 'Billing & payments', permission: 'managePlatformBillingSettings', superAdminOnly: false, financeSettings: true },
      { path: '/platform/payroll', icon: FiUserCheck, label: 'Payroll', permission: 'managePayroll' },
      { path: '/platform/expenses', icon: FiCreditCard, label: 'Expenses', permission: 'manageFinance' },
      { path: '/platform/profit-loss', icon: FiPieChart, label: 'Profit & loss', permission: 'manageFinance' },
    ],
  },
  {
    id: 'account',
    label: 'My account',
    icon: FiSettings,
    defaultOpen: false,
    items: [{ path: '/platform/settings', icon: FiSettings, label: 'Settings' }],
  },
  {
    id: 'system',
    label: 'System',
    icon: FiShield,
    defaultOpen: false,
    items: [
      { path: '/platform/admins', icon: FiUsers, label: 'Admins', superAdminOnly: true },
      { path: '/platform/security', icon: FiShield, label: 'Security', permission: 'manageSecurity' },
      { path: '/platform/logs', icon: FiTerminal, label: 'Logs', permission: 'manageLogs' },
    ],
  },
]

/** @deprecated */
export const PLATFORM_NAV_GROUPS = PLATFORM_NAV_SECTIONS.map((section) => ({
  label: section.label,
  items: section.items,
}))

export function canSeeNavItem(item, hasPermission, isSuperAdmin) {
  if (item.financeSettings) {
    return isSuperAdmin || hasPermission('managePlatformBillingSettings')
  }
  if (item.superAdminOnly) return isSuperAdmin
  if (!item.permission) return true
  return hasPermission(item.permission)
}

export function filterPlatformNavSections(hasPermission, isSuperAdmin) {
  return PLATFORM_NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => canSeeNavItem(item, hasPermission, isSuperAdmin)),
  })).filter((section) => section.items.length > 0)
}

/** Dashboard as a pinned top link; everything else is a collapsible group. */
export function buildPlatformNavLayout(hasPermission, isSuperAdmin) {
  const sections = filterPlatformNavSections(hasPermission, isSuperAdmin)
  const overviewSection = sections.find((s) => s.id === 'overview')
  const primary = overviewSection?.items?.[0] || null
  const groups = sections.filter((s) => s.id !== 'overview')
  const flatItems = sections.flatMap((section) =>
    section.items.map((item) => ({ ...item, sectionId: section.id, sectionLabel: section.label })),
  )
  return { primary, groups, flatItems, sections }
}

export function getFirstAllowedPlatformPath(hasPermission, isSuperAdmin) {
  const { flatItems } = buildPlatformNavLayout(hasPermission, isSuperAdmin)
  return flatItems[0]?.path || '/platform/dashboard'
}

export function sectionContainsPath(section, pathname) {
  const path = String(pathname || '').replace(/\/+$/, '')
  return section.items.some((item) => {
    const base = item.path.replace(/\/+$/, '')
    if (base === '/platform/dashboard') return path === base
    return path === base || path.startsWith(`${base}/`)
  })
}

export function findActiveSectionId(sections, pathname) {
  const hit = sections.find((section) => sectionContainsPath(section, pathname))
  return hit?.id || null
}
