export const formatDeviceDate = (value) => {
  if (!value) return 'Unknown'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Unknown' : date.toLocaleString()
}

export const formatDeviceLocation = (location = {}) => {
  const parts = [location.city, location.region, location.country].filter(Boolean)
  if (parts.length) return parts.join(', ')
  if (Number.isFinite(location.latitude) && Number.isFinite(location.longitude)) {
    return `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`
  }
  return 'Location not shared'
}

export const sessionHasAlerts = (session) => {
  const alerts = session?.alerts || {}
  return Boolean(
    alerts.unknownDevice || alerts.impossibleTravel || alerts.suspiciousConcurrentSessions,
  )
}

export const countSuspiciousSessions = (sessions = []) =>
  sessions.filter(sessionHasAlerts).length
