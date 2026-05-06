import React, { useState } from 'react'
import {
  FiBell,
  FiCheckCircle,
  FiClock,
  FiShoppingBag,
  FiXCircle,
} from 'react-icons/fi'
import useNotification from '../../hooks/useNotification'

const NotificationMenu = () => {
  const [isOpen, setIsOpen] = useState(false)
  const {
    notifications,
    unreadCount,
    markAllAsRead,
  } = useNotification()

  const handleToggle = () => {
    setIsOpen((prev) => {
      const next = !prev
      if (next && unreadCount > 0) {
        markAllAsRead()
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
    if (type === 'order') {
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
    <div className="relative">
      <button
        type="button"
        onClick={handleToggle}
        className="p-2.5 text-accent-700 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-colors relative"
        aria-label="Open notifications"
      >
        <FiBell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 text-white text-[10px] leading-[18px] text-center font-semibold shadow-sm">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-10 cursor-default"
            onClick={() => setIsOpen(false)}
            aria-label="Close notifications"
          />
          <div className="absolute right-0 mt-2 w-[430px] max-w-[95vw] bg-white border border-surface-200 rounded-2xl shadow-[0_20px_50px_-12px_rgba(143,40,0,0.25)] z-20 overflow-hidden">
            <div className="px-4 py-4 border-b bg-gradient-to-br from-surface-50 via-secondary-50 to-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-primary-900 tracking-tight">Notifications</p>
                  <p className="text-xs text-accent-700 mt-0.5">
                    {unreadCount} unread • {notifications.length} total
                  </p>
                </div>
                <div className="h-9 w-9 rounded-xl bg-white/90 border border-surface-200 text-primary-600 flex items-center justify-center shadow-sm">
                  <FiBell className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2 text-[11px] text-primary-700">
                <span className="inline-flex h-2 w-2 rounded-full bg-primary-500" />
                Auto-marked as read when opened
              </div>
            </div>

            <div className="max-h-[450px] overflow-y-auto bg-gradient-to-b from-surface-50/50 to-white p-2.5">
              {notifications.length === 0 ? (
                <div className="m-2 rounded-2xl bg-white border border-dashed border-surface-300 px-4 py-10 text-center">
                  <FiBell className="h-6 w-6 text-surface-400 mx-auto mb-2" />
                  <p className="text-sm text-accent-700">No notifications yet</p>
                </div>
              ) : (
                notifications.slice(0, 20).map((notification) => {
                  const typeMeta = getTypeMeta(notification.type)
                  const TypeIcon = typeMeta.icon

                  return (
                    <div
                      key={notification.id}
                      className={`group mb-2.5 rounded-2xl border p-3.5 transition-all ${
                        notification.read
                          ? 'bg-white border-surface-200'
                          : 'bg-gradient-to-r from-secondary-50/60 to-surface-50 border-secondary-200 shadow-sm'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex gap-3 min-w-0">
                          <div className={`h-10 w-10 rounded-xl flex items-center justify-center shadow-sm ${typeMeta.tone}`}>
                            <TypeIcon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              {!notification.read && (
                                <span className={`w-2 h-2 rounded-full ${typeMeta.dot}`} />
                              )}
                              <p className="text-sm font-semibold text-primary-900 truncate tracking-tight">
                                {notification.title || 'Notification'}
                              </p>
                            </div>
                            <p className="text-sm text-accent-800 mt-1.5 break-words line-clamp-2">
                              {notification.message}
                            </p>
                            <p className="text-xs text-accent-500 mt-2.5">
                              {formatTimeAgo(notification.timestamp)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                          {!notification.read && (
                            <span className="text-[11px] text-primary-600 font-medium">
                              New
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default NotificationMenu
