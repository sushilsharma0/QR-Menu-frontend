import hotToast from 'react-hot-toast'

const SINGLE_TOAST_ID = 'qrmenu-active-toast'
const DUPLICATE_WINDOW_MS = 700

let lastToastKey = ''
let lastToastAt = 0

function normalizeMessage(message) {
  if (message == null) return ''
  if (typeof message === 'string') return message.trim()
  return String(message).trim()
}

function showToast(type, message, options = {}) {
  const text = normalizeMessage(message)
  if (!text) return null
  const normalizedOptions = typeof options === 'number' ? { duration: options } : options || {}

  const now = Date.now()
  const key = `${type}:${text}`
  if (key === lastToastKey && now - lastToastAt < DUPLICATE_WINDOW_MS) {
    return SINGLE_TOAST_ID
  }

  lastToastKey = key
  lastToastAt = now
  hotToast.dismiss()

  const toastOptions = {
    ...normalizedOptions,
    id: SINGLE_TOAST_ID,
  }

  if (type === 'success') return hotToast.success(text, toastOptions)
  if (type === 'error') return hotToast.error(text, toastOptions)
  if (type === 'loading') return hotToast.loading(text, toastOptions)

  return hotToast(text, toastOptions)
}

const toast = (message, options) => showToast('default', message, options)

toast.success = (message, options) => showToast('success', message, options)
toast.error = (message, options) => showToast('error', message, options)
toast.loading = (message, options) => showToast('loading', message, options)
toast.info = (message, options) => showToast('default', message, options)
toast.warning = (message, options) => showToast('default', message, options)
toast.dismiss = (...args) => hotToast.dismiss(...args)
toast.remove = (...args) => hotToast.remove(...args)
toast.promise = (...args) => hotToast.promise(...args)
toast.custom = (...args) => {
  hotToast.dismiss()
  return hotToast.custom(...args)
}

export default toast
