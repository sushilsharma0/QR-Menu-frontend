/**
 * Dashboard auth lives in sessionStorage so each tab has its own session.
 * Logging out kitchen/cashier in one tab no longer clears restaurant login in another.
 *
 * One-time migration: if legacy token existed only in localStorage, move it into
 * this tab's sessionStorage (and remove from localStorage).
 */
const TOKEN_KEY = 'token'
const USER_KEY = 'user'
const REFRESH_TOKEN_KEY = 'refreshToken'
const SESSION_ID_KEY = 'sessionId'
const DEVICE_ID_KEY = 'deviceId'
const BROWSER_DEVICE_ID_KEY = 'browserDeviceId'
const GEO_LOCATION_KEY = 'sessionGeoLocation'

export function migrateLegacyLocalStorageAuth() {
  try {
    const legacyToken = localStorage.getItem(TOKEN_KEY)
    const legacyUser = localStorage.getItem(USER_KEY)
    if (!legacyToken || sessionStorage.getItem(TOKEN_KEY)) return
    sessionStorage.setItem(TOKEN_KEY, legacyToken)
    if (legacyUser) sessionStorage.setItem(USER_KEY, legacyUser)
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  } catch {
    /* ignore quota / private mode */
  }
}

export function readInitialAuthToken() {
  migrateLegacyLocalStorageAuth()
  return sessionStorage.getItem(TOKEN_KEY)
}

export function getAuthToken() {
  migrateLegacyLocalStorageAuth()
  return sessionStorage.getItem(TOKEN_KEY)
}

export function getAuthUserRaw() {
  migrateLegacyLocalStorageAuth()
  return sessionStorage.getItem(USER_KEY)
}

export function setAuthSession(token, userJsonString) {
  if (token == null) sessionStorage.removeItem(TOKEN_KEY)
  else sessionStorage.setItem(TOKEN_KEY, token)
  if (userJsonString == null) sessionStorage.removeItem(USER_KEY)
  else sessionStorage.setItem(USER_KEY, userJsonString)
}

export function setRestaurantSessionSecrets({ refreshToken, sessionId } = {}) {
  if (refreshToken == null) sessionStorage.removeItem(REFRESH_TOKEN_KEY)
  else sessionStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
  if (sessionId == null) sessionStorage.removeItem(SESSION_ID_KEY)
  else sessionStorage.setItem(SESSION_ID_KEY, sessionId)
}

export function getRefreshToken() {
  return sessionStorage.getItem(REFRESH_TOKEN_KEY)
}

export function getSessionId() {
  return sessionStorage.getItem(SESSION_ID_KEY)
}

export function getOrCreateDeviceId() {
  let deviceId = null
  try {
    deviceId = localStorage.getItem(BROWSER_DEVICE_ID_KEY)
  } catch {
    /* ignore storage restrictions */
  }
  deviceId = deviceId || sessionStorage.getItem(DEVICE_ID_KEY)
  if (!deviceId) {
    deviceId = crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`
  }
  try {
    localStorage.setItem(BROWSER_DEVICE_ID_KEY, deviceId)
  } catch {
    /* ignore storage restrictions */
  }
  if (sessionStorage.getItem(DEVICE_ID_KEY) !== deviceId) {
    sessionStorage.setItem(DEVICE_ID_KEY, deviceId)
  }
  return deviceId
}

export function getDeviceFingerprint() {
  const parts = [
    navigator.userAgent,
    navigator.language,
    screen.width,
    screen.height,
    screen.colorDepth,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
  ]
  return parts.filter(Boolean).join('|')
}

export function getDeviceMetadata() {
  return {
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
    screen: `${screen.width}x${screen.height}x${screen.colorDepth}`,
    platform: navigator.platform || '',
  }
}

export function setCachedGeoLocation(location) {
  if (!location) {
    sessionStorage.removeItem(GEO_LOCATION_KEY)
    return
  }
  sessionStorage.setItem(GEO_LOCATION_KEY, JSON.stringify(location))
}

export function getCachedGeoLocation() {
  const raw = sessionStorage.getItem(GEO_LOCATION_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function requestBrowserLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Browser location is not supported'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        }
        setCachedGeoLocation(location)
        resolve(location)
      },
      (error) => reject(error),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 10 * 60 * 1000 },
    )
  })
}

export function clearAuthSession() {
  sessionStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(USER_KEY)
  sessionStorage.removeItem(REFRESH_TOKEN_KEY)
  sessionStorage.removeItem(SESSION_ID_KEY)
}

/** Parsed dashboard user for this tab only; returns null if missing or invalid JSON. */
export function getParsedAuthUser() {
  const raw = getAuthUserRaw()
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}
