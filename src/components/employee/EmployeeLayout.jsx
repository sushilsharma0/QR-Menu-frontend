import React, { useEffect, useState } from 'react'
import { Outlet, Link, NavLink, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { FiLogOut, FiUser, FiClock, FiGrid, FiPlusCircle } from 'react-icons/fi'
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
  const waiterDashboardPath = wb ? `${wb}/dashboard` : ''
  const waiterOrderPath = wb ? `${wb}/order` : ''

  const navItems = [
    { path: kitchenOrdersPath, label: 'Order History', icon: FiClock, role: 'kitchen', showPending: true },
    { path: cashierDashboardPath, label: 'Orders', icon: TbCurrencyRupee, role: 'cashier' },
    { path: waiterDashboardPath, label: 'Dashboard', icon: FiGrid, role: 'waiter' },
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 shadow-sm sticky top-0 z-30 border-b border-transparent dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
      {currentNavItems.length > 0 && (
        <div className="bg-white dark:bg-gray-900 border-b dark:border-gray-800">
          <div className="max-w-7xl mx-auto px-4  sm:px-6 lg:px-8">
            <nav className="flex gap-8">
              {currentNavItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-2 py-3 px-1 text-sm font-medium border-b-2 transition-all ${
                      isActive
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-700'
                    }`
                  }
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                  {item.showPending && pendingCount > 0 && (
                    <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-xs font-semibold flex items-center justify-center">
                      {pendingCount > 99 ? '99+' : pendingCount}
                    </span>
                  )}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 dark:text-gray-100">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-900 sticky bottom-0 w-full border-t dark:border-gray-800 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            &copy; {new Date().getFullYear()} QR Menu SaaS. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}

export default EmployeeLayout