import React from 'react'
import { useAuth } from '../../hooks/useAuth'
import { FiLogOut, FiMoon, FiSun, FiUser } from 'react-icons/fi'
import NotificationMenu from './NotificationMenu'
import { useTheme } from '../../context/ThemeContext'

const Header = () => {
  const { user, logout } = useAuth()
  const { isDark, toggleTheme } = useTheme()

  const loginRoleAfterLogout = () => {
    if (user?.role === 'super_admin' || user?.role === 'admin') return 'platform'
    if (user?.scope === 'employee') return 'employee'
    if (user?.role === 'restaurant') return 'restaurant'
    return undefined
  }

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-surface-200 dark:border-gray-800 px-6 pt-20 md:pt-16 lg:pt-5 pb-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-primary-900 dark:text-gray-100">
            Welcome back, {user?.name?.split(' ')[0] || 'User'}!
          </h2>
          <p className="text-sm text-accent-700 dark:text-gray-400 mt-1">Here's what's happening with your account today.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-accent-700 dark:text-gray-200 hover:bg-surface-100 dark:hover:bg-gray-800 transition-colors"
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? <FiSun className="h-5 w-5" /> : <FiMoon className="h-5 w-5" />}
          </button>
          <NotificationMenu />
          
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
              <FiUser className="h-4 w-4 text-primary-600" />
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-medium text-primary-900 dark:text-gray-100">{user?.name}</p>
              <p className="text-xs text-accent-700 dark:text-gray-400 capitalize">{user?.role}</p>
            </div>
          </div>
          
          <button
            onClick={() => logout({ loginRole: loginRoleAfterLogout() })}
            className="p-2 text-accent-500 dark:text-gray-400 hover:text-secondary-600 dark:hover:text-gray-200 transition-colors"
            title="Logout"
          >
            <FiLogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  )
}

export default Header