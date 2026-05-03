/** Path helpers for restaurant / kitchen / cashier portals (slug + restaurant id). */

export function getTenantSegments(user) {
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

/** Post-login or default home path for the current auth user. */
export function defaultPortalPathForUser(user) {
  const { slug, restaurantId } = getTenantSegments(user)
  if (slug == null || restaurantId == null) return '/login'

  if (user?.scope === 'employee' && user?.role === 'kitchen') {
    return `${kitchenPortalBase(slug, restaurantId)}/dashboard`
  }
  if (user?.scope === 'employee' && user?.role === 'cashier') {
    return `${cashierPortalBase(slug, restaurantId)}/dashboard`
  }
  if (user?.scope === 'employee') {
    return `${employeePortalBase(slug, restaurantId)}/orders`
  }
  if (user?.role === 'restaurant') {
    return `${restaurantPortalBase(slug, restaurantId)}/dashboard`
  }
  return '/login'
}
