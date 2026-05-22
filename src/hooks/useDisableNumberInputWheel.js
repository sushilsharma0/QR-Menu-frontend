import { useEffect } from 'react'

const useDisableNumberInputWheel = () => {
  useEffect(() => {
    const handleWheel = (event) => {
      const target = event.target
      if (target instanceof HTMLInputElement && target.type === 'number' && document.activeElement === target) {
        target.blur()
      }
    }

    document.addEventListener('wheel', handleWheel, { passive: true, capture: true })
    return () => document.removeEventListener('wheel', handleWheel, { capture: true })
  }, [])
}

export default useDisableNumberInputWheel
