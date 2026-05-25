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
import { PLATFORM_LOGO_SRC } from '../../constants/platformBrand'
import { useAuth } from '../../hooks/useAuth'
import { usePlanAccess } from '../../hooks/usePlanAccess'
import { useSocket } from '../../hooks/useSocket'
import { useTenantRoutes } from '../../hooks/useTenantRoutes'
import { useBranch } from '../../context/BranchContext'
import {
  RESTAURANT_NAV_SECTIONS,
  RESTAURANT_SECTION_ACCENTS,
  sectionContainsSegment,
} from '../../config/restaurantNavConfig'
import { parseRestaurantPortalPath } from '../../utils/tenantPaths'
import { resolveMediaUrl } from '../../utils/mediaUrl'

const SIDEBAR_WIDTH_STORAGE_KEY = 'restaurant-sidebar-width'
const SIDEBAR_DEFAULT_WIDTH = 280
const SIDEBAR_MIN_WIDTH = 240
const SIDEBAR_MAX_WIDTH = 420
const SIDEBAR_COLLAPSED_WIDTH = 112

function clampSidebarWidth(value) {
  const width = Number(value)
  if (!Number.isFinite(width)) return SIDEBAR_DEFAULT_WIDTH
  return Math.min(SIDEBAR_MAX_WIDTH, Math.max(SIDEBAR_MIN_WIDTH, Math.round(width)))
}

function readSidebarWidth() {
  try {
    return clampSidebarWidth(localStorage.getItem(SIDEBAR_WIDTH_STORAGE_KEY))
  } catch {
    return SIDEBAR_DEFAULT_WIDTH
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

function navBadgeCount(segment, pendingCount, deliveryDispatchCount) {
  if (segment === 'orders') return pendingCount
  if (segment === 'orders/dispatch') return deliveryDispatchCount
  return 0
}

function formatBadge(value) {
  const count = Number(value || 0)
  if (count <= 0) return null
  return count > 99 ? '99+' : String(count)
}

function sectionAccent(section) {
  return RESTAURANT_SECTION_ACCENTS[section.accentKey || section.id] || RESTAURANT_SECTION_ACCENTS.overview
}

function NavItem({
  item,
  restaurantBase,
  pendingCount,
  deliveryDispatchCount = 0,
  collapsed,
  nested = false,
  onClick,
  onTooltip,
  onTooltipLeave,
  readOnly,
  lockMessage,
  onReadOnlyClick,
  accent,
}) {
  const accentStyles = accent || RESTAURANT_SECTION_ACCENTS.overview
  const showTooltip = (event) => {
    if (!collapsed) return
    const rect = event.currentTarget.getBoundingClientRect()
    onTooltip?.({
      label: item.label,
      count: navBadgeCount(item.segment, pendingCount, deliveryDispatchCount),
      top: rect.top + rect.height / 2,
      left: rect.right + 12,
    })
  }

  const badgeCount = navBadgeCount(item.segment, pendingCount, deliveryDispatchCount)

  const inactiveRow =
    'text-gray-600 hover:bg-white hover:text-gray-950 hover:shadow-sm dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-gray-100'

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
          nested && !collapsed ? 'ml-2 py-2 pl-2 pr-3' : 'px-3 py-2'
        } ${
          isActive
            ? readOnly
              ? 'bg-amber-50 font-semibold text-amber-900 ring-1 ring-amber-100 dark:bg-amber-950/30 dark:text-amber-100 dark:ring-amber-900'
              : `${accentStyles.itemActive} font-semibold shadow-sm ring-1 ring-white/70 dark:ring-gray-700`
            : inactiveRow
        } ${collapsed ? 'justify-center' : ''} ${readOnly ? 'opacity-90' : ''}`
      }
    >
      {({ isActive }) => (
        <>
          {isActive && !collapsed && !readOnly && (
            <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-primary-600 shadow-sm shadow-primary-600/40" />
          )}
          {isActive && !collapsed && readOnly && (
            <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-amber-500" />
          )}
          <span
            className={`flex flex-shrink-0 items-center justify-center rounded-xl transition ${
              nested && !collapsed ? 'h-7 w-7' : 'h-8 w-8'
            } ${
              isActive
                ? readOnly
                  ? 'bg-white text-amber-700 shadow-sm dark:bg-gray-900 dark:text-amber-300'
                  : 'bg-white text-primary-700 shadow-sm dark:bg-gray-900 dark:text-gray-100'
                : 'text-gray-500 group-hover:bg-white group-hover:text-primary-700 group-hover:shadow-sm dark:text-gray-400 dark:group-hover:bg-gray-900 dark:group-hover:text-gray-100'
            }`}
          >
            <item.icon className={nested && !collapsed ? 'h-4 w-4' : 'h-[18px] w-[18px]'} />
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

          {formatBadge(badgeCount) && !readOnly && (
            <span
              className={`inline-flex min-w-5 flex-shrink-0 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-black leading-5 text-white shadow-sm ${
                collapsed ? 'absolute -right-1 -top-1' : 'ml-auto'
              }`}
            >
              {formatBadge(badgeCount)}
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
  deliveryDispatchCount = 0,
  isMobile,
  onClose,
  onTooltip,
  onTooltipLeave,
  isNavLocked,
  lockMessage,
  toastLocked,
  activeTail,
}) {
  const SectionIcon = section.icon
  const firstItem = visibleItems[0]
  const accent = sectionAccent(section)
  const hasActiveChild = sectionContainsSegment(section, activeTail)
  const sectionPending =
    section.id === 'operations'
      ? visibleItems.reduce((sum, item) => sum + navBadgeCount(item.segment, pendingCount, deliveryDispatchCount), 0)
      : 0
  const sectionBadge = formatBadge(sectionPending)

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
            isActive || hasActiveChild
              ? 'bg-primary-600 text-white shadow-md shadow-primary-900/20'
              : 'text-gray-500 hover:bg-white hover:text-primary-700 hover:shadow-sm dark:text-gray-300 dark:hover:bg-gray-800'
          }`
        }
      >
        {({ isActive }) => (
          <>
            <SectionIcon className="h-5 w-5" />
            {hasActiveChild && !isActive && (
              <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-primary-600 ring-2 ring-white dark:ring-gray-900" />
            )}
            {sectionBadge && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-black text-white">
                {sectionBadge}
              </span>
            )}
          </>
        )}
      </NavLink>
    )
  }

  return (
    <div className="space-y-1">
      <button
        type="button"
        data-no-spinner="true"
        onClick={onToggle}
        className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left transition ${
          hasActiveChild
            ? 'bg-white text-gray-950 shadow-sm ring-1 ring-gray-100 dark:bg-gray-900 dark:text-gray-100 dark:ring-gray-800'
            : 'text-gray-500 hover:bg-white hover:text-gray-950 hover:shadow-sm dark:text-gray-400 dark:hover:bg-gray-900 dark:hover:text-gray-100'
        }`}
      >
        <span className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg ${hasActiveChild ? 'bg-primary-600 text-white' : 'bg-white text-gray-500 ring-1 ring-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:ring-gray-700'}`}>
          <SectionIcon className="h-3.5 w-3.5" />
        </span>
        <p className="min-w-0 flex-1 truncate text-[10px] font-black uppercase tracking-[0.18em] text-gray-400 dark:text-gray-500">
          {section.label}
        </p>
        {sectionBadge && (
          <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[9px] font-black text-white shadow-sm">
            {sectionBadge}
          </span>
        )}
        <FiChevronDown
          className={`h-4 w-4 flex-shrink-0 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      {isOpen && (
        <div className="space-y-0.5 pl-2">
          {visibleItems.map((item) => (
            <NavItem
              key={item.segment}
              item={item}
              restaurantBase={restaurantBase}
              pendingCount={pendingCount}
              deliveryDispatchCount={deliveryDispatchCount}
              collapsed={false}
              nested={visibleItems.length > 1}
              onClick={isMobile ? onClose : undefined}
              onTooltip={onTooltip}
              onTooltipLeave={onTooltipLeave}
              readOnly={isNavLocked(item.segment)}
              lockMessage={lockMessage(item.segment)}
              onReadOnlyClick={() => toastLocked(item.segment)}
              accent={accent}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function Brand({ collapsed, isMobile, user }) {
  const title = user?.restaurantName || user?.name || 'QR Restro Nepal'
  const logo = user?.logo || user?.profilePhoto || user?.profileImage

  const logoMark = logo ? (
    <img src={logo} alt="" className="h-full w-full object-cover" />
  ) : (
    <FiCoffee className="h-5 w-5" />
  )

  if (collapsed && !isMobile) {
    return (
      <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-2xl bg-primary-600 text-white shadow-md shadow-primary-900/20 ring-1 ring-white dark:ring-gray-800">
        {logo ? logoMark : <FiAward className="h-5 w-5" />}
      </div>
    )
  }

  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-primary-600 text-white shadow-md shadow-primary-900/20 ring-1 ring-white dark:ring-gray-800">
        {logoMark}
      </div>
      <div className="min-w-0">
        <h1 className="truncate text-sm font-black leading-tight text-gray-950 dark:text-gray-100">
          {title}
        </h1>
        <p className="mt-0.5 truncate text-[11px] font-semibold text-gray-500 dark:text-gray-400">
          Restaurant portal
        </p>
      </div>
    </div>
  )
}

function SidebarContent({
  collapsed,
  setCollapsed,
  pendingCount,
  deliveryDispatchCount = 0,
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
  user,
  platformBrand,
}) {
  const hideLabels = collapsed && !isMobile
  const routerLocation = useLocation()
  const activeTail = useMemo(() => {
    const parsed = parseRestaurantPortalPath(routerLocation.pathname)
    return parsed?.tail || ''
  }, [routerLocation.pathname])
  const [openSections, setOpenSections] = useState(() => {
    const initial = {}
    RESTAURANT_NAV_SECTIONS.forEach((section) => {
      initial[section.id] = section.defaultOpen !== false
    })
    return initial
  })

  const filteredSections = useMemo(() => {
    return RESTAURANT_NAV_SECTIONS.map((section) => {
      const visibleItems = section.items.filter(
        (item) => !isFeatureHidden(item.segment, item.featureKey),
      )
      return { section, visibleItems }
    }).filter(({ visibleItems }) => visibleItems.length > 0)
  }, [isFeatureHidden])

  useEffect(() => {
    setOpenSections((prev) => {
      const activeSection = RESTAURANT_NAV_SECTIONS.find((section) =>
        sectionContainsSegment(section, activeTail),
      )
      if (!activeSection || prev[activeSection.id]) return prev
      return { ...prev, [activeSection.id]: true }
    })
  }, [activeTail])

  const toggleSection = (id) => {
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div
        className={`flex flex-shrink-0 items-center border-b border-gray-100/80 bg-white/95 backdrop-blur-md dark:border-gray-800 dark:bg-gray-900/95 ${
          hideLabels ? 'justify-center px-3 py-4' : 'justify-between px-4 py-4'
        }`}
      >
        <Brand collapsed={collapsed} isMobile={isMobile} user={user} />

        {!isMobile && (
          <button
            onClick={() => setCollapsed((current) => !current)}
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-white text-gray-500 shadow-sm ring-1 ring-gray-100 transition-colors hover:bg-surface-50 hover:text-gray-900 dark:bg-gray-800 dark:text-gray-300 dark:ring-gray-700 dark:hover:bg-gray-700"
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
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700"
          >
            <FiX className="h-4 w-4 text-gray-600 dark:text-gray-300" />
          </button>
        )}
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-3 py-3 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300/80 dark:[&::-webkit-scrollbar-thumb]:bg-gray-600">
        {!hideLabels && (
          <div className="mb-3 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-xs font-black uppercase tracking-[0.16em] text-primary-700 dark:text-primary-300">
                  Workspace
                </p>
                <p className="mt-0.5 truncate text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                  Orders, menu, team and reports
                </p>
              </div>
              {formatBadge(pendingCount) && (
                <span className="flex h-8 min-w-8 items-center justify-center rounded-xl bg-red-500 px-2 text-xs font-black text-white shadow-sm">
                  {formatBadge(pendingCount)}
                </span>
              )}
            </div>
          </div>
        )}

        <div className={hideLabels ? 'space-y-1' : 'space-y-3'}>
          {filteredSections.map(({ section, visibleItems }) => (
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
              deliveryDispatchCount={deliveryDispatchCount}
              isMobile={isMobile}
              onClose={onClose}
              onTooltip={onTooltip}
              onTooltipLeave={onTooltipLeave}
              isNavLocked={isNavLocked}
              lockMessage={lockMessage}
              toastLocked={toastLocked}
              activeTail={activeTail}
            />
          ))}
        </div>

        {hasTenant && restaurantId != null && !hideLabels && (kycLocked || isFeatureEnabled('employees')) && (
          <div className="mt-5 rounded-2xl border border-gray-100 bg-white/80 p-3 shadow-sm dark:border-gray-800 dark:bg-gray-900/80">
            <p className="mb-2 px-1 text-[10px] font-black uppercase tracking-[0.16em] text-gray-400 dark:text-gray-500">
              Staff portals
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
                  className="group flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-semibold text-gray-600 transition-colors hover:bg-surface-50 hover:text-gray-950 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-gray-100"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-surface-50 text-gray-600 ring-1 ring-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:ring-gray-700">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="truncate">{label}</span>
                  {isNavLocked('employees') ? (
                    <FiLock className="ml-auto h-3.5 w-3.5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
                  ) : (
                    <FiExternalLink className="ml-auto h-3.5 w-3.5 flex-shrink-0 text-gray-400 group-hover:text-primary-600 dark:text-gray-500 dark:group-hover:text-primary-300" />
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

      {platformBrand && !hideLabels && (
        <div className="flex-shrink-0 border-t border-gray-100/80 bg-white/90 p-4 backdrop-blur-md dark:border-gray-800 dark:bg-gray-900/95">
          <div className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-gray-100 dark:bg-gray-900 dark:ring-gray-800">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary-600 text-sm font-bold text-white shadow-md">
              {platformBrand.logo ? (
                <img
                  src={platformBrand.logo}
                  alt={platformBrand.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                platformBrand.name?.charAt(0) || <FiAward className="h-4 w-4" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-black text-gray-950 dark:text-gray-100">{platformBrand.name}</p>
              <p className="truncate text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                {platformBrand.subtitle}
              </p>
            </div>
          </div>
        </div>
      )}

      {platformBrand && hideLabels && (
        <div className="flex flex-shrink-0 justify-center border-t border-gray-100 p-4 dark:border-gray-800">
          <div
            tabIndex={0}
            className="flex h-10 w-10 cursor-default items-center justify-center overflow-hidden rounded-xl bg-primary-600 text-sm font-bold text-white shadow-md"
            onMouseEnter={(e) => {
              const rect = e.currentTarget.getBoundingClientRect()
              onTooltip?.({
                label: platformBrand.name,
                top: rect.top + rect.height / 2,
                left: rect.right + 12,
              })
            }}
            onMouseLeave={onTooltipLeave}
          >
            {platformBrand.logo ? (
              <img src={platformBrand.logo} alt={platformBrand.name} className="h-full w-full object-cover" />
            ) : (
              platformBrand.name?.charAt(0) || 'Q'
            )}
          </div>
        </div>
      )}
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
  const [deliveryDispatchCount, setDeliveryDispatchCount] = useState(0)
  const [collapsed, setCollapsed] = useState(false)
  const [sidebarWidth, setSidebarWidth] = useState(readSidebarWidth)
  const [isResizing, setIsResizing] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [tooltip, setTooltip] = useState(null)
  const [platformBrand, setPlatformBrand] = useState({
    name: 'QR Restro Nepal',
    subtitle: 'Main website',
    logo: PLATFORM_LOGO_SRC,
  })

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

  const fetchDeliveryDispatchCount = async () => {
    if (!isFeatureEnabled('orders')) {
      setDeliveryDispatchCount(0)
      return
    }
    try {
      const res = await api.get('/restaurant/insights/delivery-dispatch', {
        params: { status: 'active' },
        skipErrorToast: true,
      })
      const count = Number(res?.data?.data?.activeCount ?? res?.data?.data?.orders?.length ?? 0)
      setDeliveryDispatchCount(Number.isFinite(count) ? count : 0)
    } catch {
      setDeliveryDispatchCount(0)
    }
  }

  const refreshNavCounts = () => {
    fetchPendingCount()
    fetchDeliveryDispatchCount()
  }

  useEffect(() => {
    if (billingLocked) {
      setPendingCount(0)
      setDeliveryDispatchCount(0)
      return
    }
    if (branchesLoading) return
    refreshNavCounts()
  }, [billingLocked, branchesLoading, selectedBranchId, isFeatureEnabled])

  useEffect(() => {
    if (billingLocked || !socket) return undefined
    socket.on('new_order', refreshNavCounts)
    socket.on('order_updated', refreshNavCounts)
    return () => {
      socket.off('new_order', refreshNavCounts)
      socket.off('order_updated', refreshNavCounts)
    }
  }, [socket, billingLocked])

  useEffect(() => {
    setMobileOpen(false)
  }, [restaurantBase])

  useEffect(() => {
    let alive = true
    api
      .get('/customer/landing/site-config', { skipErrorToast: true })
      .then((res) => {
        if (!alive) return
        const data = res?.data?.data || {}
        setPlatformBrand({
          name: data.softwareName || 'QR Restro Nepal',
          subtitle: data.brandSubtitle || 'Main website',
          logo: resolveMediaUrl(data.landingLogo) || PLATFORM_LOGO_SRC,
        })
      })
      .catch(() => {
        if (!alive) return
        setPlatformBrand({
          name: 'QR Restro Nepal',
          subtitle: 'Main website',
          logo: PLATFORM_LOGO_SRC,
        })
      })

    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_WIDTH_STORAGE_KEY, String(sidebarWidth))
    } catch {
      /* ignore */
    }
  }, [sidebarWidth])

  useEffect(() => {
    if (!isResizing) return undefined

    const handleMouseMove = (event) => {
      setSidebarWidth(clampSidebarWidth(event.clientX))
    }

    const stopResizing = () => {
      setIsResizing(false)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', stopResizing)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', stopResizing)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [isResizing])

  const startResizing = (event) => {
    if (collapsed) return
    event.preventDefault()
    setIsResizing(true)
  }

  const resetSidebarWidth = () => {
    setSidebarWidth(SIDEBAR_DEFAULT_WIDTH)
  }

  if (!user || !hasTenant) return null

  const sharedProps = {
    pendingCount,
    deliveryDispatchCount,
    restaurantBase,
    restaurantId,
    hasTenant,
    kycLocked,
    isFeatureHidden,
    isNavLocked,
    lockMessage,
    toastLocked: handleToastLocked,
    isFeatureEnabled,
    user,
    platformBrand,
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
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary-600 text-white">
            <FiCoffee className="h-5 w-5" />
          </div>
          <h1 className="truncate text-sm font-semibold text-gray-950 dark:text-gray-100">QR Restro Nepal</h1>
        </div>
        {pendingCount > 0 && (
          <span className="ml-auto flex h-5 min-w-[22px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
            {pendingCount > 99 ? '99+' : pendingCount}
          </span>
        )}
      </div>

      {mobileOpen && (
        <button
          type="button"
          aria-label="Close restaurant navigation"
          className="fixed inset-0 z-[65] bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div
        className={`fixed left-0 top-0 z-[70] h-full w-[280px] transform bg-surface-50 shadow-2xl transition-transform duration-300 ease-in-out dark:bg-gray-950 lg:hidden ${
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
        className={`sticky top-0 hidden h-screen flex-shrink-0 flex-col border-r border-gray-100 bg-surface-50 shadow-[4px_0_24px_-12px_rgba(15,23,42,0.08)] dark:border-gray-800 dark:bg-gray-950 lg:flex relative ${
          isResizing ? '' : 'transition-all duration-300 ease-in-out'
        }`}
        style={{ width: collapsed ? SIDEBAR_COLLAPSED_WIDTH : sidebarWidth }}
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
        {!collapsed && (
          <button
            type="button"
            aria-label="Resize restaurant sidebar"
            title="Drag to resize. Double-click to reset."
            onMouseDown={startResizing}
            onDoubleClick={resetSidebarWidth}
            className={`group absolute -right-1 top-0 h-full w-2 cursor-col-resize transition ${
              isResizing ? 'bg-primary-500/30' : 'bg-transparent hover:bg-primary-500/20'
            }`}
          >
            <span className="pointer-events-none absolute left-1/2 top-1/2 h-16 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gray-300 opacity-0 transition group-hover:opacity-100 dark:bg-gray-600" />
          </button>
        )}
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
