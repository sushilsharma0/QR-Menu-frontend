import React, { useEffect } from 'react'
import { dispatchRealtimeTopics } from '../config/realtimeTopics'
import { useSocket } from '../hooks/useSocket'
import { useSubscriptionSync } from '../hooks/useSubscriptionSync'

/**
 * Global Socket.IO bridge: forwards server invalidation events to window topics
 * and keeps restaurant subscription access in sync.
 */
export function RealtimeSyncProvider({ children }) {
  const { socket, isConnected } = useSocket()

  useSubscriptionSync()

  useEffect(() => {
    if (!socket || !isConnected) return undefined

    const onRestaurantChanged = (payload) => {
      dispatchRealtimeTopics(payload?.topics || ['all'], payload)
    }

    const onPlatformChanged = (payload) => {
      dispatchRealtimeTopics(payload?.topics || ['platform'], payload)
    }

    const onBranchChanged = (payload) => {
      dispatchRealtimeTopics(payload?.topics || ['all'], payload)
    }

    const onSubscriptionAccess = (payload) => {
      dispatchRealtimeTopics(['subscription'], payload)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('restaurant:access_updated', { detail: payload }))
      }
    }

    socket.on('restaurant:data_changed', onRestaurantChanged)
    socket.on('platform:data_changed', onPlatformChanged)
    socket.on('branch:data_changed', onBranchChanged)
    socket.on('subscription:access_updated', onSubscriptionAccess)

    return () => {
      socket.off('restaurant:data_changed', onRestaurantChanged)
      socket.off('platform:data_changed', onPlatformChanged)
      socket.off('branch:data_changed', onBranchChanged)
      socket.off('subscription:access_updated', onSubscriptionAccess)
    }
  }, [socket, isConnected])

  return children
}

export default RealtimeSyncProvider
