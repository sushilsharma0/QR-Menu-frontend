import { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from './useAuth'
import {
  getTenantSegments,
  restaurantPortalBase,
  kitchenPortalBase,
  cashierPortalBase,
  employeePortalBase,
  waiterPortalBase,
} from '../utils/tenantPaths'

/**
 * Resolves slug + restaurantId from the current route params first, then from the logged-in user.
 * Use inside restaurant / employee layouts and pages that live under those paths.
 */
export function useTenantRoutes() {
  const { slug: slugParam, restaurantId: ridParam } = useParams()
  const { user } = useAuth()

  return useMemo(() => {
    const fromUser = getTenantSegments(user)
    const slug = slugParam ?? fromUser.slug
    const restaurantId = ridParam ?? fromUser.restaurantId
    const hasTenant = slug != null && restaurantId != null

    return {
      slug,
      restaurantId,
      hasTenant,
      restaurantBase: hasTenant ? restaurantPortalBase(slug, restaurantId) : '',
      kitchenBase: hasTenant ? kitchenPortalBase(slug, restaurantId) : '',
      cashierBase: hasTenant ? cashierPortalBase(slug, restaurantId) : '',
      employeeBase: hasTenant ? employeePortalBase(slug, restaurantId) : '',
      waiterBase: hasTenant ? waiterPortalBase(slug, restaurantId) : '',
    }
  }, [slugParam, ridParam, user])
}
