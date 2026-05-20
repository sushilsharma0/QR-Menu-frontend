import React, { useEffect, useMemo, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import toast from '@utils/toast'
import {
  FiAward,
  FiBriefcase,
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiCoffee,
  FiExternalLink,
  FiLock,
  FiMenu,
  FiUserCheck,
  FiX,
} from 'react-icons/fi'
import api from '../../services/api'
import { useAuth } from '../../hooks/useAuth'
import { usePlanAccess } from '../../hooks/usePlanAccess'
import { useSocket } from '../../hooks/useSocket'
import { useTenantRoutes } from '../../hooks/useTenantRoutes'
import { useBranch } from '../../context/BranchContext'
import {
  RESTAURANT_NAV_SECTIONS,
  sectionContainsSegment,
} from '../../config/restaurantNavConfig'
import { parseRestaurantPortalPath } from '../../utils/tenantPaths'

const NAV_OPEN_STORAGE_KEY = 'restaurant-nav-sections-open'

function readOpenSections() {
  try {
    const raw = localStorage.getItem(NAV_OPEN_STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    /* ignore */
  }
  return null
}

function writeOpenSections(state) {
  try {
    localStorage.setItem(NAV_OPEN_STORAGE_KEY, JSON.stringify(state))
  } catch {
    /* ignore */
  }
}

function staffLoginHref(restaurantId, staff) {
  const q = new URLSearchParams({ role: 'employee', staff, restaurantId: String(restaurantId) })
  return `/login?${q.toString()}`
}

const STAFF_LINKS = [
  { staff: 'kitchen', label: 'Kitchen Staff Login', icon: FiCoffee },
  { staff: 'cashier', label: 'Cashier Staff Login', icon: FiBriefcase },
  { staff: 'waiter', label: 'Waiter Staff Login', icon: FiUserCheck },
]

function NavItem({
  item,
  restaurantBase,
  pendingCount,
  collapsed,
  nested = false,
  onClick,
  onTooltip,
  onTooltipLeave,
  readOnly,
  lockMessage,
  onReadOnlyClick,
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

  return (
    <NavLink
      to={`${restaurantBase}/${item.segment}`}
      end={item.segment === 'orders'}
      onClick={(event) => {
        if (readOnly) {
          event.preventDefault()
          onReadOnlyClick?.()
          return
        }
        onClick?.(event)
      }}
      onMouseEnter={showTooltip}
      onMouseLeave={onTooltipLeave}
      onFocus={showTooltip}
      onBlur={onTooltipLeave}
      className={({ isActive }) =>
        `group relative flex items-center gap-3 rounded-xl transition-all duration-200 ${
          nested && !collapsed ? 'ml-2 py-2 pl-2 pr-3' : 'px-3 py-2.5'
        } ${
          isActive
            ? readOnly
              ? 'bg-amber-50 font-semibold text-amber-900 ring-1 ring-amber-100 dark:bg-amber-950/30 dark:text-amber-100 dark:ring-amber-900'
              : 'bg-primary-50 font-semibold text-primary-800 shadow-sm ring-1 ring-primary-100 dark:bg-gray-800 dark:text-gray-100 dark:ring-gray-700'
            : inactiveRow
        } ${collapsed ? 'justify-center' : ''} ${readOnly ? 'opacity-90' : ''}`
      }
    >
      {({ isActive }) => (
        <>
          {isActive && !collapsed && !readOnly && (
            <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-primary-600" />
          )}
          {isActive && !collapsed && readOnly && (
            <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-amber-500" />
          )}
          <span
            className={`flex flex-shrink-0 items-center justify-center rounded-xl transition ${
              nested && !collapsed ? 'h-7 w-7' : 'h-9 w-9'
            } ${
              isActive
                ? readOnly
                  ? 'bg-white text-amber-700 shadow-sm dark:bg-gray-900 dark:text-amber-300'
                  : 'bg-white text-primary-700 shadow-sm dark:bg-gray-900 dark:text-gray-100'
                : 'text-gray-500 group-hover:bg-white group-hover:text-primary-700 group-hover:shadow-sm dark:text-gray-400 dark:group-hover:bg-gray-900 dark:group-hover:text-gray-100'
            }`}
          >
            <item.icon className={nested && !collapsed ? 'h-4 w-4' : 'h-5 w-5'} />
          </span>

          {!collapsed && (
            <span className={`truncate ${nested ? 'text-xs' : 'text-sm'}`}>{item.label}</span>
          )}

          {readOnly && !collapsed && (
            <FiLock
              className="ml-auto h-4 w-4 flex-shrink-0 text-amber-600 dark:text-amber-400"
              title={lockMessage || 'Read-only'}
            />
          )}
          {readOnly && collapsed && (
            <FiLock className="pointer-events-none absolute -right-0.5 -top-0.5 h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
          )}

          {item.segment === 'orders' && pendingCount > 0 && !readOnly && (
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

function NavSection({
  section,
  visibleItems,
  restaurantBase,
  collapsed,
  hideLabels,
  isOpen,
  onToggle,
  pendingCount,
  isMobile,
  onClose,
  onTooltip,
  onTooltipLeave,
  isNavLocked,
  lockMessage,
  toastLocked,
}) {
  const SectionIcon = section.icon
  const firstItem = visibleItems[0]
  const anyLocked = visibleItems.some((item) => isNavLocked(item.segment))
  const sectionPending =
    section.id === 'operations' && pendingCount > 0 ? pendingCount : 0

  if (collapsed && hideLabels) {
    return (
      <NavLink
        to={firstItem ? `${restaurantBase}/${firstItem.segment}` : '#'}
        end={firstItem?.segment === 'orders'}
        onClick={(e) => {
          if (firstItem && isNavLocked(firstItem.segment)) {
            e.preventDefault()
            toastLocked(firstItem.segment)
            return
          }
          onClose?.()
        }}
        onMouseEnter={(event) => {
          const rect = event.currentTarget.getBoundingClientRect()
          onTooltip?.({
            label: section.label,
            count: sectionPending,
            top: rect.top + rect.height / 2,
            left: rect.right + 12,
          })
        }}
        onMouseLeave={onTooltipLeave}
        className={({ isActive }) =>
          `group relative flex items-center justify-center rounded-xl px-3 py-2.5 transition ${
            isActive
              ? 'bg-primary-50 text-primary-800 ring-1 ring-primary-100 dark:bg-gray-800 dark:text-gray-100'
              : 'text-gray-600 hover:bg-surface-50 dark:text-gray-300 dark:hover:bg-gray-800'
          }`
        }
      >
        <SectionIcon className="h-5 w-5" />
        {sectionPending > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
            {sectionPending > 9 ? '9+' : sectionPending}
          </span>
        )}
      </NavLink>
    )
  }

  return (
    <div className="pb-1">
      <button
        type="button"
        onClick={onToggle}
        className={`mb-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left transition hover:bg-surface-50 dark:hover:bg-gray-800 ${
          isOpen ? 'text-gray-950 dark:text-gray-100' : 'text-gray-600 dark:text-gray-400'
        }`}
      >
        <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-surface-50 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
          <SectionIcon className="h-4 w-4" />
        </span>
        <span className="flex-1 truncate text-xs font-black uppercase tracking-[0.14em]">
          {section.label}
        </span>
        {sectionPending > 0 && (
          <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
            {sectionPending > 99 ? '99+' : sectionPending}
          </span>
        )}
        {anyLocked && (
          <FiLock className="h-3.5 w-3.5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
        )}
        <FiChevronDown
          className={`h-4 w-4 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      {isOpen && (
        <div className="space-y-0.5 border-l-2 border-gray-100 pl-1 dark:border-gray-800">
          {visibleItems.map((item) => (
            <NavItem
              key={item.segment}
              item={item}
              restaurantBase={restaurantBase}
              pendingCount={pendingCount}
              collapsed={false}
              nested
              onClick={isMobile ? onClose : undefined}
              onTooltip={onTooltip}
              onTooltipLeave={onTooltipLeave}
              readOnly={isNavLocked(item.segment)}
              lockMessage={lockMessage(item.segment)}
              onReadOnlyClick={() => toastLocked(item.segment)}
            />
          ))}
        </div>
      )}
    </div>
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
  isFeatureHidden,
  isNavLocked,
  lockMessage,
  toastLocked,
  isFeatureEnabled,
  kycLocked,
}) {
  const hideLabels = collapsed && !isMobile
  const location = useLocation()
  const activeTail = useMemo(() => {
    const parsed = parseRestaurantPortalPath(location.pathname)
    return parsed?.tail || ''
  }, [location.pathname])

  const [openSections, setOpenSections] = useState(() => {
    const saved = readOpenSections()
    if (saved && typeof saved === 'object') return saved
    const initial = {}
    RESTAURANT_NAV_SECTIONS.forEach((s) => {
      initial[s.id] = s.defaultOpen !== false
    })
    return initial
  })

  useEffect(() => {
    setOpenSections((prev) => {
      let changed = false
      const next = { ...prev }
      RESTAURANT_NAV_SECTIONS.forEach((section) => {
        if (sectionContainsSegment(section, activeTail) && !next[section.id]) {
          next[section.id] = true
          changed = true
        }
      })
      if (changed) writeOpenSections(next)
      return changed ? next : prev
    })
  }, [activeTail])

  const toggleSection = (id) => {
    setOpenSections((prev) => {
      const next = { ...prev, [id]: !prev[id] }
      writeOpenSections(next)
      return next
    })
  }

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
        <div className="space-y-1">
          {RESTAURANT_NAV_SECTIONS.map((section) => {
            const visibleItems = section.items.filter(
              (item) => !isFeatureHidden(item.segment, item.featureKey),
            )
            if (visibleItems.length === 0) return null
            return (
              <NavSection
                key={section.id}
                section={section}
                visibleItems={visibleItems}
                restaurantBase={restaurantBase}
                collapsed={collapsed}
                hideLabels={hideLabels}
                isOpen={Boolean(openSections[section.id])}
                onToggle={() => toggleSection(section.id)}
                pendingCount={pendingCount}
                isMobile={isMobile}
                onClose={onClose}
                onTooltip={onTooltip}
                onTooltipLeave={onTooltipLeave}
                isNavLocked={isNavLocked}
                lockMessage={lockMessage}
                toastLocked={toastLocked}
              />
            )
          })}
        </div>

        {hasTenant && restaurantId != null && !hideLabels && (kycLocked || isFeatureEnabled('employees')) && (
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
                    if (isNavLocked('employees')) {
                      e.preventDefault()
                      toastLocked('employees')
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
                  {isNavLocked('employees') ? (
                    <FiLock className="ml-auto h-3.5 w-3.5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
                  ) : (
                    <FiExternalLink className="ml-auto h-3.5 w-3.5 flex-shrink-0 text-gray-400 group-hover:text-primary-600 dark:text-gray-500 dark:group-hover:text-gray-300" />
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}

        {hasTenant && restaurantId != null && hideLabels && (kycLocked || isFeatureEnabled('employees')) && (
          <div className="mt-4 space-y-1 border-t border-gray-100 pt-4 dark:border-gray-800">
            {STAFF_LINKS.map(({ staff, label, icon: Icon }) => (
              <Link
                key={staff}
                to={staffLoginHref(restaurantId, staff)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                  if (isNavLocked('employees')) {
                    e.preventDefault()
                    toastLocked('employees')
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
  const {
    kycLocked,
    billingLocked,
    isFeatureHidden,
    isNavLocked,
    lockMessage,
    toastLocked,
    isFeatureEnabled,
  } = usePlanAccess()
  const { socket } = useSocket()
  const { restaurantBase, restaurantId, hasTenant } = useTenantRoutes()
  const { selectedBranchId, loading: branchesLoading } = useBranch()
  const [pendingCount, setPendingCount] = useState(0)
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [tooltip, setTooltip] = useState(null)

  const handleToastLocked = (segment) => {
    toast.error(toastLocked(segment))
  }

  const fetchPendingCount = async () => {
    if (!isFeatureEnabled('orders') && !isFeatureEnabled('customerOrders')) {
      setPendingCount(0)
      return
    }
    try {
      const res = await api.get('/restaurant/customer-orders/stats', { skipErrorToast: true })
      const active = res?.data?.data?.active || {}
      const count = Number(active.pending || 0)
      setPendingCount(Number.isFinite(count) ? count : 0)
    } catch {
      try {
        const res = await api.get('/restaurant/customer-orders', {
          params: { status: 'pending', page: 1, limit: 1 },
          skipErrorToast: true,
        })
        setPendingCount(res?.data?.data?.pagination?.total || 0)
      } catch {
        setPendingCount(0)
      }
    }
  }

  useEffect(() => {
    if (billingLocked) {
      setPendingCount(0)
      return
    }
    if (branchesLoading) return
    fetchPendingCount()
  }, [billingLocked, branchesLoading, selectedBranchId, isFeatureEnabled])

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
    kycLocked,
    isFeatureHidden,
    isNavLocked,
    lockMessage,
    toastLocked: handleToastLocked,
    isFeatureEnabled,
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
