import React, { createContext, useState, useEffect, useCallback, useMemo } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from '../hooks/useAuth'
import { getSocketOrigin } from '../utils/runtimeConfig'
import { clearAuthSession } from '../utils/authStorage'

export const SocketContext = createContext()

let lastSocketConnectErrorLogMs = 0

const getLoginPathForCurrentPage = () => {
  if (typeof window === 'undefined') return '/login'
  const path = window.location.pathname || ''
  if (path.startsWith('/kitchen') || path.startsWith('/cashier') || path.startsWith('/employee')) {
    return '/login?role=employee'
  }
  if (path.startsWith('/branch')) return '/login'
  if (path.startsWith('/restaurant')) return '/login?role=restaurant'
  if (path.startsWith('/platform')) return '/login?role=platform'
  return '/login'
}

const decodeJwtPayload = (jwtToken) => {
  try {
    const payload = jwtToken?.split('.')?.[1]
    if (!payload) return null
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')
    return JSON.parse(atob(padded))
  } catch (err) {
    return null
  }
}

const isJwtExpired = (jwtToken) => {
  const exp = decodeJwtPayload(jwtToken)?.exp
  return Number.isFinite(exp) && exp * 1000 <= Date.now()
}

export const SocketProvider = ({ children }) => {
  const { user, token, isAuthenticated } = useAuth()
  const [socket, setSocket] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const [connectionError, setConnectionError] = useState(null)

  const socketOrigin = useMemo(() => getSocketOrigin(), [])
  const resolvedRestaurantId = user?.restaurantId || decodeJwtPayload(token)?.restaurantId

  const userId = user?.id
  const userRole = user?.role
  const userScope = user?.scope
  const branchId = user?.branchId

  // Initialize socket connection (depend on stable ids — avoid reconnecting when mergeUser replaces `user`)
  useEffect(() => {
    const canConnect = isAuthenticated || Boolean(token && userId)
    if (!canConnect || !userId) {
      // Disconnect if no user
      if (socket) {
        socket.disconnect()
        setSocket(null)
        setIsConnected(false)
      }
      return
    }

    if (isJwtExpired(token)) {
      clearAuthSession()
      setSocket(null)
      setIsConnected(false)
      setConnectionError('Session expired')
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = getLoginPathForCurrentPage()
      }
      return
    }

    // Create new socket connection
    const newSocket = io(socketOrigin, {
      auth: { token },
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    })

    setSocket(newSocket)

    // Connection event handlers
    newSocket.on('connect', () => {
      console.log('🔌 Socket connected:', newSocket.id)
      setIsConnected(true)
      setConnectionError(null)
      
      // Join appropriate room based on user role
      if (userId) {
        const recipientType =
          userScope === 'employee'
            ? 'employee'
            : userScope === 'branch_user' || userRole === 'restaurant'
              ? 'restaurant'
              : userRole === 'super_admin' || userRole === 'admin'
                ? 'platform'
                : null
        if (recipientType) {
          newSocket.emit('join:user', {
            recipientType,
            recipientId: userScope === 'branch_user' ? resolvedRestaurantId : userId,
          })
        }
        if (userScope === 'branch_user' && resolvedRestaurantId && branchId) {
          newSocket.emit('join:restaurant', resolvedRestaurantId)
          newSocket.emit('join:branch', { restaurantId: resolvedRestaurantId, branchId })
        } else if (userRole === 'restaurant') {
          newSocket.emit('join:restaurant', userId)
          console.log('Joined restaurant room:', userId)
        } else if (userScope === 'employee') {
          // Employees should also join restaurant room to receive
          // order/payment broadcasts emitted at restaurant level.
          if (resolvedRestaurantId) {
            newSocket.emit('join:restaurant', resolvedRestaurantId)
            console.log('Joined restaurant room:', resolvedRestaurantId)
          }
          newSocket.emit('join:employee', userId)
          console.log('Joined employee room:', userId)
        } else if (userRole === 'super_admin' || userRole === 'admin') {
          newSocket.emit('join:platform', userId)
          console.log('Joined platform room:', userId)
        }
      }
    })

    newSocket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason)
      setIsConnected(false)
      
      if (reason === 'io server disconnect') {
        // Server disconnected, attempt to reconnect
        newSocket.connect()
      }
    })

    newSocket.on('connect_error', (error) => {
      setConnectionError(error.message)
      setIsConnected(false)
      if (error?.message === 'Unauthorized socket') {
        newSocket.disconnect()
        clearAuthSession()
        setSocket(null)
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          window.location.href = getLoginPathForCurrentPage()
        }
        return
      }
      const now = Date.now()
      if (import.meta.env.DEV) {
        if (now - lastSocketConnectErrorLogMs > 15000) {
          lastSocketConnectErrorLogMs = now
          console.warn(
            '[Socket] Realtime server unreachable (is the API running on port 5000?).',
            error?.message || error,
          )
        }
      } else {
        console.error('Socket connection error:', error)
      }
    })

    newSocket.on('reconnect', (attemptNumber) => {
      console.log('Socket reconnected after', attemptNumber, 'attempts')
      setIsConnected(true)
      setConnectionError(null)
      
      // Rejoin rooms after reconnect
      if (userId) {
        const recipientType =
          userScope === 'employee'
            ? 'employee'
            : userScope === 'branch_user' || userRole === 'restaurant'
              ? 'restaurant'
              : userRole === 'super_admin' || userRole === 'admin'
                ? 'platform'
                : null
        if (recipientType) {
          newSocket.emit('join:user', {
            recipientType,
            recipientId: userScope === 'branch_user' ? resolvedRestaurantId : userId,
          })
        }
        if (userScope === 'branch_user' && resolvedRestaurantId && branchId) {
          newSocket.emit('join:restaurant', resolvedRestaurantId)
          newSocket.emit('join:branch', { restaurantId: resolvedRestaurantId, branchId })
        } else if (userRole === 'restaurant') {
          newSocket.emit('join:restaurant', userId)
        } else if (userScope === 'employee') {
          if (resolvedRestaurantId) {
            newSocket.emit('join:restaurant', resolvedRestaurantId)
          }
          newSocket.emit('join:employee', userId)
        } else if (userRole === 'super_admin' || userRole === 'admin') {
          newSocket.emit('join:platform', userId)
        }
      }
    })

    newSocket.on('reconnect_attempt', (attemptNumber) => {
      console.log('Reconnection attempt:', attemptNumber)
    })

    newSocket.on('reconnect_error', (error) => {
      console.error('Reconnection error:', error)
    })

    newSocket.on('reconnect_failed', () => {
      console.error('Reconnection failed')
      setConnectionError('Failed to reconnect to server')
    })

    // Cleanup on unmount
    return () => {
      if (newSocket) {
        // Leave rooms before disconnecting
        if (userId) {
          if (userRole === 'restaurant') {
            newSocket.emit('leave:restaurant', userId)
          } else if (userScope === 'employee') {
            if (resolvedRestaurantId) {
              newSocket.emit('leave:restaurant', resolvedRestaurantId)
            }
            newSocket.emit('leave:employee', userId)
          } else if (userRole === 'super_admin' || userRole === 'admin') {
            newSocket.emit('leave:platform', userId)
          }
        }
        newSocket.disconnect()
      }
    }
  }, [userId, userRole, userScope, branchId, token, isAuthenticated, socketOrigin, resolvedRestaurantId])

  // Join a specific room
  const joinRoom = useCallback((roomName, roomId) => {
    if (socket && isConnected) {
      socket.emit(`join:${roomName}`, roomId)
      console.log(`Joined ${roomName} room:`, roomId)
    }
  }, [socket, isConnected])

  // Leave a specific room
  const leaveRoom = useCallback((roomName, roomId) => {
    if (socket && isConnected) {
      socket.emit(`leave:${roomName}`, roomId)
      console.log(`Left ${roomName} room:`, roomId)
    }
  }, [socket, isConnected])

  // Join order room for tracking
  const joinOrderRoom = useCallback((orderId) => {
    joinRoom('order', orderId)
  }, [joinRoom])

  // Join table room for customer
  const joinTableRoom = useCallback((tableId) => {
    joinRoom('table', tableId)
  }, [joinRoom])

  // Emit event
  const emit = useCallback((event, data) => {
    if (socket && isConnected) {
      socket.emit(event, data)
    } else {
      console.warn('Socket not connected, cannot emit:', event)
    }
  }, [socket, isConnected])

  const connect = useCallback(() => {
    if (socket && !socket.connected) socket.connect()
  }, [socket])

  const disconnect = useCallback(() => {
    if (socket) socket.disconnect()
  }, [socket])

  const reconnect = useCallback(() => {
    if (!socket) return
    socket.disconnect()
    socket.connect()
  }, [socket])

  // Listen to event
  const on = useCallback((event, callback) => {
    if (socket) {
      socket.on(event, callback)
      return () => socket.off(event, callback)
    }
    return () => {}
  }, [socket])

  // Listen to event once
  const once = useCallback((event, callback) => {
    if (socket) {
      socket.once(event, callback)
    }
  }, [socket])

  // Off event
  const off = useCallback((event, callback) => {
    if (socket) {
      socket.off(event, callback)
    }
  }, [socket])

  const value = {
    socket,
    isConnected,
    connectionError,
    joinRoom,
    leaveRoom,
    joinOrderRoom,
    joinTableRoom,
    emit,
    connect,
    disconnect,
    reconnect,
    on,
    once,
    off,
    // Convenience methods for common events
    onNewOrder: (callback) => on('new_order', callback),
    onOrderUpdated: (callback) => on('order_updated', callback),
    onOrderStatus: (callback) => on('order_status', callback),
    onPaymentUpdated: (callback) => on('payment_updated', callback),
    onKYCUpdate: (callback) => on('kyc_update', callback),
    onNotification: (callback) => on('notification', callback),
    emitNewOrder: (data) => emit('new_order', data),
    emitOrderUpdate: (data) => emit('order_update', data),
  }

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  )
}

export default SocketProvider
