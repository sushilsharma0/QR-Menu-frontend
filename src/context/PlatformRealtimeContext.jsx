import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { REALTIME_TOPICS } from '../config/realtimeTopics'
import { useRealtimeRefresh } from '../hooks/useRealtimeRefresh'

const PlatformRealtimeContext = createContext({ refreshTick: 0 })

export function PlatformRealtimeProvider({ children }) {
  const [refreshTick, setRefreshTick] = useState(0)
  const bump = useCallback(() => {
    setRefreshTick((value) => value + 1)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('platform:portal-refresh'))
    }
  }, [])

  useRealtimeRefresh(bump, [REALTIME_TOPICS.ALL, REALTIME_TOPICS.PLATFORM])

  const value = useMemo(() => ({ refreshTick }), [refreshTick])

  return (
    <PlatformRealtimeContext.Provider value={value}>
      {children}
    </PlatformRealtimeContext.Provider>
  )
}

export function usePlatformRealtimeTick() {
  return useContext(PlatformRealtimeContext).refreshTick
}

export function usePlatformAutoRefresh(effect, deps = []) {
  const tick = usePlatformRealtimeTick()

  useEffect(() => {
    effect()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- tick drives realtime refresh
  }, [tick, ...deps])
}

export default PlatformRealtimeContext
