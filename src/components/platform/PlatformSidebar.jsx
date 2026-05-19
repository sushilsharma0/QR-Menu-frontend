import React, { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  FiAward,
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiMenu,
  FiX,
} from 'react-icons/fi'
import { useAuth } from '../../hooks/useAuth'
import api from '../../services/api'
import {
  PLATFORM_NAV_SECTIONS,
  sectionContainsPath,
} from '../../config/platformNavConfig'

const NAV_OPEN_STORAGE_KEY = 'platform-nav-sections-open'
const COUNT_REFRESH_MS = 30000

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

function isPlatformNavItemActive(item, location) {
  const pathname = location.pathname.replace(/\/+$/, '')
  const [pathOnly, itemSearch = ''] = String(item.path || '').split('?')
  const base = pathOnly.replace(/\/+$/, '')

  if (base === '/platform/dashboard') return pathname === base

  if (itemSearch) {
    const want = new URLSearchParams(itemSearch)
    const have = new URLSearchParams(location.search || '')
    for (const [key, value] of want.entries()) {
      if (have.get(key) !== value) return false
    }
    return pathname === base
  }

  if (base === '/platform/cms') {
    if (pathname !== base) return false
    const tab = new URLSearchParams(location.search || '').get('tab')
    return !tab || tab === 'blocks' || tab === 'guide'
  }

  return pathname === base || pathname.startsWith(`${base}/`)
}

function formatBadge(value) {
  const count = Number(value || 0)
  if (count <= 0) return null
  return count > 99 ? '99+' : String(count)
}

function Badge({ value, collapsed }) {
  const label = formatBadge(value)
  if (!label) return null
  return (
    <span
      className={`inline-flex min-w-5 items-center justify-center rounded-full bg-primary-600 px-1.5 text-[10px] font-black leading-5 text-white shadow-sm ${
        collapsed ? 'absolute -right-1 -top-1' : 'ml-auto'
      }`}
    >
      {label}
    </span>
  )
}

function PlatformNavItem({ item, collapsed, nested = false, badgeCounts = {}, onClick, onTooltip, onTooltipLeave }) {
  const location = useLocation()
  const badgeValue = item.badgeKey ? badgeCounts[item.badgeKey] : 0
  const inactiveRow =
    'text-gray-600 hover:bg-surface-50 hover:text-gray-950 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-gray-100'

  const showTooltip = (event) => {
    if (!collapsed) return
    const rect = event.currentTarget.getBoundingClientRect()
    onTooltip?.({
      label: item.label,
      top: rect.top + rect.height / 2,
      left: rect.right + 12,
    })
  }

  return (
    <NavLink
      to={item.path}
      end={item.path === '/platform/dashboard'}
      onClick={onClick}
      onMouseEnter={showTooltip}
      onMouseLeave={onTooltipLeave}
      onFocus={showTooltip}
      onBlur={onTooltipLeave}
      className={() => {
        const isActive = isPlatformNavItemActive(item, location)
        return `group relative flex items-center gap-3 rounded-xl transition-all duration-200 ${
          nested ? 'px-3 py-2' : 'px-3 py-2.5'
        } ${
          isActive
            ? 'bg-primary-50 font-semibold text-primary-800 shadow-sm ring-1 ring-primary-100 dark:bg-gray-800 dark:text-gray-100 dark:ring-gray-700'
            : inactiveRow
        } ${collapsed ? 'justify-center' : ''}`
      }}
    >
      {() => {
        const isActive = isPlatformNavItemActive(item, location)
        return (
        <>
          {isActive && !collapsed && (
            <span
              className={`absolute top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-primary-600 ${
                nested ? 'left-0' : 'left-0'
              }`}
            />
          )}
          <span
            className={`flex flex-shrink-0 items-center justify-center rounded-xl transition ${
              nested ? 'h-8 w-8' : 'h-9 w-9'
            } ${
              isActive
                ? 'bg-white text-primary-700 shadow-sm dark:bg-gray-900 dark:text-gray-100'
                : 'text-gray-500 group-hover:bg-white group-hover:text-primary-700 group-hover:shadow-sm dark:text-gray-400 dark:group-hover:bg-gray-900 dark:group-hover:text-gray-100'
            }`}
          >
            <item.icon className={nested ? 'h-4 w-4' : 'h-5 w-5'} />
          </span>
          {collapsed && <Badge value={badgeValue} collapsed />}
          {!collapsed && <span className="min-w-0 flex-1 truncate text-sm">{item.label}</span>}
          {!collapsed && <Badge value={badgeValue} />}
        </>
        )
      }}
    </NavLink>
  )
}

function NavSection({
  section,
  collapsed,
  hideLabels,
  isOpen,
  onToggle,
  isMobile,
  badgeCounts,
  onClose,
  onTooltip,
  onTooltipLeave,
}) {
  const SectionIcon = section.icon
  const firstItem = section.items[0]
  const sectionBadge = section.items.reduce(
    (sum, item) => sum + Number(item.badgeKey ? badgeCounts[item.badgeKey] || 0 : 0),
    0,
  )

  if (collapsed && hideLabels) {
    return (
      <NavLink
        to={firstItem.path}
        end={firstItem.path === '/platform/dashboard'}
        onClick={isMobile ? onClose : undefined}
        onMouseEnter={(event) => {
          const rect = event.currentTarget.getBoundingClientRect()
          onTooltip?.({
            label: section.label,
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
        <Badge value={sectionBadge} collapsed />
      </NavLink>
    )
  }

  if (section.items.length === 1) {
    return (
      <PlatformNavItem
        item={firstItem}
        collapsed={false}
        badgeCounts={badgeCounts}
        onClick={isMobile ? onClose : undefined}
        onTooltip={onTooltip}
        onTooltipLeave={onTooltipLeave}
      />
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
        <Badge value={sectionBadge} />
        <FiChevronDown
          className={`h-4 w-4 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      {isOpen && (
        <div className="space-y-0.5 border-l-2 border-gray-100 pl-1 dark:border-gray-800">
          {section.items.map((item) => (
            <PlatformNavItem
              key={item.path}
              item={item}
              collapsed={false}
              nested
              badgeCounts={badgeCounts}
              onClick={isMobile ? onClose : undefined}
              onTooltip={onTooltip}
              onTooltipLeave={onTooltipLeave}
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
        <h1 className="truncate text-base font-black leading-none text-gray-950 dark:text-gray-100">
          QR Menu SaaS
        </h1>
        <p className="mt-1 truncate text-xs font-medium text-gray-500 dark:text-gray-400">
          Platform Admin
        </p>
      </div>
    </div>
  )
}

function SidebarContent({
  collapsed,
  setCollapsed,
  user,
  onClose,
  isMobile,
  badgeCounts,
  onTooltip,
  onTooltipLeave,
}) {
  const hideLabels = collapsed && !isMobile
  const location = useLocation()
  const pathname = location.pathname

  const [openSections, setOpenSections] = useState(() => {
    const saved = readOpenSections()
    if (saved && typeof saved === 'object') return saved
    const initial = {}
    PLATFORM_NAV_SECTIONS.forEach((s) => {
      initial[s.id] = s.defaultOpen !== false
    })
    return initial
  })

  useEffect(() => {
    setOpenSections((prev) => {
      let changed = false
      const next = { ...prev }
      PLATFORM_NAV_SECTIONS.forEach((section) => {
        if (sectionContainsPath(section, pathname) && !next[section.id]) {
          next[section.id] = true
          changed = true
        }
      })
      if (changed) writeOpenSections(next)
      return changed ? next : prev
    })
  }, [pathname])

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
            type="button"
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
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-surface-50 dark:bg-gray-800"
            aria-label="Close sidebar"
          >
            <FiX className="h-4 w-4 text-gray-600 dark:text-gray-300" />
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4">
        <div className="space-y-1">
          {PLATFORM_NAV_SECTIONS.map((section) => (
            <NavSection
              key={section.id}
              section={section}
              collapsed={hideLabels}
              hideLabels={hideLabels}
              isOpen={openSections[section.id] !== false}
              onToggle={() => toggleSection(section.id)}
              isMobile={isMobile}
              badgeCounts={badgeCounts}
              onClose={onClose}
              onTooltip={onTooltip}
              onTooltipLeave={onTooltipLeave}
            />
          ))}
        </div>
      </nav>

      {!hideLabels && user && (
        <div className="flex-shrink-0 border-t border-gray-100 px-5 py-4 dark:border-gray-800">
          <div className="flex items-center gap-3 rounded-xl bg-surface-50/80 px-3 py-2.5 dark:bg-gray-800/60">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-white text-sm font-semibold text-primary-700 shadow-sm dark:bg-gray-900 dark:text-primary-300">
              {user?.name?.charAt(0) || 'A'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
                {user?.name}
              </p>
              <p className="truncate text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
            </div>
          </div>
        </div>
      )}

      {hideLabels && user && (
        <div className="flex flex-shrink-0 justify-center border-t border-gray-100 py-4 dark:border-gray-800">
          <div
            tabIndex={0}
            className="flex h-9 w-9 cursor-default items-center justify-center rounded-xl bg-white text-sm font-semibold text-primary-700 shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:bg-gray-900 dark:text-primary-300 dark:focus-visible:ring-offset-gray-900"
            onMouseEnter={(event) => {
              const rect = event.currentTarget.getBoundingClientRect()
              onTooltip?.({
                label: `${user?.name || 'Admin'} — ${user?.email || ''}`,
                top: rect.top + rect.height / 2,
                left: rect.right + 12,
              })
            }}
            onMouseLeave={onTooltipLeave}
            onFocus={(event) => {
              const rect = event.currentTarget.getBoundingClientRect()
              onTooltip?.({
                label: `${user?.name || 'Admin'} — ${user?.email || ''}`,
                top: rect.top + rect.height / 2,
                left: rect.right + 12,
              })
            }}
            onBlur={onTooltipLeave}
          >
            {user?.name?.charAt(0) || 'A'}
          </div>
        </div>
      )}
    </div>
  )
}

const PlatformSidebar = () => {
  const { user } = useAuth()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [tooltip, setTooltip] = useState(null)
  const [badgeCounts, setBadgeCounts] = useState({
    kycPending: 0,
    subscriptionRequests: 0,
    paymentReviews: 0,
  })

  useEffect(() => {
    if (user?.role !== 'super_admin' && user?.role !== 'admin') return undefined

    let cancelled = false
    const fetchCounts = async () => {
      try {
        const [kycRes, requestsRes, paymentsRes] = await Promise.all([
          api.get('/platform/kyc/stats', { skipErrorToast: true }).catch(() => null),
          api.get('/platform/subscriptions/requests/pending', { skipErrorToast: true }).catch(() => null),
          api.get('/platform/subscription-payments', {
            params: { status: 'review_queue', limit: 1 },
            skipErrorToast: true,
          }).catch(() => null),
        ])
        if (cancelled) return
        setBadgeCounts({
          kycPending: Number(kycRes?.data?.data?.pending || 0),
          subscriptionRequests: Array.isArray(requestsRes?.data?.data)
            ? requestsRes.data.data.length
            : 0,
          paymentReviews: Number(paymentsRes?.data?.data?.pagination?.total || 0),
        })
      } catch {
        // Sidebar badges are best-effort.
      }
    }

    fetchCounts()
    const intervalId = window.setInterval(fetchCounts, COUNT_REFRESH_MS)
    window.addEventListener('focus', fetchCounts)
    return () => {
      cancelled = true
      window.clearInterval(intervalId)
      window.removeEventListener('focus', fetchCounts)
    }
  }, [user?.role])

  if (user?.role !== 'super_admin' && user?.role !== 'admin') {
    return null
  }

  const sharedProps = {
    user,
    collapsed,
    setCollapsed,
    badgeCounts,
    onTooltip: setTooltip,
    onTooltipLeave: () => setTooltip(null),
  }

  return (
    <>
      <div className="fixed left-0 right-0 top-0 z-[60] flex h-14 items-center gap-3 border-b border-gray-200 bg-white px-4 dark:border-gray-800 dark:bg-gray-900 lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-surface-50 dark:bg-gray-800"
          aria-label="Open sidebar"
        >
          <FiMenu className="h-5 w-5 text-gray-700 dark:text-gray-200" />
        </button>
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary-600 to-secondary-500 text-white">
            <FiAward className="h-4 w-4" />
          </div>
          <h1 className="truncate text-sm font-black text-gray-950 dark:text-gray-100">
            QR Menu SaaS
          </h1>
        </div>
      </div>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-[65] bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
      )}

      <div
        className={`fixed left-0 top-0 z-[70] h-full w-72 transform bg-white shadow-2xl transition-transform duration-300 ease-in-out dark:bg-gray-900 lg:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent
          {...sharedProps}
          collapsed={false}
          onClose={() => setMobileOpen(false)}
          isMobile
        />
      </div>

      <aside
        className={`sticky top-0 hidden h-screen flex-shrink-0 flex-col border-r border-gray-100 bg-white transition-all duration-300 ease-in-out dark:border-gray-800 dark:bg-gray-900 lg:flex ${
          collapsed ? 'w-[110px]' : 'w-72'
        }`}
      >
        <SidebarContent {...sharedProps} onClose={() => {}} isMobile={false} />
      </aside>

      {tooltip && (
        <div
          className="pointer-events-none fixed z-[80] max-w-[240px] -translate-y-1/2 whitespace-normal break-words rounded-xl bg-gray-950 px-3 py-2 text-xs font-semibold text-white shadow-2xl ring-1 ring-white/10"
          style={{ top: tooltip.top, left: tooltip.left }}
        >
          {tooltip.label}
          <span className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-950" />
        </div>
      )}
    </>
  )
}

export default PlatformSidebar
