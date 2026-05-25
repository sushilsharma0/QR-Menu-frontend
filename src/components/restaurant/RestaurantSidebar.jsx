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
  FiSearch,
  FiUser,
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
  RESTAURANT_QUICK_LINKS,
  RESTAURANT_SECTION_ACCENTS,
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

function matchesNavQuery(label, query) {
  const q = String(query || '').trim().toLowerCase()
  if (!q) return true
  return String(label || '').toLowerCase().includes(q)
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
              : `${accentStyles.itemActive} font-semibold shadow-sm`
            : inactiveRow
        } ${collapsed ? 'justify-center' : ''} ${readOnly ? 'opacity-90' : ''}`
      }
    >
      {({ isActive }) => (
        <>
          {isActive && !collapsed && !readOnly && (
            <span className="absolute left-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-r-full bg-primary-600 shadow-sm shadow-primary-600/40" />
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
  const anyLocked = visibleItems.some((item) => isNavLocked(item.segment))
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
          `group relative flex items-center justify-center rounded-2xl px-3 py-2.5 ring-1 transition ${
            isActive || hasActiveChild
              ? `${accent.sectionIconActive} shadow-sm`
              : `${accent.sectionIcon} hover:shadow-sm`
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

  if (visibleItems.length === 1) {
    return (
      <NavItem
        item={firstItem}
        restaurantBase={restaurantBase}
        pendingCount={pendingCount}
        deliveryDispatchCount={deliveryDispatchCount}
        collapsed={false}
        onClick={isMobile ? onClose : undefined}
        onTooltip={onTooltip}
        onTooltipLeave={onTooltipLeave}
        readOnly={isNavLocked(firstItem.segment)}
        lockMessage={lockMessage(firstItem.segment)}
        onReadOnlyClick={() => toastLocked(firstItem.segment)}
        accent={accent}
      />
    )
  }

  return (
    <div
      className={`rounded-2xl border transition-colors ${
        isOpen ? `${accent.panel} shadow-sm` : 'border-transparent'
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        className={`flex w-full items-center gap-2.5 rounded-2xl px-3 py-2.5 text-left transition hover:bg-white/60 dark:hover:bg-gray-800/50 ${
          isOpen || hasActiveChild ? 'text-gray-950 dark:text-gray-100' : 'text-gray-600 dark:text-gray-400'
        }`}
      >
        <span
          className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ring-1 ${
            hasActiveChild ? accent.sectionIconActive : accent.sectionIcon
          }`}
        >
          <SectionIcon className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-xs font-black uppercase tracking-[0.12em]">
            {section.label}
          </span>
          {section.description && (
            <span className="block truncate text-[10px] font-semibold text-gray-500 dark:text-gray-400">
              {section.description}
            </span>
          )}
        </span>
        {sectionBadge && (
          <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-black text-white shadow-sm">
            {sectionBadge}
          </span>
        )}
        {anyLocked && (
          <FiLock className="h-3.5 w-3.5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
        )}
        <FiChevronDown
          className={`h-4 w-4 flex-shrink-0 text-gray-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>
      {isOpen && (
        <div className={`mx-2 mb-2 space-y-0.5 border-l-2 pl-2 ${accent.rail}`}>
          {visibleItems.map((item) => (
            <NavItem
              key={item.segment}
              item={item}
              restaurantBase={restaurantBase}
              pendingCount={pendingCount}
              deliveryDispatchCount={deliveryDispatchCount}
              collapsed={false}
              nested
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

function QuickLinks({
  restaurantBase,
  pendingCount,
  deliveryDispatchCount,
  isFeatureHidden,
  isNavLocked,
  toastLocked,
  isMobile,
  onClose,
}) {
  const links = RESTAURANT_QUICK_LINKS.filter(
    (item) => !isFeatureHidden(item.segment, item.featureKey),
  )
  if (links.length === 0) return null

  return (
    <div className="mb-4 grid grid-cols-2 gap-2">
      {links.map((item) => {
        const locked = isNavLocked(item.segment)
        const badge = navBadgeCount(item.segment, pendingCount, deliveryDispatchCount)
        return (
          <NavLink
            key={item.segment}
            to={`${restaurantBase}/${item.segment}`}
            end={item.segment === 'orders'}
            onClick={(e) => {
              if (locked) {
                e.preventDefault()
                toastLocked(item.segment)
                return
              }
              if (isMobile) onClose?.()
            }}
            className={({ isActive }) =>
              `group relative flex flex-col items-center gap-1.5 rounded-2xl border px-2 py-3 text-center transition active:scale-[0.98] ${
                isActive
                  ? 'border-primary-200 bg-gradient-to-br from-primary-600 to-primary-700 text-white shadow-md shadow-primary-900/25'
                  : 'border-gray-100 bg-white text-gray-700 shadow-sm hover:border-primary-100 hover:shadow-md dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200 dark:hover:border-primary-800/50'
              }`
            }
          >
            <span
              className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                locked ? 'opacity-80' : ''
              }`}
            >
              <item.icon className="h-5 w-5" />
            </span>
            <span className="text-[11px] font-black leading-tight">{item.label}</span>
            {formatBadge(badge) && !locked && (
              <span className="absolute right-2 top-2 rounded-full bg-red-500 px-1.5 text-[9px] font-black text-white">
                {formatBadge(badge)}
              </span>
            )}
            {locked && (
              <FiLock className="absolute right-2 top-2 h-3.5 w-3.5 text-amber-500" />
            )}
          </NavLink>
        )
      })}
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
      <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-primary-600 to-secondary-500 text-white shadow-lg shadow-primary-900/20 ring-2 ring-white dark:ring-gray-800">
        {logo ? logoMark : <FiAward className="h-5 w-5" />}
      </div>
    )
  }

  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-primary-600 to-secondary-500 text-white shadow-lg shadow-primary-900/20 ring-2 ring-white dark:ring-gray-800">
        {logoMark}
      </div>
      <div className="min-w-0">
        <h1 className="truncate text-[15px] font-bold leading-tight text-gray-950 dark:text-gray-100">
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
}) {
  const hideLabels = collapsed && !isMobile
  const routerLocation = useLocation()
  const activeTail = useMemo(() => {
    const parsed = parseRestaurantPortalPath(routerLocation.pathname)
    return parsed?.tail || ''
  }, [routerLocation.pathname])

  const [openSections, setOpenSections] = useState(() => {
    const saved = readOpenSections()
    if (saved && typeof saved === 'object') return saved
    const initial = {}
    RESTAURANT_NAV_SECTIONS.forEach((s) => {
      initial[s.id] = s.defaultOpen !== false
    })
    return initial
  })
  const [navQuery, setNavQuery] = useState('')

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

  const expandAllSections = () => {
    const next = {}
    RESTAURANT_NAV_SECTIONS.forEach((s) => {
      next[s.id] = true
    })
    setOpenSections(next)
    writeOpenSections(next)
  }

  const collapseAllSections = () => {
    const next = {}
    RESTAURANT_NAV_SECTIONS.forEach((s) => {
      next[s.id] = false
    })
    setOpenSections(next)
    writeOpenSections(next)
  }

  const filteredSections = useMemo(() => {
    const q = navQuery.trim()
    return RESTAURANT_NAV_SECTIONS.map((section) => {
      const visibleItems = section.items.filter(
        (item) =>
          !isFeatureHidden(item.segment, item.featureKey) && matchesNavQuery(item.label, q),
      )
      return { section, visibleItems }
    }).filter(({ visibleItems }) => visibleItems.length > 0)
  }, [navQuery, isFeatureHidden])

  return (
    <div className="flex h-full flex-col">
      <div
        className={`flex flex-shrink-0 items-center border-b border-gray-100/80 bg-white/90 backdrop-blur-md dark:border-gray-800 dark:bg-gray-900/95 ${
          hideLabels ? 'justify-center px-3 py-5' : 'justify-between px-5 py-5'
        }`}
      >
        <Brand collapsed={collapsed} isMobile={isMobile} user={user} />

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

      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300/80 dark:[&::-webkit-scrollbar-thumb]:bg-gray-600">
        {!hideLabels && (
          <>
            <QuickLinks
              restaurantBase={restaurantBase}
              pendingCount={pendingCount}
              deliveryDispatchCount={deliveryDispatchCount}
              isFeatureHidden={isFeatureHidden}
              isNavLocked={isNavLocked}
              toastLocked={toastLocked}
              isMobile={isMobile}
              onClose={onClose}
            />
            <div className="relative mb-3">
              <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                value={navQuery}
                onChange={(e) => setNavQuery(e.target.value)}
                placeholder="Search menu…"
                className="w-full rounded-2xl border border-gray-100 bg-white py-2.5 pl-9 pr-3 text-sm font-semibold text-gray-800 shadow-sm outline-none transition placeholder:text-gray-400 focus:border-primary-200 focus:ring-2 focus:ring-primary-100 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-100 dark:focus:border-primary-800 dark:focus:ring-primary-900/40"
              />
            </div>
            <div className="mb-3 flex items-center justify-between px-1">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-gray-400 dark:text-gray-500">
                Manage
              </p>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={expandAllSections}
                  className="rounded-lg px-2 py-1 text-[10px] font-bold text-gray-500 transition hover:bg-white hover:text-primary-700 dark:hover:bg-gray-800 dark:hover:text-primary-300"
                >
                  Expand
                </button>
                <span className="text-gray-300 dark:text-gray-600">·</span>
                <button
                  type="button"
                  onClick={collapseAllSections}
                  className="rounded-lg px-2 py-1 text-[10px] font-bold text-gray-500 transition hover:bg-white hover:text-primary-700 dark:hover:bg-gray-800 dark:hover:text-primary-300"
                >
                  Collapse
                </button>
              </div>
            </div>
          </>
        )}

        <div className="space-y-2">
          {filteredSections.length === 0 && navQuery.trim() ? (
            <p className="rounded-2xl border border-dashed border-gray-200 px-4 py-6 text-center text-xs font-semibold text-gray-500 dark:border-gray-700 dark:text-gray-400">
              No pages match &ldquo;{navQuery.trim()}&rdquo;
            </p>
          ) : null}
          {filteredSections.map(({ section, visibleItems }) => (
            <NavSection
              key={section.id}
              section={section}
              visibleItems={visibleItems}
              restaurantBase={restaurantBase}
              collapsed={collapsed}
              hideLabels={hideLabels}
              isOpen={navQuery.trim() ? true : Boolean(openSections[section.id])}
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

      {user && !hideLabels && (
        <div className="flex-shrink-0 border-t border-gray-100/80 bg-white/90 p-4 backdrop-blur-md dark:border-gray-800 dark:bg-gray-900/95">
          <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-br from-surface-50 to-white p-3 ring-1 ring-gray-100 dark:from-gray-800/80 dark:to-gray-900 dark:ring-gray-800">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-primary-600 to-secondary-500 text-sm font-bold text-white shadow-md">
              {user?.logo || user?.profilePhoto ? (
                <img
                  src={user.logo || user.profilePhoto}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                user?.name?.charAt(0) || <FiUser className="h-4 w-4" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-gray-950 dark:text-gray-100">{user.name}</p>
              <p className="truncate text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                Restaurant owner
              </p>
            </div>
          </div>
        </div>
      )}

      {user && hideLabels && (
        <div className="flex flex-shrink-0 justify-center border-t border-gray-100 p-4 dark:border-gray-800">
          <div
            tabIndex={0}
            className="flex h-10 w-10 cursor-default items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-primary-600 to-secondary-500 text-sm font-bold text-white shadow-md"
            onMouseEnter={(e) => {
              const rect = e.currentTarget.getBoundingClientRect()
              onTooltip?.({
                label: user.name,
                top: rect.top + rect.height / 2,
                left: rect.right + 12,
              })
            }}
            onMouseLeave={onTooltipLeave}
          >
            {user?.name?.charAt(0) || 'R'}
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
        className={`fixed left-0 top-0 z-[70] h-full w-[280px] transform bg-gradient-to-b from-white via-white to-surface-50 shadow-2xl transition-transform duration-300 ease-in-out dark:from-gray-900 dark:via-gray-900 dark:to-gray-950 lg:hidden ${
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
        className={`sticky top-0 hidden h-screen flex-shrink-0 flex-col border-r border-gray-100/80 bg-gradient-to-b from-white via-white to-surface-50/80 shadow-[4px_0_24px_-12px_rgba(15,23,42,0.08)] transition-all duration-300 ease-in-out dark:border-gray-800 dark:from-gray-900 dark:via-gray-900 dark:to-gray-950 lg:flex ${
          collapsed ? 'w-[112px]' : 'w-[280px]'
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
