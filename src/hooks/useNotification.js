import { useState, useEffect, useCallback, useRef } from 'react'
import toast from '@utils/toast'
import { useSocket } from './useSocket'
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../services/api'
import { useAuth } from './useAuth'
import { setBrowserFavicon } from '../utils/browserFavicon'
import { PLATFORM_FAVICON_SRC } from '../constants/platformBrand'
import { getNotificationSettings, playNotificationBell } from './useOrderAlerts'

const NOTIFICATION_TITLE_PREFIX = /^\(\d+\)\s+/

const useNotification = () => {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const seenRealtimeIdsRef = useRef(new Set())
  const { socket } = useSocket()
  const { user } = useAuth()
  const branchScopeId =
    (user?.scope === 'branch_user' || user?.scope === 'employee') && user?.branchId
      ? String(user.branchId)
      : ''

  const fetchNotifications = useCallback(async () => {
    const res = await getNotifications({ page: 1, limit: 50 })
    const payload = res?.data?.data || {}
    setNotifications(payload.notifications || [])
    setUnreadCount(payload.unreadCount || 0)
  }, [branchScopeId])

  useEffect(() => {
    fetchNotifications().catch(() => undefined)
  }, [fetchNotifications])

  useEffect(() => {
    const cleanTitle = (document.title || 'QR Menu SaaS').replace(NOTIFICATION_TITLE_PREFIX, '')
    document.title = unreadCount > 0 ? `(${unreadCount}) ${cleanTitle}` : cleanTitle
  }, [unreadCount])

  useEffect(() => {
    const isRestaurantSide =
      user?.role === 'restaurant' ||
      user?.scope === 'branch_user' ||
      user?.scope === 'employee' ||
      ['kitchen', 'cashier', 'manager', 'waiter', 'accountant'].includes(user?.role)

    void setBrowserFavicon(
      isRestaurantSide ? user?.favicon || user?.logo : PLATFORM_FAVICON_SRC,
    )
  }, [user?.favicon, user?.logo, user?.role, user?.scope])

  useEffect(() => {
    if (!socket) return

    const handleNewNotification = (data) => {
      const notificationBranchId = data?.branchId || data?.metadata?.branchId
      if (branchScopeId && String(notificationBranchId || '') !== branchScopeId) return
      const id = data?._id || data?.id
      if (id && seenRealtimeIdsRef.current.has(String(id))) return
      if (id) {
        seenRealtimeIdsRef.current.add(String(id))
        window.setTimeout(() => seenRealtimeIdsRef.current.delete(String(id)), 30000)
      }
      setNotifications((prev) => [data, ...prev])
      setUnreadCount((prev) => prev + 1)

      const isSecurityAlert =
        data?.category === 'security' ||
        data?.type === 'fraud_alert' ||
        data?.silent === true ||
        data?.metadata?.silent === true

      if (data?.type !== 'NEW_ORDER' && !isSecurityAlert) {
        toast(data?.message || data?.title || 'New notification')
      }

      if (data?.type === 'GUEST_TABLE_REQUEST') {
        const settings = getNotificationSettings()
        if (settings.soundEnabled) playNotificationBell(settings.restaurantVolume || 0.75)
        if ('vibrate' in navigator) navigator.vibrate([180, 70, 180])
      }
    }

    const handleRead = ({ notificationId, branchId }) => {
      if (branchScopeId && String(branchId || '') !== branchScopeId) return
      setNotifications((prev) =>
        prev.map((n) =>
          String(n._id) === String(notificationId)
            ? { ...n, isRead: true, readAt: new Date().toISOString() }
            : n
        )
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    }

    const handleAllRead = ({ branchId } = {}) => {
      if (branchScopeId && String(branchId || '') !== branchScopeId) return
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true, readAt: n.readAt || new Date().toISOString() }))
      )
      setUnreadCount(0)
    }

    socket.on('notification:new', handleNewNotification)
    socket.on('new_notification', handleNewNotification)
    socket.on('notification:read', handleRead)
    socket.on('notification:all-read', handleAllRead)

    return () => {
      socket.off('notification:new', handleNewNotification)
      socket.off('new_notification', handleNewNotification)
      socket.off('notification:read', handleRead)
      socket.off('notification:all-read', handleAllRead)
    }
  }, [branchScopeId, socket])

  const markAsRead = useCallback(async (notificationId) => {
    await markNotificationRead(notificationId)
    setNotifications((prev) =>
      prev.map((notif) =>
        String(notif._id) === String(notificationId)
          ? { ...notif, isRead: true, readAt: new Date().toISOString() }
          : notif
      )
    )
    setUnreadCount((prev) => Math.max(0, prev - 1))
  }, [])

  const markAllAsRead = useCallback(async () => {
    await markAllNotificationsRead()
    setNotifications((prev) =>
      prev.map((notif) => ({ ...notif, isRead: true, readAt: notif.readAt || new Date().toISOString() }))
    )
    setUnreadCount(0)
  }, [])

  const getUnreadNotifications = useCallback(() => {
    return notifications.filter((n) => !n.isRead)
  }, [notifications])

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    getUnreadNotifications,
    refreshNotifications: fetchNotifications,
    hasNotifications: notifications.length > 0,
    hasUnread: unreadCount > 0,
  }
}

export default useNotification
