export const PLATFORM_PERMISSION_DEFS = [
  {
    key: 'viewAnalytics',
    label: 'Dashboard & analytics',
    description: 'View platform dashboard, metrics, and reports.',
    group: 'Overview',
  },
  {
    key: 'manageRestaurants',
    label: 'Restaurants',
    description: 'List, view, edit, and suspend restaurant accounts.',
    group: 'Tenants',
  },
  {
    key: 'verifyKYC',
    label: 'KYC verification',
    description: 'Review and approve restaurant KYC submissions.',
    group: 'Tenants',
  },
  {
    key: 'manageSubscriptions',
    label: 'Subscriptions & billing',
    description: 'Plans, trials, invoices, payments, and subscription activity.',
    group: 'Billing',
  },
  {
    key: 'manageCMS',
    label: 'Website content',
    description: 'Landing page CMS and marketing content.',
    group: 'Content',
  },
  {
    key: 'manageReviews',
    label: 'Reviews',
    description: 'Moderate customer and restaurant reviews.',
    group: 'Content',
  },
  {
    key: 'manageTickets',
    label: 'Support tickets',
    description: 'Reply to and manage support tickets.',
    group: 'Content',
  },
  {
    key: 'manageSecurity',
    label: 'Security operations',
    description: 'Login locks, IP blocks, fraud alerts, and vendor login policy.',
    group: 'System',
  },
  {
    key: 'managePayroll',
    label: 'Platform payroll',
    description: 'Manage internal platform team staff and run payroll.',
    group: 'Finance',
  },
  {
    key: 'manageFinance',
    label: 'Expenses & profit / loss',
    description: 'Track purchases, operating expenses, and P&L. Salary posts automatically from payroll.',
    group: 'Finance',
  },
  {
    key: 'manageSystem',
    label: 'Site configuration (CMS)',
    description: 'Legacy flag; public site content is under Website CMS. Personal profile settings are available to all staff.',
    group: 'System',
  },
  {
    key: 'manageLogs',
    label: 'System logs',
    description: 'View audit and system activity logs.',
    group: 'System',
  },
]

export const PERMISSION_KEYS = PLATFORM_PERMISSION_DEFS.map((d) => d.key)

export function emptyPermissions() {
  return PERMISSION_KEYS.reduce((acc, key) => {
    acc[key] = false
    return acc
  }, {})
}

export function groupPermissionDefs(defs = PLATFORM_PERMISSION_DEFS) {
  const groups = {}
  defs.forEach((def) => {
    if (!groups[def.group]) groups[def.group] = []
    groups[def.group].push(def)
  })
  return groups
}
