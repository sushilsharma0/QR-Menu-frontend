import React, { useEffect, useState } from 'react'
import { Outlet, Link, NavLink, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { FiClock, FiGrid, FiHome, FiList, FiLogOut, FiPlusCircle, FiUser } from 'react-icons/fi'
import { FiMoon, FiSun } from 'react-icons/fi'
import NotificationMenu from '../common/NotificationMenu'
import api from '../../services/api'
import { useSocket } from '../../hooks/useSocket'
import { cashierPortalBase, kitchenPortalBase, waiterPortalBase } from '../../utils/tenantPaths'
import { useTheme } from '../../context/ThemeContext'

const EmployeeLayout = () => {
  const { user, logout } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const location = useLocation()
  const { socket } = useSocket()
  const [pendingCount, setPendingCount] = useState(0)
  const isPosRoute = /\/pos(\/|$)/.test(location.pathname || '')

  if (user?.scope === 'employee' && user?.mustChangePassword) {
    return <Navigate to="/employee/change-password" replace state={{ from: location }} />
  }

  const handleLogout = () => {
    logout({ loginRole: 'employee' })
  }

  const getRoleIcon = () => {
    if (user?.role === 'kitchen') return '👨‍🍳'
    if (user?.role === 'cashier') return '💰'
    if (user?.role === 'waiter') return '🧾'
    return '👤'
  }

  const getRoleTitle = () => {
    if (user?.role === 'kitchen') return 'Kitchen Dashboard'
    if (user?.role === 'cashier') return 'Cashier Dashboard'
    if (user?.role === 'waiter') return 'Waiter POS'
    if (user?.role === 'manager' || user?.role === 'admin') return 'Manager Portal'
    return 'Employee Dashboard'
  }

  const slug = user?.slug ?? user?.restaurantSlug ?? user?.restaurantId ?? user?.id
  const restaurantId = user?.restaurantId ?? user?.id
  const hasTenant = slug != null && restaurantId != null
  const kb = hasTenant ? kitchenPortalBase(slug, restaurantId) : ''
  const cb = hasTenant ? cashierPortalBase(slug, restaurantId) : ''
  const wb = hasTenant ? waiterPortalBase(slug, restaurantId) : ''
  const kitchenDashboardPath = kb ? `${kb}/dashboard` : ''
  const kitchenOrdersPath = kb ? `${kb}/orders` : ''
  const cashierDashboardPath = cb ? `${cb}/dashboard` : ''
  const cashierTransactionsPath = cb ? `${cb}/transactions` : ''
  const cashierHouseCreditPath = cb ? `${cb}/house-credit` : ''
  const waiterDashboardPath = wb ? `${wb}/dashboard` : ''
  const waiterOrderPath = wb ? `${wb}/order` : ''
  const waiterPosPath = wb ? `${wb}/pos` : ''

  const navItems = [
    { path: kitchenOrdersPath, label: 'Order History', icon: FiClock, role: 'kitchen', showPending: true },
    { path: cashierDashboardPath, label: 'Payments', icon: FiHome, role: 'cashier' },
    { path: cashierTransactionsPath, label: 'Transactions', icon: FiList, role: 'cashier' },
    { path: cashierHouseCreditPath, label: 'House credit', icon: FiUser, role: 'cashier' },
    { path: waiterDashboardPath, label: 'Dashboard', icon: FiGrid, role: 'waiter' },
    { path: waiterPosPath, label: 'POS', icon: FiGrid, role: 'waiter' },
    { path: waiterOrderPath, label: 'Take Order', icon: FiPlusCircle, role: 'waiter' },
  ]

  const currentNavItems = navItems.filter(
    (item) => item.role === user?.role && item.path,
  )

  const fetchPendingCount = async () => {
    if (user?.role !== 'kitchen') return

    try {
      const res = await api.get('/restaurant/customer-orders', {
        params: { status: 'pending', page: 1, limit: 1 },
      })
      setPendingCount(res?.data?.data?.pagination?.total || 0)
    } catch (err) {
      setPendingCount(0)
    }
  }

  useEffect(() => {
    fetchPendingCount()
  }, [user?.role])

  useEffect(() => {
    if (!socket || user?.role !== 'kitchen') return undefined

    const refreshPendingCount = () => {
      fetchPendingCount()
    }

    socket.on('new_order', refreshPendingCount)
    socket.on('order_updated', refreshPendingCount)

    return () => {
      socket.off('new_order', refreshPendingCount)
      socket.off('order_updated', refreshPendingCount)
    }
  }, [socket, user?.role])

  return (
    <div className={`employee-portal ${isPosRoute ? 'h-screen overflow-hidden' : 'min-h-screen'} flex flex-col bg-gray-50 dark:bg-gray-950`}>
      {/* Header */}
      {!isPosRoute && <header className="sticky top-0 z-30 border-b border-gray-100 bg-white/95 shadow-sm backdrop-blur dark:border-gray-800 dark:bg-gray-900/95">
        <div className="mx-auto w-full max-w-[1920px] px-3 sm:px-5 lg:px-8">
          <div className="flex h-14 items-center justify-between sm:h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <Link
                to={
                  user?.role === 'kitchen'
                    ? kitchenDashboardPath || '/login'
                    : user?.role === 'cashier'
                      ? cashierDashboardPath || '/login'
                      : user?.role === 'waiter'
                        ? waiterDashboardPath || '/login'
                      : '/'
                }
                className="flex items-center gap-2"
              >
                <span className="text-2xl">{getRoleIcon()}</span>
                <span className="text-xl font-bold text-primary-600">QR Menu SaaS</span>
              </Link>
              <span className="text-sm text-gray-500 dark:text-gray-400 hidden md:inline">|</span>
              <span className="text-sm text-gray-600 dark:text-gray-300 hidden md:inline">{getRoleTitle()}</span>
            </div>

            {/* Right section */}
            <div className="flex items-center gap-4">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {isDark ? <FiSun className="h-5 w-5" /> : <FiMoon className="h-5 w-5" />}
              </button>
              <NotificationMenu />

              {/* User Info */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                  <FiUser className="h-4 w-4 text-primary-600" />
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{user?.name || user?.username}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user?.role}</p>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-600 transition-colors"
                title="Logout"
              >
                <FiLogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>}

      {/* Navigation Tabs */}
      {!isPosRoute && currentNavItems.length > 0 && (
        <div className="border-b border-gray-100 bg-gradient-to-r from-surface-50 via-white to-primary-50/30 dark:border-gray-800 dark:from-gray-900 dark:via-gray-900 dark:to-gray-950">
          <div className="mx-auto w-full max-w-[1920px] px-3 py-2 sm:px-5 lg:px-8">
            <nav className="-mx-1 flex gap-1 overflow-x-auto pb-1 sm:mx-0 sm:flex-wrap sm:justify-start sm:gap-2 sm:overflow-visible sm:pb-0">
              {currentNavItems.map((item) => (
                <NavLink
                  key={`${item.role}-${item.path}`}
                  to={item.path}
                  className={({ isActive }) =>
                    `group relative inline-flex h-10 shrink-0 items-center gap-2 rounded-xl px-3 text-sm font-semibold transition-all sm:h-11 sm:px-4 ${
                      isActive
                        ? 'bg-primary-700 text-white shadow-md'
                        : 'text-gray-600 hover:bg-white hover:text-primary-800 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span
                        className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
                          isActive
                            ? 'bg-white/15 text-white'
                            : 'bg-surface-100 text-gray-500 group-hover:bg-white group-hover:text-primary-700 dark:bg-gray-800 dark:text-gray-300'
                        }`}
                      >
                        <item.icon className="h-4 w-4" />
                      </span>
                      <span className="whitespace-nowrap">{item.label}</span>
                      {item.showPending && pendingCount > 0 && (
                        <span className="ml-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-bold text-white">
                          {pendingCount > 99 ? '99+' : pendingCount}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main
        className={
          isPosRoute
            ? 'min-h-0 flex-1 overflow-hidden p-0 dark:text-gray-100'
            : 'mx-auto w-full max-w-[1920px] flex-1 px-3 py-4 sm:px-5 sm:py-6 lg:px-8 dark:text-gray-100'
        }
      >
        <Outlet />
      </main>

      {/* Footer */}
      {!isPosRoute && user?.role !== 'cashier' && (
        <footer className="mt-8 w-full border-t border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900">
          <div className="mx-auto max-w-[1920px] px-3 py-4 sm:px-5 lg:px-8">
            <p className="text-center text-xs text-gray-500 dark:text-gray-400 sm:text-sm">
              &copy; {new Date().getFullYear()} QR Menu SaaS. All rights reserved.
            </p>
          </div>
        </footer>
      )}
    </div>
  )
}

export default EmployeeLayout
