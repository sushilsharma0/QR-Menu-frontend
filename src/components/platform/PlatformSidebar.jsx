import React, { useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  FiAward,
  FiBarChart2,
  FiChevronLeft,
  FiChevronRight,
  FiClipboard,
  FiCreditCard,
  FiFileText,
  FiHelpCircle,
  FiHome,
  FiLayout,
  FiMenu,
  FiSettings,
  FiShield,
  FiTerminal,
  FiUsers,
  FiX,
} from 'react-icons/fi'
import { useAuth } from '../../hooks/useAuth'

const NAV_GROUPS = [
  {
    label: 'Overview',
    items: [
      { path: '/platform/dashboard', icon: FiHome, label: 'Dashboard' },
    ],
  },
  {
    label: 'Directory',
    items: [
      { path: '/platform/restaurants', icon: FiUsers, label: 'Restaurants' },
      { path: '/platform/kyc', icon: FiFileText, label: 'KYC Verification' },
    ],
  },
  {
    label: 'Billing',
    items: [
      { path: '/platform/subscriptions', icon: FiCreditCard, label: 'Subscriptions' },
      { path: '/platform/subscription-payments', icon: FiCreditCard, label: 'Payments' },
      { path: '/platform/invoices', icon: FiClipboard, label: 'Invoices' },
      { path: '/platform/subscription-activity', icon: FiBarChart2, label: 'Subscription activity' },
    ],
  },
  {
    label: 'Content & support',
    items: [
      { path: '/platform/cms', icon: FiLayout, label: 'CMS' },
      { path: '/platform/tickets', icon: FiHelpCircle, label: 'Support Tickets' },
    ],
  },
  {
    label: 'System',
    items: [
      { path: '/platform/admins', icon: FiShield, label: 'Admins' },
      { path: '/platform/logs', icon: FiTerminal, label: 'System Logs' },
      { path: '/platform/settings', icon: FiSettings, label: 'Settings' },
    ],
  },
]

function PlatformNavItem({ item, collapsed, onClick, onTooltip, onTooltipLeave }) {
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
        <p className="mt-1 truncate text-xs font-medium text-gray-500 dark:text-gray-400">Platform Admin</p>
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
  onTooltip,
  onTooltipLeave,
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
                  <PlatformNavItem
                    key={item.path}
                    item={item}
                    collapsed={hideLabels}
                    onClick={isMobile ? onClose : undefined}
                    onTooltip={onTooltip}
                    onTooltipLeave={onTooltipLeave}
                  />
                ))}
              </div>
            </div>
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
              <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">{user?.name}</p>
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

  if (user?.role !== 'super_admin' && user?.role !== 'admin') {
    return null
  }

  const sharedProps = {
    user,
    collapsed,
    setCollapsed,
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
          <h1 className="truncate text-sm font-black text-gray-950 dark:text-gray-100">QR Menu SaaS</h1>
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
