import React, { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useAuth } from '../../hooks/useAuth'
import { FiChevronDown, FiLogOut, FiMail, FiMoon, FiSettings, FiSun, FiUser, FiZap } from 'react-icons/fi'
import NotificationMenu from './NotificationMenu'
import { useTheme } from '../../context/ThemeContext'
import { getTenantSegments, restaurantPortalBase } from '../../utils/tenantPaths'

const Header = () => {
  const { user, logout } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const [profileOpen, setProfileOpen] = useState(false)
  const [confirmLogout, setConfirmLogout] = useState(false)
  const profileRef = useRef(null)
  const { slug, restaurantId } = getTenantSegments(user)
  const restaurantBase = restaurantPortalBase(slug, restaurantId)
  const profileImage = user?.logo || user?.profilePhoto

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
    logout({ loginRole: loginRoleAfterLogout() })
  }

  const avatar = (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-primary-100 ring-2 ring-white dark:bg-gray-800 dark:ring-gray-900">
      {profileImage ? (
        <img src={profileImage} alt={user?.name || 'Profile'} className="h-full w-full object-cover" />
      ) : (
        <FiUser className="h-4 w-4 text-primary-600 dark:text-primary-300" />
      )}
    </div>
  )

  return (
    <header className="relative z-30 border-b border-surface-200 bg-white/90 px-4 pb-4 pt-20 shadow-sm backdrop-blur dark:border-gray-800 dark:bg-gray-900/92 md:px-6 md:pt-16 lg:pt-4">
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
          
          <div ref={profileRef} className="relative">
            <button
              type="button"
              onClick={() => setProfileOpen((current) => !current)}
              className="flex items-center gap-3 rounded-2xl border border-surface-200 bg-white px-3 py-2 shadow-sm transition hover:-translate-y-0.5 hover:border-primary-100 hover:shadow-md dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-gray-800"
              aria-expanded={profileOpen}
              aria-label="Open profile menu"
            >
              {avatar}
              <div className="hidden text-left md:block">
                <p className="max-w-40 truncate text-sm font-bold text-gray-950 dark:text-gray-100">{user?.name}</p>
                <p className="max-w-40 truncate text-xs text-gray-500 dark:text-gray-400">{user?.email || roleLabel}</p>
              </div>
              <FiChevronDown className={`h-4 w-4 text-gray-400 transition ${profileOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {profileOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.98 }}
                  transition={{ duration: 0.18 }}
                  className="absolute right-0 z-30 mt-3 w-[310px] overflow-hidden rounded-3xl border border-surface-200 bg-white shadow-2xl shadow-slate-900/15 dark:border-gray-800 dark:bg-gray-900"
                >
                  <div className="bg-gradient-to-br from-primary-50 via-white to-surface-50 p-4 dark:from-gray-800 dark:via-gray-900 dark:to-gray-900">
                    <div className="flex items-center gap-3">
                      {avatar}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-gray-950 dark:text-gray-100">{user?.name || 'User'}</p>
                        <p className="truncate text-xs text-gray-500 dark:text-gray-400">{roleLabel}</p>
                      </div>
                    </div>
                    <div className="mt-4 rounded-2xl border border-white/80 bg-white/80 p-3 text-xs text-gray-600 shadow-sm dark:border-gray-800 dark:bg-gray-950/60 dark:text-gray-300">
                      <div className="flex items-center gap-2">
                        <FiMail className="h-4 w-4 text-primary-600 dark:text-primary-300" />
                        <span className="truncate">{user?.email || 'No email added'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="grid gap-1 p-2">
                    {user?.role === 'restaurant' && restaurantBase && (
                      <>
                        <Link
                          to={`${restaurantBase}/settings`}
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold text-gray-700 transition hover:bg-surface-50 dark:text-gray-200 dark:hover:bg-gray-800"
                        >
                          <FiSettings className="h-4 w-4 text-primary-600 dark:text-primary-300" />
                          Restaurant settings
                        </Link>
                        <Link
                          to={`${restaurantBase}/profile`}
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold text-gray-700 transition hover:bg-surface-50 dark:text-gray-200 dark:hover:bg-gray-800"
                        >
                          <FiUser className="h-4 w-4 text-primary-600 dark:text-primary-300" />
                          Account security
                        </Link>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => setConfirmLogout(true)}
                      className="flex items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-bold text-red-600 transition hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-950/30"
                    >
                      <FiLogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {confirmLogout && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.96 }}
              className="w-full max-w-md rounded-3xl border border-white/80 bg-white p-6 shadow-2xl dark:border-gray-800 dark:bg-gray-900"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300">
                  <FiLogOut className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-950 dark:text-gray-100">Are you sure you want to logout?</h3>
                  <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-400">
                    Your current session will end and you will return to the login screen.
                  </p>
                </div>
              </div>
              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setConfirmLogout(false)}
                  className="rounded-2xl border border-surface-200 bg-white px-5 py-3 text-sm font-black text-gray-700 transition hover:bg-surface-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-2xl bg-red-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-red-900/20 transition hover:bg-red-700"
                >
                  Yes, logout
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}

export default Header
