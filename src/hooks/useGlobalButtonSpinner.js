import { useEffect } from 'react'

const SPINNER_DURATION_MS = 650
const timers = new WeakMap()
const previousMinWidths = new WeakMap()

export default function useGlobalButtonSpinner() {
  useEffect(() => {
    const handleClick = (event) => {
      const button = event.target?.closest?.('button')
      if (!button || button.disabled || button.dataset.noSpinner === 'true') return

      if (!previousMinWidths.has(button)) {
        previousMinWidths.set(button, button.style.minWidth || '')
      }
      button.style.minWidth = `${button.offsetWidth}px`
      button.dataset.clickLoading = 'true'
      const existingTimer = timers.get(button)
      if (existingTimer) window.clearTimeout(existingTimer)

      const timer = window.setTimeout(() => {
        delete button.dataset.clickLoading
        const previousMinWidth = previousMinWidths.get(button)
        button.style.minWidth = previousMinWidth || ''
        previousMinWidths.delete(button)
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
