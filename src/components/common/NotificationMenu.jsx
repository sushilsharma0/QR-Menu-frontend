import React, { useState } from 'react'
import {
  FiBell,
  FiCheck,
  FiCheckCircle,
  FiClock,
  FiShoppingBag,
  FiTrash2,
  FiXCircle,
} from 'react-icons/fi'
import useNotification from '../../hooks/useNotification'

const NotificationMenu = () => {
  const [isOpen, setIsOpen] = useState(false)
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearAll,
    removeNotification,
  } = useNotification()

  const handleToggle = () => {
    setIsOpen((prev) => !prev)
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
        tone: 'bg-blue-100 text-blue-700',
        dot: 'bg-blue-500',
      }
    }
    if (type === 'kyc') {
      return {
        icon: FiCheckCircle,
        tone: 'bg-green-100 text-green-700',
        dot: 'bg-green-500',
      }
    }
    if (type === 'alert') {
      return {
        icon: FiXCircle,
        tone: 'bg-red-100 text-red-700',
        dot: 'bg-red-500',
      }
    }
    return {
      icon: FiClock,
      tone: 'bg-violet-100 text-violet-700',
      dot: 'bg-violet-500',
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleToggle}
        className="p-2.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-colors relative"
        aria-label="Open notifications"
      >
        <FiBell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-gradient-to-r from-red-500 to-rose-500 text-white text-[10px] leading-[18px] text-center font-semibold shadow-sm">
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
          <div className="absolute right-0 mt-2 w-[420px] max-w-[95vw] bg-white border border-gray-200 rounded-2xl shadow-2xl z-20 overflow-hidden">
            <div className="px-4 py-3 border-b bg-gradient-to-r from-slate-50 to-blue-50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Notifications</p>
                  <p className="text-xs text-gray-500">
                    {unreadCount} unread • {notifications.length} total
                  </p>
                </div>
                <div className="h-8 w-8 rounded-xl bg-white border border-blue-100 text-primary-600 flex items-center justify-center">
                  <FiBell className="h-4 w-4" />
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="text-xs text-primary-700 hover:text-primary-800 font-medium px-2.5 py-1.5 rounded-lg bg-white border border-blue-100"
                >
                  Mark all read
                </button>
                <button
                  type="button"
                  onClick={clearAll}
                  className="text-xs text-red-700 hover:text-red-800 font-medium px-2.5 py-1.5 rounded-lg bg-white border border-red-100"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="max-h-[440px] overflow-y-auto bg-slate-50/50 p-2">
              {notifications.length === 0 ? (
                <div className="m-2 rounded-xl bg-white border border-dashed border-gray-300 px-4 py-10 text-center">
                  <FiBell className="h-6 w-6 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No notifications yet</p>
                </div>
              ) : (
                notifications.slice(0, 20).map((notification) => {
                  const typeMeta = getTypeMeta(notification.type)
                  const TypeIcon = typeMeta.icon

                  return (
                    <div
                      key={notification.id}
                      className={`group mb-2 rounded-xl border p-3 transition-all ${
                        notification.read
                          ? 'bg-white border-gray-200'
                          : 'bg-white border-blue-200 shadow-sm'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex gap-3 min-w-0">
                          <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${typeMeta.tone}`}>
                            <TypeIcon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              {!notification.read && (
                                <span className={`w-2 h-2 rounded-full ${typeMeta.dot}`} />
                              )}
                              <p className="text-sm font-semibold text-gray-900 truncate">
                                {notification.title || 'Notification'}
                              </p>
                            </div>
                            <p className="text-sm text-gray-600 mt-1 break-words line-clamp-2">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-400 mt-2">
                              {formatTimeAgo(notification.timestamp)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                          {!notification.read && (
                            <button
                              type="button"
                              onClick={() => markAsRead(notification.id)}
                              className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg"
                              title="Mark as read"
                            >
                              <FiCheck className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => removeNotification(notification.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                            title="Remove notification"
                          >
                            <FiTrash2 className="h-4 w-4" />
                          </button>
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
