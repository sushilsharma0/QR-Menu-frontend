import React from 'react'
import { useAuth } from '../../hooks/useAuth'
import { FiLogOut, FiMoon, FiSun, FiUser, FiZap } from 'react-icons/fi'
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

  const roleLabel =
    user?.scope === 'employee'
      ? user?.role
      : user?.role === 'super_admin'
        ? 'Super Admin'
        : user?.role === 'admin'
          ? 'Platform Admin'
          : user?.role || 'User'

  return (
    <header className="border-b border-surface-200 bg-white/90 px-4 pb-4 pt-20 shadow-sm backdrop-blur dark:border-gray-800 dark:bg-gray-900/92 md:px-6 md:pt-16 lg:pt-4">
      <div className="flex flex-col gap-4 rounded-3xl border border-surface-200 bg-gradient-to-r from-white via-surface-50 to-primary-50 px-4 py-4 shadow-sm dark:border-gray-800 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <div className="hidden h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-600 to-secondary-500 text-white shadow-md sm:flex">
            <FiZap className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-xl font-black tracking-tight text-gray-950 dark:text-gray-100">
                Welcome back, {user?.name?.split(' ')[0] || 'User'}!
              </h2>
              <span className="rounded-full bg-primary-100 px-2.5 py-1 text-xs font-bold capitalize text-primary-700 dark:bg-gray-800 dark:text-primary-300">
                {roleLabel}
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Here&apos;s what&apos;s happening with your account today.
            </p>
          </div>
        </div>
        
        <div className="flex items-center justify-between gap-3 lg:justify-end">
          <button
            onClick={toggleTheme}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-surface-200 bg-white text-primary-700 shadow-sm transition hover:bg-surface-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-800"
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? <FiSun className="h-5 w-5" /> : <FiMoon className="h-5 w-5" />}
          </button>
          <NotificationMenu />
          
          <div className="flex items-center gap-3 rounded-2xl border border-surface-200 bg-white px-3 py-2 shadow-sm dark:border-gray-700 dark:bg-gray-900">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-100 dark:bg-gray-800">
              <FiUser className="h-4 w-4 text-primary-600 dark:text-primary-300" />
            </div>
            <div className="hidden md:block">
              <p className="max-w-40 truncate text-sm font-bold text-gray-950 dark:text-gray-100">{user?.name}</p>
              <p className="text-xs capitalize text-gray-500 dark:text-gray-400">{user?.email || roleLabel}</p>
            </div>
          </div>
          
          <button
            onClick={() => logout({ loginRole: loginRoleAfterLogout() })}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-surface-200 bg-white text-gray-500 shadow-sm transition hover:border-red-100 hover:bg-red-50 hover:text-red-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-red-300"
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
