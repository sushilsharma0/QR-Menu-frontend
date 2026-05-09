/**
 * Browser calls must not default to localhost — on a phone, localhost is the device.
 *
 * Local dev (recommended):
 * - Do NOT set VITE_API_URL → axios uses `/api` and Vite proxies to `http://localhost:5000` (see vite.config.js).
 * - Do NOT set VITE_SOCKET_URL → Socket.IO uses the same origin and `/socket.io` is proxied (WebSocket).
 * - Start the API on port 5000 or every request shows ERR_CONNECTION_REFUSED.
 *
 * Override VITE_API_URL / VITE_SOCKET_URL only when the API is on another host (e.g. staging).
 */
export function getApiBaseUrl() {
  const v = import.meta.env.VITE_API_URL
  if (v !== undefined && v !== null && String(v).trim() !== '') return v
  return '/api'
}

const DIRECT_LOCAL_5000 = /^https?:\/\/(localhost|127\.0\.0\.1):5000\/?$/i

export function getSocketOrigin() {
  const envRaw = import.meta.env.VITE_SOCKET_URL
  const envTrim = envRaw != null && String(envRaw).trim() !== '' ? String(envRaw).trim() : ''

  if (typeof window !== 'undefined' && window.location?.origin) {
    // In dev, pointing the client at :5000 bypasses Vite's WS proxy; use the dev server origin instead.
    if (import.meta.env.DEV && envTrim && DIRECT_LOCAL_5000.test(envTrim)) {
      return window.location.origin
    }
    if (envTrim) return envTrim
    return window.location.origin
  }

  if (envTrim) return envTrim
  return 'http://localhost:3000'
}
