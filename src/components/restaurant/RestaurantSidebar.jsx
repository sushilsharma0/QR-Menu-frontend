import React, { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
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
} from 'react-icons/fi'
import api from '../../services/api'
import { useSocket } from '../../hooks/useSocket'
import { useAuth } from '../../hooks/useAuth'

const menuItems = [
  { path: '/restaurant/dashboard', icon: FiHome, label: 'Dashboard' },
  { path: '/restaurant/menu', icon: FiMenu, label: 'Menu' },
  { path: '/restaurant/orders', icon: FiShoppingCart, label: 'Orders' },
  { path: '/restaurant/tables', icon: FiGrid, label: 'Tables' },
  { path: '/restaurant/employees', icon: FiUsers, label: 'Employees' },
  { path: '/restaurant/kyc', icon: FiFileText, label: 'KYC' },
  { path: '/restaurant/subscription', icon: FiCreditCard, label: 'Subscription' },
  { path: '/restaurant/transactions', icon: FiCreditCard, label: 'Transactions' },
  { path: '/restaurant/profile', icon: FiUser, label: 'Profile' },
  { path: '/restaurant/settings', icon: FiSettings, label: 'Settings' },
]

const RestaurantSidebar = () => {
  const [pendingCount, setPendingCount] = useState(0)
  const { socket } = useSocket()
  const { user } = useAuth()
  const slug = user?.slug || user?.id
  const restaurantId = user?.id

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
            key={item.path}
            to={
              item.path === '/restaurant/dashboard' && slug && restaurantId
                ? `/restaurant/dashboard/${slug}/${restaurantId}`
                : item.path
            }
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
            {item.path === '/restaurant/orders' && pendingCount > 0 && (
              <span className="ml-auto min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-xs font-semibold flex items-center justify-center">
                {pendingCount > 99 ? '99+' : pendingCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}

export default RestaurantSidebar