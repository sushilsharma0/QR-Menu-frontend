import React from 'react'
import { useAuth } from '../../hooks/useAuth'
import { FiLogOut, FiUser } from 'react-icons/fi'
import NotificationMenu from './NotificationMenu'

const Header = () => {
  const { user, logout } = useAuth()

  const loginRoleAfterLogout = () => {
    if (user?.role === 'super_admin' || user?.role === 'admin') return 'platform'
    if (user?.scope === 'employee') return 'employee'
    if (user?.role === 'restaurant') return 'restaurant'
    return undefined
  }

  return (
    <header className="bg-white border-b border-surface-200 px-6 py-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-primary-900">
            Welcome back, {user?.name?.split(' ')[0] || 'User'}!
          </h2>
          <p className="text-sm text-accent-700 mt-1">Here's what's happening with your account today.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <NotificationMenu />
          
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
              <FiUser className="h-4 w-4 text-primary-600" />
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-medium text-primary-900">{user?.name}</p>
              <p className="text-xs text-accent-700 capitalize">{user?.role}</p>
            </div>
          </div>
          
          <button
            onClick={() => logout({ loginRole: loginRoleAfterLogout() })}
            className="p-2 text-accent-500 hover:text-secondary-600 transition-colors"
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