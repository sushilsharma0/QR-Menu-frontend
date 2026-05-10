import React, { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  FiBell,
  FiCheckCircle,
  FiClock,
  FiShoppingBag,
  FiXCircle,
} from 'react-icons/fi'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import {
  cashierPortalBase,
  employeePortalBase,
  getTenantSegments,
  kitchenPortalBase,
  restaurantPortalBase,
  waiterPortalBase,
} from '../../utils/tenantPaths'
import useNotification from '../../hooks/useNotification'

const NotificationMenu = () => {
  const [isOpen, setIsOpen] = useState(false)
  const location = useLocation()
  const { user } = useAuth()
  const {
    notifications,
    unreadCount,
    markAllAsRead,
  } = useNotification()
  const { slug, restaurantId } = getTenantSegments(user)

  let notificationsPath = '/notifications'
  if (user?.role === 'super_admin' || user?.role === 'admin') {
    notificationsPath = '/platform/notifications'
  } else if (user?.role === 'restaurant') {
    notificationsPath = `${restaurantPortalBase(slug, restaurantId)}/notifications`
  } else if (user?.scope === 'employee' && user?.role === 'kitchen') {
    notificationsPath = `${kitchenPortalBase(slug, restaurantId)}/notifications`
  } else if (user?.scope === 'employee' && user?.role === 'cashier') {
    notificationsPath = `${cashierPortalBase(slug, restaurantId)}/notifications`
  } else if (user?.scope === 'employee' && user?.role === 'waiter') {
    notificationsPath = `${waiterPortalBase(slug, restaurantId)}/notifications`
  } else if (user?.scope === 'employee') {
    notificationsPath = `${employeePortalBase(slug, restaurantId)}/notifications`
  }

  useEffect(() => {
    setIsOpen(false)
  }, [location.pathname])

  const handleToggle = () => {
    setIsOpen((prev) => {
      const next = !prev
      if (next && unreadCount > 0) {
        void markAllAsRead()
      }
      return next
    })
  }

  const formatTimeAgo = (timestamp) => {
    const date = new Date(timestamp)
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
    if (seconds < 60) return 'Just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    return `${Math.floor(seconds / 86400)}d ago`
  }

  const getTypeMeta = (type) => {
    if (type === 'order' || type === 'NEW_ORDER' || type === 'ORDER_READY' || type === 'PAYMENT_RECEIVED') {
      return {
        icon: FiShoppingBag,
        tone: 'bg-secondary-100 text-secondary-700',
        dot: 'bg-secondary-500',
      }
    }
    if (type === 'kyc') {
      return {
        icon: FiCheckCircle,
        tone: 'bg-accent-100 text-accent-700',
        dot: 'bg-accent-500',
      }
    }
    if (type === 'alert') {
      return {
        icon: FiXCircle,
        tone: 'bg-primary-100 text-primary-700',
        dot: 'bg-primary-500',
      }
    }
    return {
      icon: FiClock,
      tone: 'bg-attention-100 text-attention-700',
      dot: 'bg-attention-500',
    }
  }

  return (
    <div className="relative z-50">
      <button
        type="button"
        onClick={handleToggle}
        className="p-2.5 text-accent-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-gray-100 hover:bg-primary-50 dark:hover:bg-gray-800 rounded-xl transition-colors relative"
        aria-label="Open notifications"
      >
        <FiBell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 text-white text-[10px] leading-[18px] text-center font-semibold shadow-sm">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
          <button
            type="button"
            className="fixed inset-0 z-[100] cursor-default bg-transparent"
            onClick={() => setIsOpen(false)}
            aria-label="Close notifications"
          />
          <motion.div
            initial={{ opacity: 0, y: -18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -18, scale: 0.98 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="absolute right-[-280%] md:right-0 mt-2 w-[430px] max-w-[95vw] bg-white dark:bg-gray-900 border border-surface-200 dark:border-gray-800 rounded-2xl shadow-[0_20px_50px_-12px_rgba(143,40,0,0.25)] z-[110] overflow-hidden"
          >
            <div className="px-4 py-4 border-b dark:border-gray-800 bg-gradient-to-br from-surface-50 via-secondary-50 to-white dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-primary-900 dark:text-gray-100 tracking-tight">Notifications</p>
                  <p className="text-xs text-accent-700 dark:text-gray-400 mt-0.5">
                    {unreadCount} unread • {notifications.length} total
                  </p>
                </div>
                <div className="h-9 w-9 rounded-xl bg-white/90 dark:bg-gray-800 border border-surface-200 dark:border-gray-700 text-primary-600 dark:text-gray-200 flex items-center justify-center shadow-sm">
                  <FiBell className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2 text-[11px] text-primary-700 dark:text-gray-300">
                <span className="inline-flex h-2 w-2 rounded-full bg-primary-500" />
                Notifications are kept permanently
              </div>
            </div>

            <motion.div
              initial="hidden"
              animate="show"
              className="max-h-[450px] overflow-y-auto bg-gradient-to-b from-surface-50/50 to-white dark:from-gray-900 dark:to-gray-900 p-2.5"
            >
              {notifications.length === 0 ? (
                <div className="m-2 rounded-2xl bg-white dark:bg-gray-900 border border-dashed border-surface-300 dark:border-gray-700 px-4 py-10 text-center">
                  <FiBell className="h-6 w-6 text-surface-400 dark:text-gray-500 mx-auto mb-2" />
                  <p className="text-sm text-accent-700 dark:text-gray-300">No notifications yet</p>
                </div>
              ) : (
                notifications.slice(0, 12).map((notification, index) => {
                  const typeMeta = getTypeMeta(notification.type)
                  const TypeIcon = typeMeta.icon

                  return (
                    <motion.div
                      key={notification._id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.035, duration: 0.2 }}
                      className={`group mb-2.5 rounded-2xl border p-3.5 transition-all ${
                        notification.isRead
                          ? 'bg-white dark:bg-gray-900 border-surface-200 dark:border-gray-800'
                          : 'bg-gradient-to-r from-secondary-50/60 to-surface-50 dark:from-gray-800 dark:to-gray-900 border-secondary-200 dark:border-gray-700 shadow-sm'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex gap-3 min-w-0">
                          <div className={`h-10 w-10 rounded-xl flex items-center justify-center shadow-sm ${typeMeta.tone}`}>
                            <TypeIcon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              {!notification.isRead && (
                                <span className={`w-2 h-2 rounded-full ${typeMeta.dot}`} />
                              )}
                              <p className="text-sm font-semibold text-primary-900 dark:text-gray-100 truncate tracking-tight">
                                {notification.title || 'Notification'}
                              </p>
                            </div>
                            <p className="text-sm text-accent-800 dark:text-gray-300 mt-1.5 break-words line-clamp-2">
                              {notification.message}
                            </p>
                            <p className="text-xs text-accent-500 dark:text-gray-500 mt-2.5">
                              {formatTimeAgo(notification.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                          {!notification.isRead && (
                            <span className="text-[11px] text-primary-600 dark:text-gray-200 font-medium">
                              New
                            </span>
                          )}
                        </div>
                      </div>
                      {/* <div className="pt-2 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => markAsRead(notification._id)}
                          disabled={notification.isRead}
                          className="text-xs px-2 py-1 rounded border border-surface-300 disabled:opacity-50"
                        >
                          {notification.isRead ? 'Read' : 'Mark read'}
                        </button>
                        {notification.actionUrl ? (
                          <a
                            href={notification.actionUrl}
                            className="text-xs inline-flex items-center gap-1 text-primary-600"
                          >
                            Open <FiExternalLink className="h-3 w-3" />
                          </a>
                        ) : null}
                      </div> */}
                    </motion.div>
                  )
                })
              )}
            </motion.div>
            <div className="border-t dark:border-gray-800 px-3 py-2 flex items-center justify-between bg-white dark:bg-gray-900">
              <button
                type="button"
                onClick={markAllAsRead}
                className="text-xs text-primary-700 dark:text-gray-200 font-medium"
              >
                Mark all as read
              </button>
              <Link
                to={notificationsPath}
                onClick={() => setIsOpen(false)}
                className="text-xs text-primary-700 dark:text-gray-200 font-medium"
              >
                View all
              </Link>
            </div>
          </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

export default NotificationMenu
