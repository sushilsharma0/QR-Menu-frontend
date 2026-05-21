import React, { useEffect, useMemo, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { FiBriefcase, FiChevronDown, FiChevronLeft, FiChevronRight, FiMenu, FiX } from 'react-icons/fi'
import api from '../../services/api'
import { useAuth } from '../../hooks/useAuth'
import { useSocket } from '../../hooks/useSocket'
import { useTenantRoutes } from '../../hooks/useTenantRoutes'
import { useBranch } from '../../context/BranchContext'
import {
  MANAGER_NAV_SECTIONS,
  managerSectionContainsSegment,
} from '../../config/managerNavConfig'

const NAV_OPEN_KEY = 'manager-nav-sections-open'

function readOpenSections() {
  try {
    const raw = localStorage.getItem(NAV_OPEN_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    /* ignore */
  }
  return null
}

function writeOpenSections(state) {
  try {
    localStorage.setItem(NAV_OPEN_KEY, JSON.stringify(state))
  } catch {
    /* ignore */
  }
}

function NavItem({ item, managerBase, pendingCount, collapsed, nested, onClose, isMobile }) {
  const isOrders = item.segment === 'orders'
  return (
    <NavLink
      to={`${managerBase}/${item.segment}`}
      end={item.segment === 'dashboard'}
      onClick={isMobile ? onClose : undefined}
      className={({ isActive }) =>
        `group relative flex items-center gap-3 rounded-xl transition-all duration-200 ${
          nested && !collapsed ? 'ml-2 py-2 pl-2 pr-3' : 'px-3 py-2.5'
        } ${
          isActive
            ? 'bg-primary-50 font-semibold text-primary-800 shadow-sm ring-1 ring-primary-100 dark:bg-gray-800 dark:text-gray-100 dark:ring-gray-700'
            : 'text-gray-600 hover:bg-surface-50 hover:text-gray-950 dark:text-gray-300 dark:hover:bg-gray-800'
        } ${collapsed ? 'justify-center' : ''}`
      }
    >
      {({ isActive }) => (
        <>
          {isActive && !collapsed && (
            <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-primary-600" />
          )}
          <span
            className={`flex flex-shrink-0 items-center justify-center rounded-xl ${
              nested && !collapsed ? 'h-7 w-7' : 'h-9 w-9'
            } ${
              isActive
                ? 'bg-white text-primary-700 shadow-sm dark:bg-gray-900'
                : 'bg-surface-100 text-gray-500 group-hover:bg-white dark:bg-gray-800'
            }`}
          >
            <item.icon className={nested && !collapsed ? 'h-4 w-4' : 'h-5 w-5'} />
          </span>
          {!collapsed && <span className={`truncate ${nested ? 'text-xs' : 'text-sm'}`}>{item.label}</span>}
          {isOrders && pendingCount > 0 && (
            <span
              className={`flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white ${
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

function SidebarContent({
  collapsed,
  setCollapsed,
  managerBase,
  pendingCount,
  onClose,
  isMobile,
}) {
  const hideLabels = collapsed && !isMobile
  const routerLocation = useLocation()
  const activeTail = useMemo(() => {
    const m = String(routerLocation.pathname || '').match(/^\/manager\/[^/]+\/[^/]+\/(.*)$/)
    return m?.[1] || ''
  }, [routerLocation.pathname])

  const [openSections, setOpenSections] = useState(() => {
    const saved = readOpenSections()
    if (saved && typeof saved === 'object') return saved
    const initial = {}
    MANAGER_NAV_SECTIONS.forEach((s) => {
      initial[s.id] = s.defaultOpen !== false
    })
    return initial
  })

  useEffect(() => {
    setOpenSections((prev) => {
      let changed = false
      const next = { ...prev }
      MANAGER_NAV_SECTIONS.forEach((section) => {
        if (managerSectionContainsSegment(section, activeTail) && !next[section.id]) {
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
        className={`flex flex-shrink-0 items-center border-b border-gray-100 dark:border-gray-800 ${
          hideLabels ? 'justify-center px-3 py-5' : 'justify-between px-5 py-5'
        }`}
      >
        {!hideLabels ? (
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-800 to-primary-700 text-white shadow-md">
              <FiBriefcase className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-base font-semibold text-gray-950 dark:text-gray-100">Manager</h1>
              <p className="truncate text-xs text-gray-500 dark:text-gray-400">Operations hub</p>
            </div>
          </div>
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-800 to-primary-700 text-white">
            <FiBriefcase className="h-5 w-5" />
          </div>
        )}
        {!isMobile && (
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-surface-50 dark:bg-gray-800"
          >
            {collapsed ? <FiChevronRight className="h-4 w-4" /> : <FiChevronLeft className="h-4 w-4" />}
          </button>
        )}
        {isMobile && (
          <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-xl bg-surface-50">
            <FiX className="h-4 w-4" />
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {MANAGER_NAV_SECTIONS.map((section) => {
          const SectionIcon = section.icon
          const isOpen = Boolean(openSections[section.id])
          const sectionPending = section.id === 'operations' && pendingCount > 0 ? pendingCount : 0

          if (hideLabels) {
            const first = section.items[0]
            return first ? (
              <NavItem
                key={section.id}
                item={first}
                managerBase={managerBase}
                pendingCount={pendingCount}
                collapsed
                onClose={onClose}
                isMobile={isMobile}
              />
            ) : null
          }

          return (
            <div key={section.id} className="pb-1">
              <button
                type="button"
                onClick={() => toggleSection(section.id)}
                className="mb-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left hover:bg-surface-50 dark:hover:bg-gray-800"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-50 dark:bg-gray-800">
                  <SectionIcon className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                </span>
                <span className="flex-1 truncate text-xs font-black uppercase tracking-[0.14em] text-gray-600 dark:text-gray-400">
                  {section.label}
                </span>
                {sectionPending > 0 && (
                  <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                    {sectionPending > 99 ? '99+' : sectionPending}
                  </span>
                )}
                <FiChevronDown className={`h-4 w-4 transition ${isOpen ? 'rotate-180' : ''}`} />
              </button>
              {isOpen && (
                <div className="space-y-0.5 border-l-2 border-gray-100 pl-1 dark:border-gray-800">
                  {section.items.map((item) => (
                    <NavItem
                      key={item.segment}
                      item={item}
                      managerBase={managerBase}
                      pendingCount={pendingCount}
                      collapsed={false}
                      nested
                      onClose={onClose}
                      isMobile={isMobile}
                    />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </nav>
    </div>
  )
}

const ManagerSidebar = () => {
  const { user } = useAuth()
  const { managerBase, hasTenant } = useTenantRoutes()
  const { socket } = useSocket()
  const { selectedBranchId, loading: branchesLoading } = useBranch()
  const [pendingCount, setPendingCount] = useState(0)
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const fetchPendingCount = async () => {
    try {
      const res = await api.get('/restaurant/customer-orders/stats', { skipErrorToast: true })
      const active = res?.data?.data?.active || {}
      setPendingCount(Number(active.pending || 0))
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
    if (branchesLoading) return
    fetchPendingCount()
  }, [branchesLoading, selectedBranchId])

  useEffect(() => {
    if (!socket) return undefined
    socket.on('new_order', fetchPendingCount)
    socket.on('order_updated', fetchPendingCount)
    return () => {
      socket.off('new_order', fetchPendingCount)
      socket.off('order_updated', fetchPendingCount)
    }
  }, [socket])

  if (!user || !hasTenant) return null

  const shared = {
    managerBase,
    pendingCount,
    collapsed,
    setCollapsed,
  }

  return (
    <>
      <div className="fixed left-0 right-0 top-0 z-[60] flex h-14 items-center gap-3 border-b border-gray-200 bg-white px-4 dark:border-gray-800 dark:bg-gray-900 lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-50 dark:bg-gray-800"
        >
          <FiMenu className="h-5 w-5" />
        </button>
        <span className="text-sm font-black text-gray-950 dark:text-gray-100">Manager Portal</span>
        {pendingCount > 0 && (
          <span className="ml-auto rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">
            {pendingCount}
          </span>
        )}
      </div>

      {mobileOpen && (
        <button
          type="button"
          aria-label="Close manager navigation"
          className="fixed inset-0 z-[65] bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div
        className={`fixed left-0 top-0 z-[70] h-full w-72 transform bg-white shadow-2xl transition-transform dark:bg-gray-900 lg:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent {...shared} onClose={() => setMobileOpen(false)} isMobile />
      </div>

      <aside
        className={`sticky top-0 hidden h-screen flex-shrink-0 flex-col border-r border-gray-100 bg-white transition-all dark:border-gray-800 dark:bg-gray-900 lg:flex ${
          collapsed ? 'w-[110px]' : 'w-72'
        }`}
      >
        <SidebarContent {...shared} onClose={() => {}} isMobile={false} />
      </aside>
    </>
  )
}

export default ManagerSidebar
