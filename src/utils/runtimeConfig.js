/**
 * Browser calls must not default to localhost on every device: on a phone,
 * localhost is the phone, not the development machine.
 *
 * Default backend:
 * - If VITE_API_URL is not set, the app uses the hosted Render API.
 * - If VITE_SOCKET_URL is not set, realtime uses the hosted Render origin.
 *
 * Override VITE_API_URL / VITE_SOCKET_URL only when the API is on another host.
 */
const DEFAULT_API_ORIGIN = 'https://qr-menu-backend-m6x7.onrender.com'
const DEFAULT_API_URL = `${DEFAULT_API_ORIGIN}/api`

function isHostedFrontend() {
  if (typeof window === 'undefined') return false
  const hostname = window.location?.hostname || ''
  return hostname === 'qr-menu-frontend-navy.vercel.app' || hostname.endsWith('.vercel.app')
}

export function getApiBaseUrl() {
  const v = import.meta.env.VITE_API_URL
  if (v !== undefined && v !== null && String(v).trim() !== '') {
    const raw = String(v).trim()
    if ((raw === '/api' || raw === 'api') && isHostedFrontend()) {
      return DEFAULT_API_URL
    }
    // Guard against malformed values like ":5000/api"
    if (raw.startsWith(':') && typeof window !== 'undefined') {
      const protocol = window.location.protocol || 'http:'
      const hostname = window.location.hostname || 'localhost'
      return `${protocol}//${hostname}${raw}`
    }
    return raw
  }
  if (typeof window !== 'undefined' && window.desktopApp?.isElectron) {
    const desktopApi = String(window.desktopApp.apiBaseUrl || '').trim()
    return desktopApi || DEFAULT_API_URL
  }
  return DEFAULT_API_URL
}

export function getSocketOrigin() {
  const envRaw = import.meta.env.VITE_SOCKET_URL
  const envTrim = envRaw != null && String(envRaw).trim() !== '' ? String(envRaw).trim() : ''

  if (typeof window !== 'undefined' && window.desktopApp?.isElectron) {
    const desktopSocket = String(window.desktopApp.socketOrigin || '').trim()
    return desktopSocket || DEFAULT_API_ORIGIN
  }

  if (typeof window !== 'undefined' && window.location?.origin) {
    if (envTrim) {
      if ((envTrim === '/socket.io' || envTrim === '/') && isHostedFrontend()) {
        return DEFAULT_API_ORIGIN
      }
      return envTrim
    }
    return DEFAULT_API_ORIGIN
  }

  if (envTrim) return envTrim
  return DEFAULT_API_ORIGIN
}
