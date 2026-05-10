import React, { useEffect, useState } from 'react'
import { Outlet, Link, NavLink, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import {
  FiBarChart2,
  FiBookOpen,
  FiClock,
  FiCreditCard,
  FiFileText,
  FiGrid,
  FiLogOut,
  FiPercent,
  FiPieChart,
  FiPlusCircle,
  FiUsers,
  FiUser,
} from 'react-icons/fi'
import { FiMoon, FiSun } from 'react-icons/fi'
import { TbCurrencyRupee } from 'react-icons/tb'
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
  const cashierPosPath = cb ? `${cb}/pos` : ''
  const cashierFinanceBase = cb ? `${cb}/finance` : ''
  const waiterDashboardPath = wb ? `${wb}/dashboard` : ''
  const waiterOrderPath = wb ? `${wb}/order` : ''
  const waiterPosPath = wb ? `${wb}/pos` : ''

  const navItems = [
    { path: kitchenOrdersPath, label: 'Order History', icon: FiClock, role: 'kitchen', showPending: true },
    { path: cashierPosPath, label: 'POS', icon: FiGrid, role: 'cashier' },
    { path: cashierPosPath, label: 'POS', icon: FiGrid, role: 'manager' },
    { path: cashierDashboardPath, label: 'Orders', icon: TbCurrencyRupee, role: 'cashier' },
    { path: cashierFinanceBase ? `${cashierFinanceBase}/dashboard` : '', label: 'Finance', icon: FiBarChart2, role: 'cashier' },
    { path: cashierFinanceBase ? `${cashierFinanceBase}/expenses` : '', label: 'Expenses', icon: FiCreditCard, role: 'cashier' },
    { path: cashierFinanceBase ? `${cashierFinanceBase}/budget` : '', label: 'Budget', icon: FiPieChart, role: 'cashier' },
    { path: cashierFinanceBase ? `${cashierFinanceBase}/profit-loss` : '', label: 'P&L', icon: FiPercent, role: 'cashier' },
    { path: cashierFinanceBase ? `${cashierFinanceBase}/inventory` : '', label: 'Inventory', icon: FiBookOpen, role: 'cashier' },
    { path: cashierFinanceBase ? `${cashierFinanceBase}/payroll` : '', label: 'Payroll', icon: FiUsers, role: 'cashier' },
    { path: cashierFinanceBase ? `${cashierFinanceBase}/invoices` : '', label: 'Invoices', icon: FiFileText, role: 'cashier' },
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
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 shadow-sm sticky top-0 z-30 border-b border-transparent dark:border-gray-800">
        <div className="mx-auto px-4 sm:px-6 lg:px-20">
          <div className="flex justify-between items-center h-16">
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
      </header>

      {/* Navigation Tabs */}
      {!isPosRoute && currentNavItems.length > 0 && (
        <div className="border-b border-amber-100 bg-gradient-to-r from-white via-[#fffaf3] to-emerald-50/60 dark:border-gray-800 dark:from-gray-900 dark:via-gray-900 dark:to-gray-950">
          <div className="mx-auto px-4 py-3 sm:px-6 lg:px-8">
            <nav className="flex justify-center gap-11 overflow-x-auto rounded-2xl border border-amber-100 bg-white/85 p-2 shadow-sm backdrop-blur dark:border-gray-800 dark:bg-gray-900/85">
              {currentNavItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `group relative inline-flex h-11 shrink-0 items-center gap-2 rounded-xl px-3 text-sm font-semibold transition-all ${
                      isActive
                        ? 'bg-primary-700 text-white shadow-md'
                        : 'text-gray-600 hover:bg-amber-50 hover:text-primary-800 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white'
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
            : 'mx-auto px-4 sm:px-6 lg:px-20 py-8 dark:text-gray-100'
        }
      >
        <Outlet />
      </main>

      {/* Footer */}
      {!isPosRoute && (
        <footer className="bg-white dark:bg-gray-900 sticky bottom-0 w-full border-t dark:border-gray-800 mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <p className="text-center text-sm text-gray-500 dark:text-gray-400">
              &copy; {new Date().getFullYear()} QR Menu SaaS. All rights reserved.
            </p>
          </div>
        </footer>
      )}
    </div>
  )
}

export default EmployeeLayout
