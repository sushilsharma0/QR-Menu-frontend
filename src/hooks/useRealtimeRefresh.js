import { useEffect, useMemo, useRef } from 'react'
import { REALTIME_TOPICS, dispatchRealtimeTopics, realtimeTopicEventName } from '../config/realtimeTopics'
import { useSocket } from './useSocket'

function topicsMatch(eventTopics, subscribedTopics) {
  if (subscribedTopics.includes(REALTIME_TOPICS.ALL)) return true
  if (!eventTopics?.length) return false
  if (eventTopics.includes(REALTIME_TOPICS.ALL)) return true
  return subscribedTopics.some((topic) => eventTopics.includes(topic))
}

/**
 * Refetch when Socket.IO pushes matching topics (or matching window events).
 */
export function useRealtimeRefresh(refetchFn, topics = [REALTIME_TOPICS.ALL]) {
  const { socket, isConnected } = useSocket()
  const refetchRef = useRef(refetchFn)
  refetchRef.current = refetchFn

  const topicsKey = useMemo(() => JSON.stringify(topics), [topics])

  useEffect(() => {
    if (!refetchFn) return undefined

    const run = () => {
      refetchRef.current?.()
    }

    const onWindowEvent = (event) => {
      const eventTopics = event?.detail?.topics
      if (topicsMatch(eventTopics, topics)) run()
    }

    topics.forEach((topic) => {
      window.addEventListener(realtimeTopicEventName(topic), onWindowEvent)
    })
    window.addEventListener('realtime:any', onWindowEvent)

    const onRestaurantChanged = (payload) => {
      if (topicsMatch(payload?.topics, topics)) run()
    }

    const onPlatformChanged = (payload) => {
      if (topicsMatch(payload?.topics, topics)) run()
    }

    const onBranchChanged = (payload) => {
      if (topicsMatch(payload?.topics, topics)) run()
    }

    const onSubscriptionAccess = () => {
      if (topics.includes(REALTIME_TOPICS.SUBSCRIPTION) || topics.includes(REALTIME_TOPICS.ALL)) {
        run()
      }
    }

    if (socket && isConnected) {
      socket.on('restaurant:data_changed', onRestaurantChanged)
      socket.on('platform:data_changed', onPlatformChanged)
      socket.on('branch:data_changed', onBranchChanged)
      socket.on('subscription:access_updated', onSubscriptionAccess)
    }

    return () => {
      topics.forEach((topic) => {
        window.removeEventListener(realtimeTopicEventName(topic), onWindowEvent)
      })
      window.removeEventListener('realtime:any', onWindowEvent)
      if (socket) {
        socket.off('restaurant:data_changed', onRestaurantChanged)
        socket.off('platform:data_changed', onPlatformChanged)
        socket.off('branch:data_changed', onBranchChanged)
        socket.off('subscription:access_updated', onSubscriptionAccess)
      }
    }
  }, [socket, isConnected, topicsKey, refetchFn, topics])
}

export function useRestaurantPortalRealtime(refetchFn, topics = [REALTIME_TOPICS.ALL]) {
  useRealtimeRefresh(refetchFn, topics)
}

export function usePlatformPortalRealtime(refetchFn, topics = [REALTIME_TOPICS.ALL, REALTIME_TOPICS.PLATFORM]) {
  useRealtimeRefresh(refetchFn, topics)
}
