import React, { useState } from 'react'
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
  FiMenu,
  FiX,
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

function PlatformNav({ onNavigate }) {
  return (
    <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
      {menuItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          onClick={onNavigate}
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
  )
}

function PlatformSidebarShell({ user, onClose, mobile = false }) {
  return (
    <div className="flex h-full flex-col bg-white dark:bg-gray-900">
      <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
        <div>
          <h1 className="text-xl font-bold text-primary-600">QR Menu SaaS</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Platform Admin</p>
        </div>
        {mobile && (
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-50 text-gray-700 dark:bg-gray-800 dark:text-gray-200"
            aria-label="Close sidebar"
          >
            <FiX className="h-5 w-5" />
          </button>
        )}
      </div>

      <PlatformNav onNavigate={mobile ? onClose : undefined} />

      <div className="p-4 border-t border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
            <span className="text-primary-600 font-medium">
              {user?.name?.charAt(0) || 'A'}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">{user?.name}</p>
            <p className="truncate text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

const PlatformSidebar = () => {
  const { user } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  if (user?.role !== 'super_admin' && user?.role !== 'admin') {
    return null
  }

  return (
    <>
      <div className="fixed left-0 right-0 top-0 z-[60] flex h-14 items-center gap-3 border-b border-gray-200 bg-white px-4 dark:border-gray-800 dark:bg-gray-900 lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-surface-50 text-gray-700 dark:bg-gray-800 dark:text-gray-200"
          aria-label="Open sidebar"
        >
          <FiMenu className="h-5 w-5" />
        </button>
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary-600 to-secondary-500 text-white">
            <FiShield className="h-4 w-4" />
          </div>
          <h1 className="truncate text-sm font-black text-gray-950 dark:text-gray-100">Platform Admin</h1>
        </div>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-[65] bg-black/50 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <div
        className={`fixed left-0 top-0 z-[70] h-full w-72 transform bg-white shadow-2xl transition-transform duration-300 ease-in-out dark:bg-gray-900 lg:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <PlatformSidebarShell user={user} onClose={() => setMobileOpen(false)} mobile />
      </div>

      <aside className="sticky top-0 hidden h-screen w-64 flex-shrink-0 border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 lg:flex">
        <PlatformSidebarShell user={user} />
      </aside>
    </>
  )
}

export default PlatformSidebar
