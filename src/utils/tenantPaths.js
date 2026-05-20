/** Path helpers for restaurant / kitchen / cashier portals (slug + restaurant id). */

export function getTenantSegments(user) {
  if (user?.scope === 'branch_user') {
    const slug = user?.restaurantSlug ?? user?.slug
    const restaurantId = user?.restaurantId
    return {
      slug,
      restaurantId,
      branchSlug: user?.branchSlug,
      branchPortalKey: user?.branchPortalKey,
    }
  }
  const slug =
    user?.slug ??
    user?.restaurantSlug ??
    user?.restaurantId ??
    user?.id
  const restaurantId = user?.restaurantId ?? user?.id
  return { slug, restaurantId }
}

export function encodePathSegment(v) {
  return encodeURIComponent(String(v))
}

export function restaurantPortalBase(slug, restaurantId) {
  if (slug == null || restaurantId == null) return ''
  return `/restaurant/${encodePathSegment(slug)}/${encodePathSegment(restaurantId)}`
}

/** Match /restaurant/:slug/:restaurantId and optional tail path */
export function parseRestaurantPortalPath(pathname) {
  const m = String(pathname || '').match(/^\/restaurant\/([^/]+)\/([^/]+)(?:\/(.*))?$/)
  if (!m) return null
  return {
    slug: decodeURIComponent(m[1]),
    restaurantId: decodeURIComponent(m[2]),
    tail: m[3] || '',
  }
}

const BILLING_LOCK_ALLOWED_SEGMENTS = new Set(['subscription', 'kyc'])

/**
 * When trial / plan access is gone, restaurant owners may only use these areas
 * (subscribe, complete KYC for plan requests).
 */
export function isRestaurantPathAllowedWhenBillingLocked(pathname) {
  const p = parseRestaurantPortalPath(pathname)
  if (!p) return false
  if (!p.tail) return false
  const root = p.tail.split('/')[0]
  return BILLING_LOCK_ALLOWED_SEGMENTS.has(root)
}

export function kitchenPortalBase(slug, restaurantId) {
  if (slug == null || restaurantId == null) return ''
  return `/kitchen/${encodePathSegment(slug)}/${encodePathSegment(restaurantId)}`
}

export function cashierPortalBase(slug, restaurantId) {
  if (slug == null || restaurantId == null) return ''
  return `/cashier/${encodePathSegment(slug)}/${encodePathSegment(restaurantId)}`
}

export function employeePortalBase(slug, restaurantId) {
  if (slug == null || restaurantId == null) return ''
  return `/employee/${encodePathSegment(slug)}/${encodePathSegment(restaurantId)}`
}

export function waiterPortalBase(slug, restaurantId) {
  if (slug == null || restaurantId == null) return ''
  return `/waiter/${encodePathSegment(slug)}/${encodePathSegment(restaurantId)}`
}

export function managerPortalBase(slug, restaurantId) {
  if (slug == null || restaurantId == null) return ''
  return `/manager/${encodePathSegment(slug)}/${encodePathSegment(restaurantId)}`
}

export function isManagerEmployeeUser(user) {
  return user?.scope === 'employee' && (user?.role === 'manager' || user?.role === 'admin')
}

/**
 * Branch portal: restaurant Mongo id + unguessable portal key + branch slug.
 * Same pattern as /restaurant/:slug/:id so outlets are not enumerable by slug alone.
 */
export function branchPortalBase(restaurantId, portalKey, branchSlug) {
  if (restaurantId == null || portalKey == null || branchSlug == null) return ''
  return `/branch/${encodePathSegment(restaurantId)}/${encodePathSegment(portalKey)}/${encodePathSegment(branchSlug)}`
}

export function parseBranchPortalPath(pathname) {
  const m = String(pathname || '').match(/^\/branch\/([^/]+)\/([^/]+)\/([^/]+)(?:\/(.*))?$/)
  if (!m) return null
  return {
    restaurantId: decodeURIComponent(m[1]),
    portalKey: decodeURIComponent(m[2]),
    branchSlug: decodeURIComponent(m[3]),
    tail: m[4] || '',
  }
}

export function defaultPortalPathForUser(user) {
  if (user?.scope === 'branch_user' && user?.branchSlug) {
    if (!user?.branchPortalKey || !user?.restaurantId) {
      return '/login'
    }
    return `${branchPortalBase(user.restaurantId, user.branchPortalKey, user.branchSlug)}/dashboard`
  }

  const { slug, restaurantId } = getTenantSegments(user)
  if (slug == null || restaurantId == null) return '/login'

  if (user?.scope === 'employee' && user?.role === 'kitchen') {
    return `${kitchenPortalBase(slug, restaurantId)}/dashboard`
  }
  if (user?.scope === 'employee' && user?.role === 'cashier') {
    return `${cashierPortalBase(slug, restaurantId)}/dashboard`
  }
  if (user?.scope === 'employee' && user?.role === 'waiter') {
    return `${waiterPortalBase(slug, restaurantId)}/dashboard`
  }
  if (user?.scope === 'employee' && (user?.role === 'manager' || user?.role === 'admin')) {
    return `${managerPortalBase(slug, restaurantId)}/dashboard`
  }
  if (user?.scope === 'employee') {
    return `${employeePortalBase(slug, restaurantId)}/orders`
  }
  if (user?.role === 'restaurant') {
    return `${restaurantPortalBase(slug, restaurantId)}/dashboard`
  }
  return '/login'
}
