import React, { useEffect, useRef, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { FiChevronDown, FiLogOut, FiMoon, FiSun, FiUser } from 'react-icons/fi'
import NotificationMenu from '../common/NotificationMenu'
import { useTheme } from '../../context/ThemeContext'
import { useBranch } from '../../context/BranchContext'

const ManagerHeader = () => {
  const { user, logout } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const { selectedBranch } = useBranch()
  const [profileOpen, setProfileOpen] = useState(false)
  const [confirmLogout, setConfirmLogout] = useState(false)
  const profileRef = useRef(null)

  const roleLabel =
    user?.role === 'admin' ? 'Operations Admin' : user?.role === 'manager' ? 'Manager' : user?.role

  useEffect(() => {
    const handleClick = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleLogout = () => {
    setConfirmLogout(false)
    setProfileOpen(false)
    logout({ loginRole: 'employee' })
  }

  return (
    <header className="relative z-30 border-b border-surface-200 bg-white/90 px-4 pb-4 pt-20 shadow-sm backdrop-blur dark:border-gray-800 dark:bg-gray-900/92 md:px-6 md:pt-16 lg:pt-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-700 dark:text-primary-300">
            Manager Portal
          </p>
          <h1 className="truncate text-xl font-black text-gray-950 dark:text-gray-100 md:text-2xl">
            {user?.restaurantName || user?.name || 'Branch Operations'}
          </h1>
          {selectedBranch?.name && (
            <p className="mt-0.5 truncate text-sm text-gray-500 dark:text-gray-400">{selectedBranch.name}</p>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={toggleTheme}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-50 text-gray-600 transition hover:bg-surface-100 dark:bg-gray-800 dark:text-gray-300"
            title={isDark ? 'Light mode' : 'Dark mode'}
          >
            {isDark ? <FiSun className="h-5 w-5" /> : <FiMoon className="h-5 w-5" />}
          </button>
          <NotificationMenu />
          <div className="relative" ref={profileRef}>
            <button
              type="button"
              onClick={() => setProfileOpen((v) => !v)}
              className="flex items-center gap-2 rounded-2xl border border-surface-200 bg-white px-2 py-1.5 shadow-sm dark:border-gray-700 dark:bg-gray-900"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-100 dark:bg-gray-800">
                <FiUser className="h-4 w-4 text-primary-700 dark:text-primary-300" />
              </div>
              <div className="hidden text-left sm:block">
                <p className="max-w-[140px] truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {user?.name || user?.username}
                </p>
                <p className="text-xs capitalize text-gray-500 dark:text-gray-400">{roleLabel}</p>
              </div>
              <FiChevronDown className="h-4 w-4 text-gray-400" />
            </button>
            {profileOpen && (
              <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-2xl border border-surface-200 bg-white py-2 shadow-xl dark:border-gray-700 dark:bg-gray-900">
                <button
                  type="button"
                  onClick={() => setConfirmLogout(true)}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                >
                  <FiLogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {confirmLogout && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900">
            <h3 className="text-lg font-bold text-gray-950 dark:text-gray-100">Sign out?</h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">You will need to sign in again to access the manager portal.</p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmLogout(false)}
                className="rounded-xl px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-surface-50 dark:text-gray-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

export default ManagerHeader
