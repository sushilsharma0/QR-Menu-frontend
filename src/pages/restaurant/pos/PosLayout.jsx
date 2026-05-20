import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { FiArrowLeft, FiChevronDown, FiCoffee, FiCreditCard, FiLayers, FiLogOut, FiMail, FiMoon, FiPieChart, FiRotateCcw, FiSettings, FiShield, FiShoppingCart, FiSun } from 'react-icons/fi'
import { useTenantRoutes } from '../../../hooks/useTenantRoutes'
import { useAuth } from '../../../hooks/useAuth'
import { usePosAccess } from '../../../hooks/usePosAccess'
import { useSocket } from '../../../hooks/useSocket'
import { useTheme } from '../../../context/ThemeContext'
import NotificationMenu from '../../../components/common/NotificationMenu'
import { fetchPosMeta } from '../../../services/posApi'

export default function PosLayout() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { restaurantBase, cashierBase, waiterBase, managerBase, portalBase } = useTenantRoutes()
  const posBase = pathname.includes('/cashier/')
    ? `${cashierBase}/pos`
    : pathname.includes('/waiter/')
      ? `${waiterBase}/pos`
      : pathname.includes('/manager/')
        ? `${managerBase}/pos`
        : `${restaurantBase}/pos`

  const { user, logout } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const { canBilling, canManager, canReports, canShift } = usePosAccess()
  const { socket } = useSocket()
  const [meta, setMeta] = useState(null)
  const [profileOpen, setProfileOpen] = useState(false)
  const [confirmLogout, setConfirmLogout] = useState(false)
  const profileRef = useRef(null)

  useEffect(() => {
    let alive = true
    fetchPosMeta()
      .then((d) => {
        if (alive) setMeta(d)
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    if (!socket) return undefined
    let alive = true
    const refreshMeta = () => {
      fetchPosMeta()
        .then((d) => {
          if (alive) setMeta(d)
        })
        .catch(() => {})
    }
    socket.on('pos:shift_opened', refreshMeta)
    socket.on('pos:shift_closed', refreshMeta)
    return () => {
      alive = false
      socket.off('pos:shift_opened', refreshMeta)
      socket.off('pos:shift_closed', refreshMeta)
    }
  }, [socket])

  useEffect(() => {
    const rid = user?.restaurantId ?? user?.id
    if (!socket || !rid) return undefined
    socket.emit('join:restaurant', String(rid))
    return undefined
  }, [socket, user])

  useEffect(() => {
    const handleClick = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const tabs = [
    { to: posBase, end: true, label: 'Register', icon: FiCoffee },
    { to: `${posBase}/orders`, label: 'Orders', icon: FiShoppingCart },
    ...(canBilling ? [{ to: `${posBase}/billing`, label: 'Billing', icon: FiCreditCard }] : []),
    { to: `${posBase}/history`, label: 'History', icon: FiLayers },
    ...(canManager ? [{ to: `${posBase}/returns`, label: 'Returns', icon: FiRotateCcw }] : []),
    ...(canBilling ? [{ to: `${posBase}/shift`, label: 'Shift', icon: FiLayers }] : []),
    ...(canReports ? [{ to: `${posBase}/reports`, label: 'Reports', icon: FiPieChart }] : []),
  ]

  const shiftPath = `${posBase}/shift`
  const isShiftRoute = pathname === shiftPath
  const metaLoaded = meta !== null
  const hasOpenShift = Boolean(meta?.shift)
  const posLocked = metaLoaded && !hasOpenShift && !isShiftRoute

  const managerDashboardTo = managerBase ? `${managerBase}/dashboard` : '/login'

  const employeeDashboardTo =
    user?.role === 'cashier'
      ? `${cashierBase}/dashboard`
      : user?.role === 'waiter'
        ? `${waiterBase}/dashboard`
        : user?.role === 'manager' || user?.role === 'admin'
          ? managerDashboardTo
          : `${portalBase}/dashboard`

  const userButtonTo =
    user?.scope === 'employee' ? employeeDashboardTo : `${restaurantBase}/profile`

  const dashboardTo =
    user?.scope === 'employee' ? employeeDashboardTo : `${restaurantBase}/dashboard`

  const loginRoleAfterLogout = () => {
    if (user?.role === 'super_admin' || (user?.role === 'admin' && user?.scope !== 'employee')) return 'platform'
    if (user?.scope === 'employee') return 'employee'
    if (user?.role === 'restaurant') return 'restaurant'
    return undefined
  }

  const handleLogout = () => {
    setConfirmLogout(false)
    setProfileOpen(false)
    logout({ loginRole: loginRoleAfterLogout() })
  }

  const roleLabel =
    user?.scope === 'employee'
      ? user?.role
      : user?.role === 'restaurant'
        ? 'restaurant'
        : user?.role || 'account'

  const profileImage = user?.logo || user?.profilePhoto || meta?.restaurant?.logo
  const displayName = meta?.restaurant?.name || user?.restaurantName || user?.name || user?.username || 'User'
  const displayEmail = user?.email || user?.username || 'No email added'
  const settingsTo = user?.scope === 'employee' ? userButtonTo : `${restaurantBase}/settings`
  const securityTo = user?.scope === 'employee' ? '/employee/change-password' : `${restaurantBase}/profile`
  const avatar = (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 text-white ring-2 ring-white">
      {profileImage ? (
        <img src={profileImage} alt={displayName} className="h-full w-full object-cover" />
      ) : (
        <FiCoffee className="h-5 w-5" />
      )}
    </span>
  )

  return (
    <div className="flex h-full min-h-0 flex-col bg-surface-50">
      <header className="shrink-0 border-b border-[#ead8cb] bg-[#fffaf5] text-gray-950 shadow-[0_18px_45px_-36px_rgba(83,35,13,0.55)] dark:border-gray-800 dark:bg-gray-950 dark:text-gray-100">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-stretch gap-3 px-3 py-3 sm:px-5 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:px-6">
          <div className="flex min-w-0 overflow-hidden rounded-2xl border border-[#ead8cb] bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900 lg:w-[360px]">
            <button
              type="button"
              onClick={() => navigate(dashboardTo)}
              className="flex w-14 shrink-0 items-center justify-center bg-[#3a1408] text-white transition hover:bg-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-300"
              aria-label="Go to dashboard"
              title="Dashboard"
            >
              <FiArrowLeft className="h-5 w-5" />
            </button>
            <div className="min-w-0 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-md bg-[#fff1e8] px-2 py-1 text-[10px] font-black uppercase tracking-wide text-primary-800 dark:bg-primary-950/40 dark:text-primary-200">
                  <FiCoffee className="h-3.5 w-3.5" />
                  POS
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[10px] font-black uppercase tracking-wide ${
                    meta?.shift
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200'
                      : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-300'
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${meta?.shift ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                  {meta?.shift ? 'Open' : 'Closed'}
                </span>
              </div>
              <h1 className="mt-2 truncate text-xl font-black leading-tight tracking-tight">
                {meta?.restaurant?.name || 'POS'}
              </h1>
              <p className="mt-1 truncate text-xs font-medium text-gray-500 dark:text-gray-400">
                {user?.name || displayEmail}
              </p>
            </div>
          </div>

          <div className="hidden min-w-0 grid-cols-3 gap-2 lg:grid">
            <div className="rounded-2xl border border-[#ead8cb] bg-white px-4 py-3 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <p className="text-[10px] font-black uppercase tracking-wide text-gray-400">Mode</p>
              <p className="mt-1 truncate text-sm font-black text-gray-900 dark:text-gray-100">Restaurant POS</p>
            </div>
            <div className="rounded-2xl border border-[#ead8cb] bg-white px-4 py-3 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <p className="text-[10px] font-black uppercase tracking-wide text-gray-400">Active tables</p>
              <p className="mt-1 text-sm font-black text-gray-900 dark:text-gray-100">{meta?.activeTables ?? '-'}</p>
            </div>
            <div className="rounded-2xl border border-[#ead8cb] bg-white px-4 py-3 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <p className="text-[10px] font-black uppercase tracking-wide text-gray-400">Access</p>
              <p className="mt-1 truncate text-sm font-black capitalize text-gray-900 dark:text-gray-100">{roleLabel}</p>
            </div>
          </div>

          <div className="flex min-w-0 items-center justify-end gap-1.5 sm:gap-3">
            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#ead8cb] bg-white text-primary-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-[#fff1e8] focus:outline-none focus:ring-2 focus:ring-primary-200 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? <FiSun className="h-5 w-5" /> : <FiMoon className="h-5 w-5" />}
            </button>
            <NotificationMenu />
            <div ref={profileRef} className="relative">
              <button
                type="button"
                onClick={() => setProfileOpen((current) => !current)}
                className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-2xl border border-[#ead8cb] bg-white px-1.5 py-1.5 text-left text-gray-950 shadow-sm transition hover:-translate-y-0.5 hover:bg-[#fffdf9] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary-200 sm:min-h-14 sm:gap-3 sm:px-3 sm:py-2 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-100 dark:hover:border-gray-700"
                title={displayName}
                aria-expanded={profileOpen}
                aria-label="Open profile menu"
              >
                {avatar}
                <span className="hidden min-w-0 md:block">
                  <span className="block max-w-40 truncate text-sm font-black">{displayName}</span>
                  <span className="block max-w-40 truncate text-xs text-gray-500">{displayEmail}</span>
                </span>
                <FiChevronDown className={`hidden h-4 w-4 text-gray-400 transition min-[380px]:block ${profileOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.98 }}
                    transition={{ duration: 0.18 }}
                    className="absolute right-0 z-40 mt-3 w-[min(310px,calc(100vw-1.5rem))] overflow-hidden rounded-3xl border border-amber-200 bg-white text-gray-950 shadow-2xl shadow-slate-950/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                  >
                    <div className="p-4">
                      <div className="flex items-center gap-3">
                        {avatar}
                        <div className="min-w-0">
                          <p className="truncate text-sm font-black">{displayName}</p>
                          <p className="truncate text-xs capitalize text-gray-500 dark:text-gray-400">{roleLabel}</p>
                        </div>
                      </div>
                      <div className="mt-4 flex items-center gap-2 rounded-2xl border border-surface-100 bg-white px-3 py-3 text-xs text-gray-600 shadow-sm dark:border-gray-800 dark:bg-gray-950/60 dark:text-gray-300">
                        <FiMail className="h-4 w-4 shrink-0 text-[#9a3412]" />
                        <span className="truncate">{displayEmail}</span>
                      </div>
                    </div>
                    <div className="grid gap-1 border-t border-surface-100 p-2 dark:border-gray-800">
                      <Link
                        to={settingsTo}
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold text-gray-700 transition hover:bg-surface-50 dark:text-gray-200 dark:hover:bg-gray-800"
                      >
                        <FiSettings className="h-4 w-4 text-[#9a3412]" />
                        Restaurant settings
                      </Link>
                      <Link
                        to={securityTo}
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold text-gray-700 transition hover:bg-surface-50 dark:text-gray-200 dark:hover:bg-gray-800"
                      >
                        <FiShield className="h-4 w-4 text-[#9a3412]" />
                        Account security
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          setProfileOpen(false)
                          setConfirmLogout(true)
                        }}
                        className="flex items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-bold text-red-600 transition hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-950/30"
                      >
                        <FiLogOut className="h-4 w-4" />
                        Logout
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      <nav className="scrollbar-hide flex shrink-0 gap-1 overflow-x-auto border-b border-[#ead8cb] bg-[#f8efe7] px-3 py-2 shadow-inner dark:border-gray-800 dark:bg-gray-950 sm:px-5 lg:px-6">
        {tabs.map(({ to, end, label, icon: Icon }) => (
          !hasOpenShift && metaLoaded && to !== shiftPath ? (
            <span
              key={to}
              className="flex shrink-0 cursor-not-allowed items-center gap-2 border-b-2 border-transparent px-4 py-2.5 text-sm font-bold text-gray-300 dark:text-gray-700"
              title="Open a shift first"
            >
              <Icon className="h-4 w-4" />
              {label}
            </span>
          ) : (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex shrink-0 items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-bold transition-all ${
                  isActive
                    ? 'border-primary-700 bg-white text-primary-800 shadow-sm dark:border-primary-300 dark:bg-gray-900 dark:text-primary-200'
                    : 'border-transparent text-gray-600 hover:bg-white/70 hover:text-primary-700 dark:text-gray-300 dark:hover:bg-gray-900'
                }`
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          )
        ))}
      </nav>

      <motion.div
        className="min-h-0 flex-1 overflow-y-auto bg-surface-50"
        initial={{ opacity: 0.96 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        {posLocked ? (
          <div className="flex min-h-full items-center justify-center px-4 py-5 sm:p-6">
            <div className="w-full max-w-xl rounded-3xl border border-amber-200 bg-white px-5 py-7 text-center shadow-sm sm:p-8">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 text-primary-700 sm:h-16 sm:w-16">
                <FiLayers className="h-6 w-6 sm:h-7 sm:w-7" />
              </div>
              <h2 className="mt-5 text-xl font-black text-gray-950 sm:text-2xl">Open a shift first</h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500 sm:text-base sm:leading-7">
                POS register, orders, billing, returns, reports, and saved carts are locked until a cashier or manager opens the current shift.
              </p>
              {canShift ? (
                <Link
                  to={shiftPath}
                  className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-primary-600 px-5 py-3 text-sm font-black text-white transition hover:bg-primary-700 sm:w-auto"
                >
                  Go to Shift
                </Link>
              ) : (
                <p className="mt-6 rounded-2xl bg-surface-50 px-4 py-3 text-sm font-bold leading-6 text-gray-600">
                  Ask a cashier, manager, or owner to open the shift.
                </p>
              )}
            </div>
          </div>
        ) : (
          <Outlet context={{ posBase, meta, setMeta }} />
        )}
      </motion.div>

      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {confirmLogout && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[9999] grid place-items-center bg-slate-950/55 p-4 backdrop-blur-sm"
              >
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 20, scale: 0.96 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className="w-full max-w-[420px] rounded-3xl border border-white/80 bg-white p-6 text-center shadow-2xl shadow-slate-950/25 dark:border-gray-800 dark:bg-gray-900"
                >
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-red-50 text-red-600 ring-8 ring-red-50/70 dark:bg-red-950/40 dark:text-red-300 dark:ring-red-950/20">
                    <FiLogOut className="h-7 w-7" />
                  </div>
                  <h3 className="mt-6 text-2xl font-black tracking-tight text-gray-950 dark:text-gray-100">
                    Logout?
                  </h3>
                  <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-gray-500 dark:text-gray-400">
                    Your current session will end and you will return to the login screen.
                  </p>
                  <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => setConfirmLogout(false)}
                      className="rounded-2xl border border-surface-200 bg-white px-5 py-3 text-sm font-black text-gray-700 transition hover:bg-surface-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
                    >
                      Stay logged in
                    </button>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="rounded-2xl bg-red-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-red-900/20 transition hover:bg-red-700"
                    >
                      Logout
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </div>
  )
}
