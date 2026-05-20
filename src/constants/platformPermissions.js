/**
 * Platform admin privilege catalog.
 * Keys are enforced server-side — keep PERMISSION_KEYS in sync with backend.
 *
 * Nested UI: `domain` = top accordion · `section` = optional subgroup (same domain).
 */

/** Legacy umbrella (not editable in privilege UI — expanded on load for admins that still carry it). */
export const LEGACY_FULL_BILLING_KEY = 'manageSubscriptions'

/** Display order for domain accordions in AdminPrivilegeEditor */
export const PLATFORM_PERMISSION_DOMAIN_ORDER = [
  'overview',
  'tenants',
  'billing',
  'content',
  'finance',
  'system',
]

export const PLATFORM_DOMAIN_META = {
  overview: {
    title: 'Overview',
    hint: 'Who can view platform KPIs and the main dashboard.',
  },
  tenants: {
    title: 'Tenant management',
    hint: 'Restaurant accounts and compliance before they go live.',
  },
  billing: {
    title: 'Billing & subscriptions',
    hint: 'Split by area — plans, trial rules, inbound payments, invoices, VAT setup, and activity.',
  },
  content: {
    title: 'Content & support',
    hint: 'Public site content, moderation, and helpdesk.',
  },
  finance: {
    title: 'Finance',
    hint: 'Internal payroll and operating expenses / reporting.',
  },
  system: {
    title: 'Security & operations',
    hint: 'Hardening, audit trails, and global configuration.',
  },
}

export const PLATFORM_PERMISSION_DEFS = [
  {
    key: 'viewAnalytics',
    label: 'Dashboard & analytics',
    description: 'View platform dashboard, metrics, and reports.',
    domain: 'overview',
    section: null,
  },
  {
    key: 'manageRestaurants',
    label: 'Restaurants',
    description: 'List, view, edit, and suspend restaurant accounts.',
    domain: 'tenants',
    section: 'Restaurant accounts',
  },
  {
    key: 'verifyKYC',
    label: 'KYC verification',
    description: 'Review and approve restaurant KYC submissions.',
    domain: 'tenants',
    section: 'Compliance & verification',
  },
  {
    key: 'manageSubscriptionPlans',
    label: 'Plans & subscriptions',
    description: 'Catalog plans, edits, assigns to tenants, pending upgrade requests.',
    domain: 'billing',
    section: 'Plans & assignments',
  },
  {
    key: 'manageTrialAccess',
    label: 'Trial access defaults',
    description: 'Trial length and which capabilities new tenants receive before subscribing.',
    domain: 'billing',
    section: 'Trial rules',
  },
  {
    key: 'manageSubscriptionPayments',
    label: 'Payment reviews',
    description: 'Review manual uploads and reconcile gateway subscription payments.',
    domain: 'billing',
    section: 'Inbound payments',
  },
  {
    key: 'manageSubscriptionInvoices',
    label: 'Invoices & documents',
    description: 'List and open platform invoices and PDFs sent to tenants.',
    domain: 'billing',
    section: 'Invoices',
  },
  {
    key: 'manageSubscriptionActivity',
    label: 'Subscription activity',
    description: 'Audit-style activity log across plans and invoices.',
    domain: 'billing',
    section: 'Reporting',
  },
  {
    key: 'managePlatformBillingSettings',
    label: 'Platform billing setup',
    description: 'VAT, pricing defaults, gateways, addresses used on receipts.',
    domain: 'billing',
    section: 'Company billing profile',
  },
  {
    key: 'manageCMS',
    label: 'Website content (CMS)',
    description: 'Landing pages and marketing content.',
    domain: 'content',
    section: 'Website',
  },
  {
    key: 'manageReviews',
    label: 'Reviews',
    description: 'Moderate customer and restaurant reviews.',
    domain: 'content',
    section: 'Trust & moderation',
  },
  {
    key: 'manageTickets',
    label: 'Support tickets',
    description: 'Reply to and manage support tickets.',
    domain: 'content',
    section: 'Customer support',
  },
  {
    key: 'managePayroll',
    label: 'Platform payroll',
    description: 'Internal platform staff and payroll runs.',
    domain: 'finance',
    section: 'Payroll',
  },
  {
    key: 'manageFinance',
    label: 'Expenses & profit / loss',
    description: 'Operating expenses and P&L view. Salary posts automatically from payroll.',
    domain: 'finance',
    section: 'Books & reporting',
  },
  {
    key: 'manageSecurity',
    label: 'Security operations',
    description: 'Login locks, IP blocks, fraud alerts, and vendor login policy.',
    domain: 'system',
    section: 'Threat & access',
  },
  {
    key: 'manageLogs',
    label: 'System logs',
    description: 'View audit trails and technical activity logs.',
    domain: 'system',
    section: 'Monitoring & auditing',
  },
  {
    key: 'manageSystem',
    label: 'Platform configuration',
    description: 'Legacy global-settings flag — personal profile stays available for all staff.',
    domain: 'system',
    section: 'Configuration',
  },
]

export const BILLING_GRANULAR_PERMISSION_KEYS = PLATFORM_PERMISSION_DEFS.filter((d) => d.domain === 'billing').map(
  (d) => d.key,
)

export const PERMISSION_KEYS = PLATFORM_PERMISSION_DEFS.map((d) => d.key)

export function emptyPermissions() {
  return PERMISSION_KEYS.reduce((acc, key) => {
    acc[key] = false
    return acc
  }, {})
}

/** Merge stored Mongo/JWT payload so legacy umbrella shows as all billing slices checked in editors. */
export function hydratePrivilegesForEditor(stored = {}) {
  const base = emptyPermissions()
  PERMISSION_KEYS.forEach((k) => {
    base[k] = Boolean(stored[k])
  })
  if (stored[LEGACY_FULL_BILLING_KEY] === true) {
    BILLING_GRANULAR_PERMISSION_KEYS.forEach((k) => {
      base[k] = true
    })
  }
  return base
}

/** Mirrors server display count — legacy umbrella expands into billing granular keys for totals. */
export function countGrantedPrivileges(perms = {}) {
  const counted = {}
  PERMISSION_KEYS.forEach((k) => {
    if (perms[k]) counted[k] = true
  })
  if (perms[LEGACY_FULL_BILLING_KEY] === true) {
    BILLING_GRANULAR_PERMISSION_KEYS.forEach((k) => {
      counted[k] = true
    })
  }
  return Object.keys(counted).length
}

/** @deprecated Prefer nestPermissionsForUi — kept for one-off tooling */
export function groupPermissionDefs(defs = PLATFORM_PERMISSION_DEFS) {
  const groups = {}
  defs.forEach((def) => {
    const g = PLATFORM_DOMAIN_META[def.domain]?.title || def.domain
    if (!groups[g]) groups[g] = []
    groups[g].push(def)
  })
  return groups
}

/**
 * Builds nested [{ domainId, meta, sections: [{ sectionLabel, defs[]] }] }] for editors.
 */
export function nestPermissionsForUi(defs = PLATFORM_PERMISSION_DEFS) {
  return PLATFORM_PERMISSION_DOMAIN_ORDER.map((domainId) => {
    const meta = PLATFORM_DOMAIN_META[domainId]
    const inDomain = defs.filter((d) => d.domain === domainId)

    const sectionOrder = []
    const sectionBuckets = {}
    inDomain.forEach((d) => {
      const label = d.section == null ? null : String(d.section)
      if (!sectionBuckets[label]) {
        sectionBuckets[label] = []
        sectionOrder.push(label)
      }
      sectionBuckets[label].push(d)
    })

    const sections = sectionOrder.map((sectionLabel) => ({
      sectionLabel,
      defs: sectionBuckets[sectionLabel],
    }))

    return { domainId, meta: meta || { title: domainId, hint: '' }, sections }
  }).filter(({ sections }) => sections.some((s) => s.defs.length > 0))
}
