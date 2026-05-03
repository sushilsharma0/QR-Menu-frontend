import React, { useEffect, useState } from 'react'
import { NavLink, Link } from 'react-router-dom'
import {
  FiHome,
  FiMenu,
  FiShoppingCart,
  FiGrid,
  FiUsers,
  FiFileText,
  FiCreditCard,
  FiSettings,
  FiUser,
  FiTag,
  FiActivity,
} from 'react-icons/fi'
import api from '../../services/api'
import { useSocket } from '../../hooks/useSocket'
import { useAuth } from '../../hooks/useAuth'
import { useTenantRoutes } from '../../hooks/useTenantRoutes'

function staffLoginHref(restaurantId, staff) {
  const q = new URLSearchParams({
    role: 'employee',
    staff,
    restaurantId: String(restaurantId),
  })
  return `/login?${q.toString()}`
}

const menuItems = [
  { segment: 'dashboard', icon: FiHome, label: 'Dashboard' },
  { segment: 'menu', icon: FiMenu, label: 'Menu' },
  { segment: 'orders', icon: FiShoppingCart, label: 'Orders' },
  { segment: 'tables', icon: FiGrid, label: 'Tables' },
  { segment: 'employees', icon: FiUsers, label: 'Employees' },
  { segment: 'kyc', icon: FiFileText, label: 'KYC' },
  { segment: 'subscription', icon: FiCreditCard, label: 'Subscription' },
  { segment: 'transactions', icon: FiCreditCard, label: 'Transactions' },
  { segment: 'promotions', icon: FiTag, label: 'Promotions' },
  { segment: 'logs', icon: FiActivity, label: 'System Logs' },
  { segment: 'profile', icon: FiUser, label: 'Profile' },
  { segment: 'settings', icon: FiSettings, label: 'Settings' },
]

const RestaurantSidebar = () => {
  const [pendingCount, setPendingCount] = useState(0)
  const { socket } = useSocket()
  const { user } = useAuth()
  const { restaurantBase, hasTenant, restaurantId } = useTenantRoutes()

  const fetchPendingCount = async () => {
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
  }, [])

  useEffect(() => {
    if (!socket) return undefined

    const refreshPendingCount = () => {
      fetchPendingCount()
    }

    socket.on('new_order', refreshPendingCount)
    socket.on('order_updated', refreshPendingCount)

    return () => {
      socket.off('new_order', refreshPendingCount)
      socket.off('order_updated', refreshPendingCount)
    }
  }, [socket])

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-primary-600">QR Menu SaaS</h1>
        <p className="text-sm text-gray-500 mt-1">Restaurant Portal</p>
      </div>
      
      <nav className="flex-1 px-4 py-6 space-y-1">
        {menuItems.map((item) => (
          <NavLink
            key={item.segment}
            to={`${restaurantBase}/${item.segment}`}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 text-gray-600 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-primary-50 text-primary-700 font-medium'
                  : 'hover:bg-gray-100 hover:text-gray-900'
              }`
            }
          >
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
            {item.segment === 'orders' && pendingCount > 0 && (
              <span className="ml-auto min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-xs font-semibold flex items-center justify-center">
                {pendingCount > 99 ? '99+' : pendingCount}
              </span>
            )}
          </NavLink>
        ))}

        {hasTenant && restaurantId != null && (
          <div className="mt-8 pt-6 border-t border-gray-200 space-y-1">
            <p className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Staff login pages
            </p>
            <Link
              to={staffLoginHref(restaurantId, 'kitchen')}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-3 text-gray-600 rounded-lg hover:bg-gray-100 hover:text-gray-900 text-sm"
            >
              Open kitchen staff login
            </Link>
            <Link
              to={staffLoginHref(restaurantId, 'cashier')}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-3 text-gray-600 rounded-lg hover:bg-gray-100 hover:text-gray-900 text-sm"
            >
              Open cashier staff login
            </Link>
          </div>
        )}
      </nav>
    </aside>
  )
}

export default RestaurantSidebar