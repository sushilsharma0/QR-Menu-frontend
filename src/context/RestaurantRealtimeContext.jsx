import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { REALTIME_TOPICS } from '../config/realtimeTopics'
import { useRealtimeRefresh } from '../hooks/useRealtimeRefresh'

const RestaurantRealtimeContext = createContext({ refreshTick: 0 })

export function RestaurantRealtimeProvider({ children }) {
  const [refreshTick, setRefreshTick] = useState(0)

  const bump = useCallback(() => {
    setRefreshTick((value) => value + 1)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('restaurant:portal-refresh'))
    }
  }, [])

  useRealtimeRefresh(bump, [REALTIME_TOPICS.ALL])

  const value = useMemo(() => ({ refreshTick }), [refreshTick])

  return (
    <RestaurantRealtimeContext.Provider value={value}>
      {children}
    </RestaurantRealtimeContext.Provider>
  )
}

export function useRestaurantRealtimeTick() {
  return useContext(RestaurantRealtimeContext).refreshTick
}

/** Re-run an effect when any restaurant realtime invalidation arrives. */
export function useRestaurantAutoRefresh(effect, deps = []) {
  const tick = useRestaurantRealtimeTick()

  useEffect(() => {
    effect()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- tick drives realtime refresh
  }, [tick, ...deps])
}

export default RestaurantRealtimeContext
