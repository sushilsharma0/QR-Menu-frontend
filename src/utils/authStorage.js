/**
 * Dashboard auth lives in sessionStorage so each tab has its own session.
 * Logging out kitchen/cashier in one tab no longer clears restaurant login in another.
 *
 * One-time migration: if legacy token existed only in localStorage, move it into
 * this tab's sessionStorage (and remove from localStorage).
 */
const TOKEN_KEY = 'token'
const USER_KEY = 'user'

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

export function clearAuthSession() {
  sessionStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(USER_KEY)
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
