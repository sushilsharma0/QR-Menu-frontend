import {
  FiBarChart2,
  FiClipboard,
  FiCreditCard,
  FiFileText,
  FiHelpCircle,
  FiHome,
  FiLayout,
  FiSettings,
  FiShield,
  FiSliders,
  FiStar,
  FiTerminal,
  FiUsers,
} from 'react-icons/fi'

/** Collapsible platform admin sidebar sections. */
export const PLATFORM_NAV_SECTIONS = [
  {
    id: 'overview',
    label: 'Overview',
    icon: FiHome,
    defaultOpen: true,
    items: [{ path: '/platform/dashboard', icon: FiHome, label: 'Dashboard' }],
  },
  {
    id: 'tenants',
    label: 'Tenants',
    icon: FiUsers,
    defaultOpen: true,
    items: [
      { path: '/platform/restaurants', icon: FiUsers, label: 'Restaurants' },
      { path: '/platform/kyc', icon: FiFileText, label: 'KYC verification', badgeKey: 'kycPending' },
    ],
  },
  {
    id: 'billing',
    label: 'Billing',
    icon: FiCreditCard,
    defaultOpen: false,
    items: [
      { path: '/platform/subscriptions', icon: FiCreditCard, label: 'Subscriptions', badgeKey: 'subscriptionRequests' },
      { path: '/platform/plan-access-settings', icon: FiSliders, label: 'Trial settings' },
      { path: '/platform/subscription-payments', icon: FiCreditCard, label: 'Payments', badgeKey: 'paymentReviews' },
      { path: '/platform/invoices', icon: FiClipboard, label: 'Invoices' },
      { path: '/platform/subscription-activity', icon: FiBarChart2, label: 'Activity' },
    ],
  },
  {
    id: 'content',
    label: 'Content',
    icon: FiLayout,
    defaultOpen: false,
    items: [
      { path: '/platform/cms', icon: FiLayout, label: 'Website content' },
      { path: '/platform/reviews', icon: FiStar, label: 'Reviews' },
      { path: '/platform/tickets', icon: FiHelpCircle, label: 'Support tickets' },
    ],
  },
  {
    id: 'system',
    label: 'System',
    icon: FiShield,
    defaultOpen: false,
    items: [
      { path: '/platform/admins', icon: FiShield, label: 'Admins' },
      { path: '/platform/security', icon: FiShield, label: 'Security ops' },
      { path: '/platform/logs', icon: FiTerminal, label: 'System logs' },
      { path: '/platform/settings', icon: FiSettings, label: 'Settings' },
    ],
  },
]

/** @deprecated Use PLATFORM_NAV_SECTIONS */
export const PLATFORM_NAV_GROUPS = PLATFORM_NAV_SECTIONS.map((section) => ({
  label: section.label,
  items: section.items,
}))

export function sectionContainsPath(section, pathname) {
  const path = String(pathname || '').replace(/\/+$/, '')
  return section.items.some((item) => {
    const base = item.path.replace(/\/+$/, '')
    if (base === '/platform/dashboard') return path === base
    return path === base || path.startsWith(`${base}/`)
  })
}
