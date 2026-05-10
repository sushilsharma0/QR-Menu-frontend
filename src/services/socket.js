import { io } from 'socket.io-client'
import { getSocketOrigin } from '../utils/runtimeConfig'
import { getAuthToken } from '../utils/authStorage'

let socket = null

export const initSocket = () => {
  if (!socket) {
    socket = io(getSocketOrigin(), {
      auth: { token: getAuthToken() },
      transports: ['websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })

    socket.on('connect', () => {
      console.log('🟢 Socket connected:', socket.id)
    })

    socket.on('disconnect', (reason) => {
      console.log('🔴 Socket disconnected:', reason)
    })

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error)
    })
  }
  return socket
}

export const getSocket = () => {
  if (!socket) {
    return initSocket()
  }
  return socket
}

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

// Room joining functions
export const joinRestaurantRoom = (restaurantId) => {
  const socket = getSocket()
  if (socket && restaurantId) {
    socket.emit('join:restaurant', restaurantId)
    console.log('Joined restaurant room:', restaurantId)
  }
}

export const joinEmployeeRoom = (employeeId) => {
  const socket = getSocket()
  if (socket && employeeId) {
    socket.emit('join:employee', employeeId)
    console.log('Joined employee room:', employeeId)
  }
}

export const joinOrderRoom = (orderId) => {
  const socket = getSocket()
  if (socket && orderId) {
    socket.emit('join:order', orderId)
    console.log('Joined order room:', orderId)
  }
}

export const joinTableRoom = (tableId) => {
  const socket = getSocket()
  if (socket && tableId) {
    socket.emit('join:table', tableId)
    console.log('Joined table room:', tableId)
  }
}

export const leaveRoom = (room) => {
  const socket = getSocket()
  if (socket) {
    socket.emit('leave', room)
  }
}

// Event listeners
export const onNewOrder = (callback) => {
  const socket = getSocket()
  socket.on('new_order', callback)
  return () => socket.off('new_order', callback)
}

export const onOrderUpdated = (callback) => {
  const socket = getSocket()
  socket.on('order_updated', callback)
  return () => socket.off('order_updated', callback)
}

export const onOrderStatus = (callback) => {
  const socket = getSocket()
  socket.on('order_status', callback)
  return () => socket.off('order_status', callback)
}

export const onKitchenOrder = (callback) => {
  const socket = getSocket()
  socket.on('kitchen_order', callback)
  return () => socket.off('kitchen_order', callback)
}

export default {
  initSocket,
  getSocket,
  disconnectSocket,
  joinRestaurantRoom,
  joinEmployeeRoom,
  joinOrderRoom,
  joinTableRoom,
  leaveRoom,
  onNewOrder,
  onOrderUpdated,
  onOrderStatus,
  onKitchenOrder,
}
