import { usePlatformAutoRefresh } from '../context/PlatformRealtimeContext'

/**
 * Load platform page data on mount, when deps change, and on Socket.IO invalidation.
 * Replace `useEffect(() => load(), deps)` with `usePlatformPageLoad(() => load(), deps)`.
 */
export function usePlatformPageLoad(loadFn, deps = []) {
  usePlatformAutoRefresh(loadFn, deps)
}
