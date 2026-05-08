/**
 * Browser calls must not default to localhost — on a phone, localhost is the device.
 * Use same-origin `/api` and Socket.IO via the Vite proxy (or your reverse proxy).
 * Override with VITE_API_URL / VITE_SOCKET_URL when the API lives on another host.
 */
export function getApiBaseUrl() {
  const v = import.meta.env.VITE_API_URL
  if (v !== undefined && v !== null && String(v).trim() !== '') return v
  return '/api'
}

export function getSocketOrigin() {
  const v = import.meta.env.VITE_SOCKET_URL
  if (v !== undefined && v !== null && String(v).trim() !== '') return v
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin
  }
  return 'http://localhost:5000'
}
