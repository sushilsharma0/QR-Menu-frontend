import React from 'react'
import { NavLink } from 'react-router-dom'
import {
  FiHome,
  FiUsers,
  FiFileText,
  FiCreditCard,
  FiLayout,
  FiSettings,
  FiShield,
  FiActivity,
  FiClipboard,
  FiBarChart2,
} from 'react-icons/fi'
import { useAuth } from '../../hooks/useAuth'

const menuItems = [
  { path: '/platform/dashboard', icon: FiHome, label: 'Dashboard' },
  { path: '/platform/restaurants', icon: FiUsers, label: 'Restaurants' },
  { path: '/platform/kyc', icon: FiFileText, label: 'KYC Verification' },
  { path: '/platform/subscriptions', icon: FiCreditCard, label: 'Subscriptions' },
  { path: '/platform/subscription-payments', icon: FiCreditCard, label: 'Payments' },
  { path: '/platform/invoices', icon: FiClipboard, label: 'Invoices' },
  { path: '/platform/subscription-activity', icon: FiBarChart2, label: 'Subscription activity' },
  { path: '/platform/cms', icon: FiLayout, label: 'CMS' },
  { path: '/platform/tickets', icon: FiActivity, label: 'Support Tickets' },
  { path: '/platform/admins', icon: FiShield, label: 'Admins' },
  { path: '/platform/logs', icon: FiActivity, label: 'System Logs' },
  { path: '/platform/settings', icon: FiSettings, label: 'Settings' },
]

const PlatformSidebar = () => {
  const { user } = useAuth()

  if (user?.role !== 'super_admin' && user?.role !== 'admin') {
    return null
  }

  return (
    <aside className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col">
      <div className="p-6 border-b border-gray-200 dark:border-gray-800">
        <h1 className="text-xl font-bold text-primary-600">QR Menu SaaS</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Platform Admin</p>
      </div>
      
      <nav className="flex-1 px-4 py-6 space-y-1">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 text-gray-600 dark:text-gray-300 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-primary-50 dark:bg-gray-800 text-primary-700 dark:text-gray-100 font-medium'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
              }`
            }
          >
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
            <span className="text-primary-600 font-medium">
              {user?.name?.charAt(0) || 'A'}
            </span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{user?.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
          </div>
        </div>
      </div>
    </aside>
  )
}

export default PlatformSidebar
