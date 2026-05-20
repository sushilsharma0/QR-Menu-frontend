import { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from './useAuth'
import {
  getTenantSegments,
  restaurantPortalBase,
  branchPortalBase,
  kitchenPortalBase,
  cashierPortalBase,
  employeePortalBase,
  waiterPortalBase,
  managerPortalBase,
  isManagerEmployeeUser,
} from '../utils/tenantPaths'

/**
 * Resolves slug + restaurantId from the current route params first, then from the logged-in user.
 * Use inside restaurant / employee layouts and pages that live under those paths.
 */
export function useTenantRoutes() {
  const params = useParams()
  const { user } = useAuth()

  return useMemo(() => {
    const fromUser = getTenantSegments(user)
    const slugParam = params.slug
    const ridRestaurant = params.restaurantId
    const portalKeyParam = params.portalKey
    const branchSlugParam = params.branchSlug

    const isSecuredBranchRoute = Boolean(portalKeyParam && branchSlugParam && ridRestaurant && !slugParam)

    const slug = slugParam ?? fromUser.slug
    const restaurantId = isSecuredBranchRoute ? ridRestaurant : (ridRestaurant ?? fromUser.restaurantId)
    const branchSlug = branchSlugParam ?? user?.branchSlug
    const portalKey = portalKeyParam ?? user?.branchPortalKey ?? ''

    const isBranchPortal = user?.scope === 'branch_user' || isSecuredBranchRoute
    const hasTenant = isBranchPortal
      ? Boolean(branchSlug && restaurantId && portalKey)
      : Boolean(slug && restaurantId)

    const restaurantBase = hasTenant
      ? isBranchPortal
        ? branchPortalBase(restaurantId, portalKey, branchSlug)
        : restaurantPortalBase(slug, restaurantId)
      : ''

    const managerBase =
      hasTenant && !isBranchPortal ? managerPortalBase(slug, restaurantId) : ''

    const isManagerPortal =
      isManagerEmployeeUser(user) ||
      (typeof window !== 'undefined' &&
        String(window.location?.pathname || '').startsWith('/manager/'))

    const portalBase = isBranchPortal
      ? restaurantBase
      : isManagerPortal && managerBase
        ? managerBase
        : restaurantBase

    return {
      slug,
      restaurantId,
      branchSlug,
      portalKey,
      isBranchPortal,
      isManagerPortal,
      hasTenant,
      restaurantBase,
      managerBase,
      portalBase,
      kitchenBase: hasTenant && !isBranchPortal ? kitchenPortalBase(slug, restaurantId) : '',
      cashierBase: hasTenant && !isBranchPortal ? cashierPortalBase(slug, restaurantId) : '',
      employeeBase: hasTenant && !isBranchPortal ? employeePortalBase(slug, restaurantId) : '',
      waiterBase: hasTenant && !isBranchPortal ? waiterPortalBase(slug, restaurantId) : '',
    }
  }, [params.slug, params.restaurantId, params.portalKey, params.branchSlug, user])
}
