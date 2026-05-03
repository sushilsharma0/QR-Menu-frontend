import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import { useSocket } from './useSocket'

const useNotification = () => {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const { socket } = useSocket()

  // Listen for notifications
  useEffect(() => {
    if (!socket) return

    const handleNewNotification = (data) => {
      setNotifications(prev => [data, ...prev])
      setUnreadCount(prev => prev + 1)
      
      // Show toast based on notification type
      switch (data.type) {
        case 'order':
          toast.success(data.message, {
            duration: 5000,
            icon: '🛒',
          })
          break
        case 'kyc':
          toast.success(data.message, {
            duration: 5000,
            icon: '✅',
          })
          break
        case 'alert':
          toast.error(data.message, {
            duration: 5000,
            icon: '⚠️',
          })
          break
        default:
          toast(data.message, {
            duration: 3000,
          })
      }
    }

    const handleOrderNotification = (data) => {
      setNotifications(prev => [{
        id: Date.now(),
        type: 'order',
        title: 'New Order',
        message: `New order #${data.orderNumber} received!`,
        data: data,
        timestamp: new Date(),
      }, ...prev])
      setUnreadCount(prev => prev + 1)
      
      toast.success(`New order #${data.orderNumber} received!`, {
        duration: 8000,
        icon: '🛒',
      })
    }

    const handleOrderUpdateNotification = (data) => {
      setNotifications(prev => [{
        id: Date.now(),
        type: 'order',
        title: 'Order Updated',
        message: `Order #${data.orderNumber} is now ${data.status}`,
        data: data,
        timestamp: new Date(),
      }, ...prev])
      setUnreadCount(prev => prev + 1)

      toast(`Order #${data.orderNumber} is now ${data.status}`, {
        duration: 5000,
        icon: '🔄',
      })
    }

    const handlePaymentUpdateNotification = (data) => {
      setNotifications(prev => [{
        id: Date.now(),
        type: 'subscription',
        title: 'Payment Updated',
        message: data?.message || `Payment updated for order #${data.orderNumber}`,
        data: data,
        timestamp: new Date(),
      }, ...prev])
      setUnreadCount(prev => prev + 1)

      toast.success(data?.message || `Payment updated for order #${data.orderNumber}`, {
        duration: 5000,
        icon: '💳',
      })
    }

    const handleKYCNotification = (data) => {
      setNotifications(prev => [{
        id: Date.now(),
        type: 'kyc',
        title: data.status === 'approved' ? 'KYC Approved' : 'KYC Rejected',
        message: `Your KYC has been ${data.status}`,
        data: data,
        timestamp: new Date(),
      }, ...prev])
      setUnreadCount(prev => prev + 1)
      
      if (data.status === 'approved') {
        toast.success('KYC Approved! You can now access all features.', {
          duration: 5000,
          icon: '✅',
        })
      } else {
        toast.error(`KYC Rejected: ${data.reason || 'Please resubmit'}`, {
          duration: 5000,
          icon: '❌',
        })
      }
    }

    const handleSubscriptionNotification = (data) => {
      setNotifications(prev => [{
        id: Date.now(),
        type: 'subscription',
        title: data.type === 'expiring' ? 'Subscription Expiring' : 'Plan Updated',
        message: data.message,
        data: data,
        timestamp: new Date(),
      }, ...prev])
      setUnreadCount(prev => prev + 1)
      
      if (data.type === 'expiring') {
        toast.error(data.message, {
          duration: 10000,
          icon: '⚠️',
        })
      } else {
        toast.success(data.message, {
          duration: 5000,
          icon: '📋',
        })
      }
    }

    const handleLowStockNotification = (data) => {
      setNotifications(prev => [{
        id: Date.now(),
        type: 'alert',
        title: 'Low Stock Alert',
        message: `${data.itemName} is running low (${data.currentStock} left)`,
        data: data,
        timestamp: new Date(),
      }, ...prev])
      setUnreadCount(prev => prev + 1)
      
      toast.error(`${data.itemName} is running low! Only ${data.currentStock} left.`, {
        duration: 10000,
        icon: '⚠️',
      })
    }

    socket.on('new_notification', handleNewNotification)
    socket.on('order_notification', handleOrderNotification)
    socket.on('new_order', handleOrderNotification)
    socket.on('order_updated', handleOrderUpdateNotification)
    socket.on('payment_updated', handlePaymentUpdateNotification)
    socket.on('kyc_notification', handleKYCNotification)
    socket.on('subscription_notification', handleSubscriptionNotification)
    socket.on('low_stock_alert', handleLowStockNotification)

    return () => {
      socket.off('new_notification', handleNewNotification)
      socket.off('order_notification', handleOrderNotification)
      socket.off('new_order', handleOrderNotification)
      socket.off('order_updated', handleOrderUpdateNotification)
      socket.off('payment_updated', handlePaymentUpdateNotification)
      socket.off('kyc_notification', handleKYCNotification)
      socket.off('subscription_notification', handleSubscriptionNotification)
      socket.off('low_stock_alert', handleLowStockNotification)
    }
  }, [socket])

  // Mark notification as read
  const markAsRead = useCallback((notificationId) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    )
    setUnreadCount(prev => Math.max(0, prev - 1))
  }, [])

  // Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    )
    setUnreadCount(0)
  }, [])

  // Clear all notifications
  const clearAll = useCallback(() => {
    setNotifications([])
    setUnreadCount(0)
  }, [])

  // Remove single notification
  const removeNotification = useCallback((notificationId) => {
    setNotifications(prev => prev.filter(notif => notif.id !== notificationId))
    const removed = notifications.find(n => n.id === notificationId)
    if (removed && !removed.read) {
      setUnreadCount(prev => Math.max(0, prev - 1))
    }
  }, [notifications])

  // Add custom notification
  const addNotification = useCallback((notification) => {
    const newNotification = {
      id: Date.now(),
      read: false,
      timestamp: new Date(),
      ...notification,
    }
    setNotifications(prev => [newNotification, ...prev])
    setUnreadCount(prev => prev + 1)
    
    // Show toast
    if (notification.toast !== false) {
      const toastFn = notification.type === 'error' ? toast.error : 
                      notification.type === 'success' ? toast.success : 
                      toast
      toastFn(notification.message, {
        duration: 4000,
      })
    }
  }, [])

  // Get notifications by type
  const getNotificationsByType = useCallback((type) => {
    return notifications.filter(n => n.type === type)
  }, [notifications])

  // Get unread notifications
  const getUnreadNotifications = useCallback(() => {
    return notifications.filter(n => !n.read)
  }, [notifications])

  // Get recent notifications (last 24 hours)
  const getRecentNotifications = useCallback(() => {
    const oneDayAgo = new Date()
    oneDayAgo.setHours(oneDayAgo.getHours() - 24)
    return notifications.filter(n => new Date(n.timestamp) > oneDayAgo)
  }, [notifications])

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearAll,
    removeNotification,
    addNotification,
    getNotificationsByType,
    getUnreadNotifications,
    getRecentNotifications,
    hasNotifications: notifications.length > 0,
    hasUnread: unreadCount > 0,
  }
}

export default useNotification