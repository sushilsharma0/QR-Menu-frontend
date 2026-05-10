import React, { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  FiAward,
  FiBarChart2,
  FiBookOpen,
  FiBriefcase,
  FiChevronLeft,
  FiChevronRight,
  FiCoffee,
  FiCreditCard,
  FiExternalLink,
  FiFileText,
  FiHelpCircle,
  FiHome,
  FiLock,
  FiMapPin,
  FiMenu,
  FiPercent,
  FiPieChart,
  FiSettings,
  FiShield,
  FiShoppingBag,
  FiTerminal,
  FiUserCheck,
  FiUsers,
  FiX,
} from 'react-icons/fi'
import api from '../../services/api'
import { useAuth } from '../../hooks/useAuth'
import { useSocket } from '../../hooks/useSocket'
import { useTenantRoutes } from '../../hooks/useTenantRoutes'

function staffLoginHref(restaurantId, staff) {
  const q = new URLSearchParams({ role: 'employee', staff, restaurantId: String(restaurantId) })
  return `/login?${q.toString()}`
}

const NAV_GROUPS = [
  {
    label: 'Overview',
    items: [
      { segment: 'dashboard', icon: FiHome, label: 'Dashboard' },
      { segment: 'orders/activity', icon: FiBarChart2, label: 'Sales activity' },
    ],
  },
  {
    label: 'Service',
    items: [
      { segment: 'pos', icon: FiCoffee, label: 'POS' },
      { segment: 'orders', icon: FiShoppingBag, label: 'Orders' },
      { segment: 'menu', icon: FiBookOpen, label: 'Menu' },
      { segment: 'tables', icon: FiMapPin, label: 'Tables & QR' },
      { segment: 'promotions', icon: FiPercent, label: 'Promotions' },
    ],
  },
  {
    label: 'Business',
    items: [
      { segment: 'employees', icon: FiUsers, label: 'Employees' },
      { segment: 'kyc', icon: FiShield, label: 'KYC' },
      { segment: 'subscription', icon: FiCreditCard, label: 'Subscription' },
    ],
  },
  {
    label: 'Accounting',
    items: [
      { segment: 'finance/dashboard', icon: FiBarChart2, label: 'Finance Dashboard' },
      { segment: 'finance/expenses', icon: FiCreditCard, label: 'Expenses' },
      { segment: 'finance/budget', icon: FiPieChart, label: 'Budget' },
      { segment: 'finance/profit-loss', icon: FiPercent, label: 'Profit & Loss' },
      { segment: 'finance/inventory', icon: FiBookOpen, label: 'Inventory' },
      { segment: 'finance/payroll', icon: FiUsers, label: 'Payroll' },
      { segment: 'finance/invoices', icon: FiFileText, label: 'Invoices' },
    ],
  },
  {
    label: 'Support',
    items: [
      { segment: 'tickets', icon: FiHelpCircle, label: 'Support Tickets' },
      { segment: 'logs', icon: FiTerminal, label: 'Audit Logs' },
      { segment: 'settings', icon: FiSettings, label: 'Settings' },
    ],
  },
]

const STAFF_LINKS = [
  { staff: 'kitchen', label: 'Kitchen Staff Login', icon: FiCoffee },
  { staff: 'cashier', label: 'Cashier Staff Login', icon: FiBriefcase },
  { staff: 'waiter', label: 'Waiter Staff Login', icon: FiUserCheck },
]

const SUBSCRIPTION_REQUIRED_TOAST =
  'Your trial or plan has ended. Open Subscription to choose a plan and restore access.'

function featureKeyForSegment(segment) {
  const root = segment.split('/')[0]
  if (root === 'pos') return 'orders'
  if (root === 'menu') return 'menu'
  if (root === 'orders') return segment === 'orders/activity' ? 'analytics' : 'orders'
  if (root === 'tables') return 'tables'
  if (root === 'promotions') return 'promotions'
  if (root === 'employees') return 'employees'
  if (root === 'tickets') return 'supportTickets'
  if (root === 'logs') return 'activityLogs'
  if (root === 'settings') return 'accountSettings'
  if (root === 'finance') return 'analytics'
  return null
}

function isNavUnlockedWhenBillingLocked(segment) {
  const root = segment.split('/')[0]
  return root === 'subscription' || root === 'kyc'
}

function NavItem({
  item,
  restaurantBase,
  pendingCount,
  collapsed,
  onClick,
  onTooltip,
  onTooltipLeave,
  locked,
  lockMessage,
  onLockedClick,
}) {
  const showTooltip = (event) => {
    if (!collapsed) return
    const rect = event.currentTarget.getBoundingClientRect()
    onTooltip?.({
      label: item.label,
      count: item.segment === 'orders' ? pendingCount : 0,
      top: rect.top + rect.height / 2,
      left: rect.right + 12,
    })
  }

  const inactiveRow =
    'text-gray-600 hover:bg-surface-50 hover:text-gray-950 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-gray-100'

  if (locked) {
    return (
      <button
        type="button"
        onClick={() => {
          onLockedClick?.()
          onClick?.()
        }}
        onMouseEnter={showTooltip}
        onMouseLeave={onTooltipLeave}
        onFocus={showTooltip}
        onBlur={onTooltipLeave}
        className={`group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-200 ${inactiveRow} cursor-not-allowed opacity-80 ${
          collapsed ? 'justify-center' : ''
        }`}
      >
        <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-gray-400 dark:text-gray-500">
          <item.icon className="h-5 w-5" />
        </span>
        {!collapsed && (
          <>
            <span className="truncate text-sm">{item.label}</span>
            <FiLock className="ml-auto h-4 w-4 flex-shrink-0 text-amber-600 dark:text-amber-400" title={lockMessage || 'Locked'} />
          </>
        )}
        {collapsed && (
          <FiLock className="pointer-events-none absolute -right-0.5 -top-0.5 h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
        )}
      </button>
    )
  }

  return (
    <NavLink
      to={`${restaurantBase}/${item.segment}`}
      end={item.segment === 'orders'}
      onClick={onClick}
      onMouseEnter={showTooltip}
      onMouseLeave={onTooltipLeave}
      onFocus={showTooltip}
      onBlur={onTooltipLeave}
      className={({ isActive }) =>
        `group relative flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 ${
          isActive
            ? 'bg-primary-50 font-semibold text-primary-800 shadow-sm ring-1 ring-primary-100 dark:bg-gray-800 dark:text-gray-100 dark:ring-gray-700'
            : inactiveRow
        } ${collapsed ? 'justify-center' : ''}`
      }
    >
      {({ isActive }) => (
        <>
          {isActive && !collapsed && (
            <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-primary-600" />
          )}
          <span
            className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl transition ${
              isActive
                ? 'bg-white text-primary-700 shadow-sm dark:bg-gray-900 dark:text-gray-100'
                : 'text-gray-500 group-hover:bg-white group-hover:text-primary-700 group-hover:shadow-sm dark:text-gray-400 dark:group-hover:bg-gray-900 dark:group-hover:text-gray-100'
            }`}
          >
            <item.icon className="h-5 w-5" />
          </span>

          {!collapsed && <span className="truncate text-sm">{item.label}</span>}

          {item.segment === 'orders' && pendingCount > 0 && (
            <span
              className={`flex h-5 min-w-[20px] flex-shrink-0 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white ${
                collapsed ? 'absolute -right-1 -top-1' : 'ml-auto'
              }`}
            >
              {pendingCount > 99 ? '99+' : pendingCount}
            </span>
          )}

        </>
      )}
    </NavLink>
  )
}

function Brand({ collapsed, isMobile }) {
  if (collapsed && !isMobile) {
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-600 to-secondary-500 text-white shadow-md">
        <FiAward className="h-5 w-5" />
      </div>
    )
  }

  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-600 to-secondary-500 text-white shadow-md">
        <FiAward className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <h1 className="truncate text-base font-black leading-none text-gray-950 dark:text-gray-100">QR Menu SaaS</h1>
        <p className="mt-1 truncate text-xs font-medium text-gray-500 dark:text-gray-400">Restaurant Portal</p>
      </div>
    </div>
  )
}

function SidebarContent({
  collapsed,
  setCollapsed,
  pendingCount,
  restaurantBase,
  restaurantId,
  hasTenant,
  onClose,
  isMobile,
  onTooltip,
  onTooltipLeave,
  billingLocked,
  isFeatureLocked,
  featureLockedToast,
  user,
  featureFlags,
}) {
  const hideLabels = collapsed && !isMobile

  return (
    <div className="flex h-full flex-col">
      <div
        className={`flex flex-shrink-0 items-center border-b border-gray-100 bg-white/95 dark:border-gray-800 dark:bg-gray-900 ${
          hideLabels ? 'justify-center px-3 py-5' : 'justify-between px-5 py-5'
        }`}
      >
        <Brand collapsed={collapsed} isMobile={isMobile} />

        {!isMobile && (
          <button
            onClick={() => setCollapsed((current) => !current)}
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-surface-50 transition-colors hover:bg-surface-100 dark:bg-gray-800 dark:hover:bg-gray-700"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <FiChevronRight className="h-4 w-4 text-gray-500 dark:text-gray-300" />
            ) : (
              <FiChevronLeft className="h-4 w-4 text-gray-500 dark:text-gray-300" />
            )}
          </button>
        )}

        {isMobile && (
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-surface-50 dark:bg-gray-800"
          >
            <FiX className="h-4 w-4 text-gray-600 dark:text-gray-300" />
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4">
        <div className="space-y-5">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              {!hideLabels && (
                <p className="mb-2 px-3 text-[10px] font-black uppercase tracking-[0.18em] text-gray-400 dark:text-gray-500">
                  {group.label}
                </p>
              )}
              <div className="space-y-1">
                {group.items.map((item) => (
                  <NavItem
                    key={item.segment}
                    item={item}
                    restaurantBase={restaurantBase}
                    pendingCount={pendingCount}
                    collapsed={hideLabels}
                    onClick={isMobile ? onClose : undefined}
                    onTooltip={onTooltip}
                    onTooltipLeave={onTooltipLeave}
                    locked={isFeatureLocked(item.segment)}
                    lockMessage={
                      user?.planAssignmentSource === 'custom' &&
                      featureKeyForSegment(item.segment) &&
                      featureFlags[featureKeyForSegment(item.segment)] === false
                        ? `Locked by assigned plan: ${user?.assignedPlanName || user?.customPlanLabel || 'Custom plan'}`
                        : undefined
                    }
                    onLockedClick={() => featureLockedToast(item.segment)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {hasTenant && restaurantId != null && !hideLabels && (
          <div className="mt-5 border-t border-gray-100 pt-4 dark:border-gray-800">
            <p className="mb-2 px-3 text-[10px] font-black uppercase tracking-[0.18em] text-gray-400 dark:text-gray-500">
              Staff Logins
            </p>
            <div className="space-y-1">
              {STAFF_LINKS.map(({ staff, label, icon: Icon }) => (
                <Link
                  key={staff}
                  to={staffLoginHref(restaurantId, staff)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => {
                    if (isFeatureLocked('employees')) {
                      e.preventDefault()
                      featureLockedToast('employees')
                      return
                    }
                    if (isMobile) onClose?.()
                  }}
                  className="group flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-semibold text-gray-500 transition-colors hover:bg-surface-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-gray-100"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-gray-500 shadow-sm dark:bg-gray-950 dark:text-gray-400">
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <span className="truncate">{label}</span>
                  <FiExternalLink className="ml-auto h-3.5 w-3.5 flex-shrink-0 text-gray-400 group-hover:text-primary-600 dark:text-gray-500 dark:group-hover:text-gray-300" />
                </Link>
              ))}
            </div>
          </div>
        )}

        {hasTenant && restaurantId != null && hideLabels && (
          <div className="mt-4 space-y-1 border-t border-gray-100 pt-4 dark:border-gray-800">
            {STAFF_LINKS.map(({ staff, label, icon: Icon }) => (
              <Link
                key={staff}
                to={staffLoginHref(restaurantId, staff)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                  if (isFeatureLocked('employees')) {
                    e.preventDefault()
                    featureLockedToast('employees')
                  }
                }}
                onMouseEnter={(event) => {
                  const rect = event.currentTarget.getBoundingClientRect()
                  onTooltip?.({
                    label,
                    top: rect.top + rect.height / 2,
                    left: rect.right + 12,
                  })
                }}
                onMouseLeave={onTooltipLeave}
                onFocus={(event) => {
                  const rect = event.currentTarget.getBoundingClientRect()
                  onTooltip?.({
                    label,
                    top: rect.top + rect.height / 2,
                    left: rect.right + 12,
                  })
                }}
                onBlur={onTooltipLeave}
                className="group relative flex items-center justify-center rounded-xl px-3 py-2.5 text-gray-500 transition-colors hover:bg-surface-50 hover:text-primary-700 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-gray-100"
              >
                <Icon className="h-5 w-5" />
              </Link>
            ))}
          </div>
        )}
      </nav>
    </div>
  )
}

const RestaurantSidebar = () => {
  const { user } = useAuth()
  const { socket } = useSocket()
  const { restaurantBase, restaurantId, hasTenant } = useTenantRoutes()
  const [pendingCount, setPendingCount] = useState(0)
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [tooltip, setTooltip] = useState(null)

  const billingLocked =
    user?.role === 'restaurant' && user?.scope !== 'employee' && user?.needsPlanUpgrade === true
  const featureFlags = user?.planFeatureFlags || {}

  const isFeatureLocked = (segment) => {
    if (billingLocked && !isNavUnlockedWhenBillingLocked(segment)) return true
    const key = featureKeyForSegment(segment)
    if (!key) return false
    return user?.planAssignmentSource === 'custom' && featureFlags[key] === false
  }

  const featureLockedToast = (segment) => {
    const assignedName = user?.assignedPlanName || user?.customPlanLabel || 'Custom plan'
    const key = featureKeyForSegment(segment)
    if (key && user?.planAssignmentSource === 'custom' && featureFlags[key] === false) {
      toast.error(`Locked by assigned plan: ${assignedName}. Contact super admin to enable this feature.`)
      return
    }
    toast.error(SUBSCRIPTION_REQUIRED_TOAST)
  }

  const fetchPendingCount = async () => {
    try {
      const res = await api.get('/restaurant/customer-orders', { params: { status: 'pending', page: 1, limit: 1 } })
      setPendingCount(res?.data?.data?.pagination?.total || 0)
    } catch {
      setPendingCount(0)
    }
  }

  useEffect(() => {
    if (billingLocked) {
      setPendingCount(0)
      return
    }
    fetchPendingCount()
  }, [billingLocked])

  useEffect(() => {
    if (billingLocked || !socket) return undefined
    socket.on('new_order', fetchPendingCount)
    socket.on('order_updated', fetchPendingCount)
    return () => {
      socket.off('new_order', fetchPendingCount)
      socket.off('order_updated', fetchPendingCount)
    }
  }, [socket, billingLocked])

  useEffect(() => {
    setMobileOpen(false)
  }, [restaurantBase])

  if (!user || !hasTenant) return null

  const sharedProps = {
    pendingCount,
    restaurantBase,
    restaurantId,
    hasTenant,
    billingLocked,
    isFeatureLocked,
    featureLockedToast,
    user,
    featureFlags,
  }

  return (
    <>
      <div className="fixed left-0 right-0 top-0 z-[60] flex h-14 items-center gap-3 border-b border-gray-200 bg-white px-4 dark:border-gray-800 dark:bg-gray-900 lg:hidden">
        <button
          onClick={() => setMobileOpen(true)}
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-surface-50 dark:bg-gray-800"
        >
          <FiMenu className="h-5 w-5 text-gray-700 dark:text-gray-200" />
        </button>
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary-600 to-secondary-500 text-white">
            <FiAward className="h-4 w-4" />
          </div>
          <h1 className="truncate text-sm font-black text-gray-950 dark:text-gray-100">QR Menu SaaS</h1>
        </div>
        {pendingCount > 0 && (
          <span className="ml-auto flex h-5 min-w-[22px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
            {pendingCount > 99 ? '99+' : pendingCount}
          </span>
        )}
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-[65] bg-black/50 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <div
        className={`fixed left-0 top-0 z-[70] h-full w-72 transform bg-white shadow-2xl transition-transform duration-300 ease-in-out dark:bg-gray-900 lg:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent
          {...sharedProps}
          collapsed={false}
          setCollapsed={setCollapsed}
          onClose={() => setMobileOpen(false)}
          isMobile
          onTooltip={setTooltip}
          onTooltipLeave={() => setTooltip(null)}
        />
      </div>

      <aside
        className={`sticky top-0 hidden h-screen flex-shrink-0 flex-col border-r border-gray-100 bg-white transition-all duration-300 ease-in-out dark:border-gray-800 dark:bg-gray-900 lg:flex ${
          collapsed ? 'w-[110px]' : 'w-72'
        }`}
      >
        <SidebarContent
          {...sharedProps}
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          onClose={() => {}}
          isMobile={false}
          onTooltip={setTooltip}
          onTooltipLeave={() => setTooltip(null)}
        />
      </aside>

      {tooltip && (
        <div
          className="pointer-events-none fixed z-[80] -translate-y-1/2 whitespace-nowrap rounded-xl bg-gray-950 px-3 py-2 text-xs font-semibold text-white shadow-2xl ring-1 ring-white/10"
          style={{ top: tooltip.top, left: tooltip.left }}
        >
          {tooltip.label}
          {tooltip.count > 0 && (
            <span className="ml-2 rounded-full bg-red-500 px-1.5 py-0.5 text-[9px] text-white">
              {tooltip.count > 99 ? '99+' : tooltip.count}
            </span>
          )}
          <span className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-950" />
        </div>
      )}
    </>
  )
}

export default RestaurantSidebar
