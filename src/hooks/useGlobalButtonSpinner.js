import { useEffect } from 'react'

const SPINNER_DURATION_MS = 650
const timers = new WeakMap()

export default function useGlobalButtonSpinner() {
  useEffect(() => {
    const handleClick = (event) => {
      const button = event.target?.closest?.('button')
      if (!button || button.disabled || button.dataset.noSpinner === 'true') return

      button.dataset.clickLoading = 'true'
      const existingTimer = timers.get(button)
      if (existingTimer) window.clearTimeout(existingTimer)

      const timer = window.setTimeout(() => {
        delete button.dataset.clickLoading
        timers.delete(button)
      }, SPINNER_DURATION_MS)
      timers.set(button, timer)
    }

    document.addEventListener('click', handleClick, true)
    return () => {
      document.removeEventListener('click', handleClick, true)
    }
  }, [])
}
