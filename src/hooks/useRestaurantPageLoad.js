import { useRestaurantAutoRefresh } from '../context/RestaurantRealtimeContext'

/**
 * Load restaurant portal data on mount, when deps change, and on Socket.IO invalidation.
 */
export function useRestaurantPageLoad(loadFn, deps = []) {
  useRestaurantAutoRefresh(loadFn, deps)
}
