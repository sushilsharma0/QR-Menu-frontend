import { useCallback, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import { useSocket } from './useSocket'

const SETTINGS_KEY = 'qrmenu_notification_settings'
const SOUND_DEBOUNCE_MS = 2000

const defaultSettings = {
  soundEnabled: true,
  popupEnabled: true,
  browserNotificationsEnabled: true,
  kitchenVolume: 0.95,
  cashierVolume: 0.7,
  restaurantVolume: 0.75,
}

export function getNotificationSettings() {
  try {
    return { ...defaultSettings, ...(JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') || {}) }
  } catch {
    return defaultSettings
  }
}

export function saveNotificationSettings(next) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...getNotificationSettings(), ...next }))
}

function playFallbackBell(volume) {
  const AudioContext = window.AudioContext || window.webkitAudioContext
  if (!AudioContext) return
  const ctx = new AudioContext()
  const gain = ctx.createGain()
  gain.gain.value = Math.min(1, Math.max(0, volume))
  gain.connect(ctx.destination)

  ;[880, 660].forEach((frequency, index) => {
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = frequency
    osc.connect(gain)
    const start = ctx.currentTime + index * 0.16
    osc.start(start)
    osc.stop(start + 0.14)
  })
}

function formatTime(value) {
  const date = value ? new Date(value) : new Date()
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function useOrderAlerts({ role = 'restaurant', onRefresh, fullscreenUrgent = false } = {}) {
  const { socket } = useSocket()
  const lastSoundAtRef = useRef(0)
  const seenOrdersRef = useRef(new Set())

  const volumeForRole = useCallback(() => {
    const settings = getNotificationSettings()
    if (role === 'kitchen') return settings.kitchenVolume
    if (role === 'cashier') return settings.cashierVolume
    return settings.restaurantVolume
  }, [role])

  const playBell = useCallback(() => {
    const settings = getNotificationSettings()
    if (!settings.soundEnabled) return
    const now = Date.now()
    if (now - lastSoundAtRef.current < SOUND_DEBOUNCE_MS) return
    lastSoundAtRef.current = now

    const audio = new Audio('/sounds/order-bell.mp3')
    audio.volume = Math.min(1, Math.max(0, volumeForRole()))
    audio.play().catch(() => playFallbackBell(audio.volume))
  }, [volumeForRole])

  const notifyBrowser = useCallback((payload) => {
    const settings = getNotificationSettings()
    if (!settings.browserNotificationsEnabled || document.visibilityState === 'visible') return
    if (!('Notification' in window)) return

    const show = () => {
      if (Notification.permission !== 'granted') return
      const n = new Notification(`New Order Received - Table ${payload.tableNumber || '-'}`, {
        body: `Rs. ${payload.totalAmount || 0} - ${payload.orderType || 'order'} - ${formatTime(payload.createdAt)}`,
        tag: `order-${payload.orderId || payload.orderNumber}`,
        requireInteraction: role === 'kitchen',
      })
      n.onclick = () => window.focus()
    }

    if (Notification.permission === 'default') {
      Notification.requestPermission().then(show).catch(() => {})
      return
    }
    show()
  }, [role])

  const handleNewOrder = useCallback((payload = {}) => {
    const id = payload.orderId || payload._id || payload.orderNumber
    if (id && seenOrdersRef.current.has(String(id))) return
    if (id) {
      seenOrdersRef.current.add(String(id))
      window.setTimeout(() => seenOrdersRef.current.delete(String(id)), 30000)
    }

    playBell()
    if ('vibrate' in navigator) navigator.vibrate(role === 'kitchen' ? [220, 80, 220] : 160)
    notifyBrowser(payload)

    if (getNotificationSettings().popupEnabled) {
      toast.success(
        `New Order Received - Table ${payload.tableNumber || '-'}\nRs. ${payload.totalAmount || 0} - ${payload.orderType || 'order'} - ${formatTime(payload.createdAt)}`,
        { duration: role === 'kitchen' ? 8000 : 5500 },
      )
    }

    if (fullscreenUrgent && role === 'kitchen') {
      window.dispatchEvent(new CustomEvent('qrmenu:urgent-order', { detail: payload }))
    }

    onRefresh?.(payload)
  }, [fullscreenUrgent, notifyBrowser, onRefresh, playBell, role])

  useEffect(() => {
    if (!socket) return undefined
    socket.on('new_order', handleNewOrder)
    return () => {
      socket.off('new_order', handleNewOrder)
    }
  }, [handleNewOrder, socket])

  return {
    requestBrowserPermission: () =>
      'Notification' in window ? Notification.requestPermission() : Promise.resolve('unsupported'),
    playTestBell: playBell,
    settings: getNotificationSettings(),
    saveSettings: saveNotificationSettings,
  }
}

export default useOrderAlerts
