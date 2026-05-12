/**
 * Browser calls must not default to localhost on every device: on a phone,
 * localhost is the phone, not the development machine.
 *
 * Local dev:
 * - Do NOT set VITE_API_URL: axios uses `/api` and Vite proxies to the API.
 * - Do NOT set VITE_SOCKET_URL: desktop localhost connects Socket.IO directly
 *   to port 5000 to avoid noisy Vite websocket proxy resets. LAN/mobile dev
 *   keeps same-origin `/socket.io` proxying.
 * - Start the API on port 5000 or requests and realtime events cannot connect.
 *
 * Override VITE_API_URL / VITE_SOCKET_URL only when the API is on another host.
 */
export function getApiBaseUrl() {
  const v = import.meta.env.VITE_API_URL
  if (v !== undefined && v !== null && String(v).trim() !== '') {
    const raw = String(v).trim()
    // Guard against malformed values like ":5000/api"
    if (raw.startsWith(':') && typeof window !== 'undefined') {
      const protocol = window.location.protocol || 'http:'
      const hostname = window.location.hostname || 'localhost'
      return `${protocol}//${hostname}${raw}`
    }
    return raw
  }
  return '/api'
}

const LOCAL_DEV_HOSTS = new Set(['localhost', '127.0.0.1'])

export function getSocketOrigin() {
  const envRaw = import.meta.env.VITE_SOCKET_URL
  const envTrim = envRaw != null && String(envRaw).trim() !== '' ? String(envRaw).trim() : ''

  if (typeof window !== 'undefined' && window.location?.origin) {
    if (envTrim) return envTrim
    if (import.meta.env.DEV && LOCAL_DEV_HOSTS.has(window.location.hostname)) {
      return 'http://127.0.0.1:5000'
    }
    return window.location.origin
  }

  if (envTrim) return envTrim
  return 'http://localhost:3000'
}
