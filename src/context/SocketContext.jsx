import React, { createContext, useState, useEffect, useCallback } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from '../hooks/useAuth'

export const SocketContext = createContext()

export const SocketProvider = ({ children }) => {
  const { user, token, isAuthenticated } = useAuth()
  const [socket, setSocket] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const [connectionError, setConnectionError] = useState(null)

  const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'
  const parseJwtPayload = (jwtToken) => {
    try {
      const payload = jwtToken?.split('.')?.[1]
      if (!payload) return null
      return JSON.parse(atob(payload))
    } catch (err) {
      return null
    }
  }
  const resolvedRestaurantId = user?.restaurantId || parseJwtPayload(token)?.restaurantId

  // Initialize socket connection
  useEffect(() => {
    const canConnect = isAuthenticated || Boolean(token && user)
    if (!canConnect || !user) {
      // Disconnect if no user
      if (socket) {
        socket.disconnect()
        setSocket(null)
        setIsConnected(false)
      }
      return
    }

    // Create new socket connection
    const newSocket = io(SOCKET_URL, {
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
      if (user.id) {
        const recipientType =
          user.scope === 'employee'
            ? 'employee'
            : user.role === 'restaurant'
              ? 'restaurant'
              : user.role === 'super_admin' || user.role === 'admin'
                ? 'platform'
                : null
        if (recipientType) {
          newSocket.emit('join:user', { recipientType, recipientId: user.id })
        }
        if (user.role === 'restaurant') {
          newSocket.emit('join:restaurant', user.id)
          console.log('Joined restaurant room:', user.id)
        } else if (user.scope === 'employee') {
          // Employees should also join restaurant room to receive
          // order/payment broadcasts emitted at restaurant level.
          if (resolvedRestaurantId) {
            newSocket.emit('join:restaurant', resolvedRestaurantId)
            console.log('Joined restaurant room:', resolvedRestaurantId)
          }
          newSocket.emit('join:employee', user.id)
          console.log('Joined employee room:', user.id)
        } else if (user.role === 'super_admin' || user.role === 'admin') {
          newSocket.emit('join:platform', user.id)
          console.log('Joined platform room:', user.id)
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
      console.error('Socket connection error:', error)
      setConnectionError(error.message)
      setIsConnected(false)
    })

    newSocket.on('reconnect', (attemptNumber) => {
      console.log('Socket reconnected after', attemptNumber, 'attempts')
      setIsConnected(true)
      setConnectionError(null)
      
      // Rejoin rooms after reconnect
      if (user.id) {
        const recipientType =
          user.scope === 'employee'
            ? 'employee'
            : user.role === 'restaurant'
              ? 'restaurant'
              : user.role === 'super_admin' || user.role === 'admin'
                ? 'platform'
                : null
        if (recipientType) {
          newSocket.emit('join:user', { recipientType, recipientId: user.id })
        }
        if (user.role === 'restaurant') {
          newSocket.emit('join:restaurant', user.id)
        } else if (user.scope === 'employee') {
          if (resolvedRestaurantId) {
            newSocket.emit('join:restaurant', resolvedRestaurantId)
          }
          newSocket.emit('join:employee', user.id)
        } else if (user.role === 'super_admin' || user.role === 'admin') {
          newSocket.emit('join:platform', user.id)
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
        if (user?.id) {
          if (user.role === 'restaurant') {
            newSocket.emit('leave:restaurant', user.id)
          } else if (user.scope === 'employee') {
            if (resolvedRestaurantId) {
              newSocket.emit('leave:restaurant', resolvedRestaurantId)
            }
            newSocket.emit('leave:employee', user.id)
          } else if (user.role === 'super_admin' || user.role === 'admin') {
            newSocket.emit('leave:platform', user.id)
          }
        }
        newSocket.disconnect()
      }
    }
  }, [user, token, isAuthenticated, SOCKET_URL, resolvedRestaurantId])

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