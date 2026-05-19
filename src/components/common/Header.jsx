import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import toast from '@utils/toast'
import { useAuth } from '../../hooks/useAuth'
import { usePlanAccess } from '../../hooks/usePlanAccess'
import { FiChevronDown, FiLogOut, FiMail, FiMoon, FiSettings, FiSun, FiUser, FiZap } from 'react-icons/fi'
import NotificationMenu from './NotificationMenu'
import { useTheme } from '../../context/ThemeContext'
import { getTenantSegments, restaurantPortalBase, branchPortalBase } from '../../utils/tenantPaths'
import { useBranch } from '../../context/BranchContext'

const Header = () => {
  const { user, logout } = useAuth()
  const { isPlanReadOnly, isFeatureEnabled, toastLocked } = usePlanAccess()
  const { isDark, toggleTheme } = useTheme()
  const { selectedBranch } = useBranch()
  const [profileOpen, setProfileOpen] = useState(false)
  const [confirmLogout, setConfirmLogout] = useState(false)
  const profileRef = useRef(null)
  const { slug, restaurantId } = getTenantSegments(user)
  const portalBase =
    user?.scope === 'branch_user'
      ? branchPortalBase(user?.restaurantId, user?.branchPortalKey, user?.branchSlug)
      : restaurantPortalBase(slug, restaurantId)
  const profileImage = user?.logo || user?.profilePhoto
  const accountSettingsHidden = user?.role === 'restaurant' && !isFeatureEnabled('accountSettings')

  const loginRoleAfterLogout = () => {
    if (user?.role === 'super_admin' || user?.role === 'admin') return 'platform'
    if (user?.scope === 'employee') return 'employee'
    if (user?.scope === 'branch_user') return 'branch'
    if (user?.role === 'restaurant') return 'restaurant'
    return undefined
  }

  const roleLabel =
    user?.scope === 'branch_user'
      ? String(user?.role || '').replace(/_/g, ' ')
      : user?.scope === 'employee'
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
      <div className="portal-header-card flex flex-col gap-3 rounded-2xl border border-surface-200 bg-gradient-to-r from-white via-surface-50 to-primary-50 px-4 py-3 shadow-sm dark:border-gray-800 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 lg:flex-row lg:items-center lg:justify-between lg:gap-4 xl:rounded-3xl xl:py-4">
        <div className="flex min-w-0 items-center gap-4">
          <div className="hidden h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-600 to-secondary-500 text-white shadow-md sm:flex">
            <FiZap className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-lg font-black tracking-tight text-gray-950 dark:text-gray-100 xl:text-xl">
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
          {selectedBranch?.name && (
            <div className="hidden max-w-[220px] truncate rounded-xl border border-primary-100 bg-white/80 px-3 py-2 text-sm font-bold text-gray-700 shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 sm:block">
              {selectedBranch.name}
            </div>
          )}
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
                    {user?.role === 'restaurant' && portalBase && !accountSettingsHidden && (
                      <>
                        <Link
                          to={`${portalBase}/settings`}
                          onClick={() => {
                            if (isPlanReadOnly) toast.info(toastLocked('settings'))
                            setProfileOpen(false)
                          }}
                          className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold text-gray-700 transition hover:bg-surface-50 dark:text-gray-200 dark:hover:bg-gray-800"
                        >
                          <FiSettings className="h-4 w-4 text-primary-600 dark:text-primary-300" />
                          Restaurant settings
                        </Link>
                        <Link
                          to={`${portalBase}/profile`}
                          onClick={() => {
                            if (isPlanReadOnly) toast.info(toastLocked('settings'))
                            setProfileOpen(false)
                          }}
                          className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold text-gray-700 transition hover:bg-surface-50 dark:text-gray-200 dark:hover:bg-gray-800"
                        >
                          <FiUser className="h-4 w-4 text-primary-600 dark:text-primary-300" />
                          Account security
                        </Link>
                      </>
                    )}
                    {user?.scope === 'branch_user' && portalBase && (
                      <Link
                        to={`${portalBase}/profile`}
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold text-gray-700 transition hover:bg-surface-50 dark:text-gray-200 dark:hover:bg-gray-800"
                      >
                        <FiUser className="h-4 w-4 text-primary-600 dark:text-primary-300" />
                        Branch profile
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setProfileOpen(false)
                        setConfirmLogout(true)
                      }}
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

      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {confirmLogout && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[9999] grid place-items-center bg-slate-950/55 p-4 backdrop-blur-sm"
              >
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 20, scale: 0.96 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className="w-full max-w-[420px] rounded-3xl border border-white/80 bg-white p-6 text-center shadow-2xl shadow-slate-950/25 dark:border-gray-800 dark:bg-gray-900"
                >
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-red-50 text-red-600 ring-8 ring-red-50/70 dark:bg-red-950/40 dark:text-red-300 dark:ring-red-950/20">
                    <FiLogOut className="h-7 w-7" />
                  </div>
                  <h3 className="mt-6 text-2xl font-black tracking-tight text-gray-950 dark:text-gray-100">
                    Logout?
                  </h3>
                  <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-gray-500 dark:text-gray-400">
                    Your current session will end and you will return to the login screen.
                  </p>
                  <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => setConfirmLogout(false)}
                      className="rounded-2xl border border-surface-200 bg-white px-5 py-3 text-sm font-black text-gray-700 transition hover:bg-surface-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
                    >
                      Stay logged in
                    </button>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="rounded-2xl bg-red-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-red-900/20 transition hover:bg-red-700"
                    >
                      Logout
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </header>
  )
}

export default Header
