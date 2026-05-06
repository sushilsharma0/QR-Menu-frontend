import React, { useEffect, useState } from 'react'
import { FiX, FiAlertCircle, FiCheckCircle, FiInfo, FiAlertTriangle } from 'react-icons/fi'

const Alert = ({ type = 'info', message, duration = 5000, onClose }) => {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    if (duration) {
      const timer = setTimeout(() => {
        setVisible(false)
        onClose?.()
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [duration, onClose])

  if (!visible) return null

  const config = {
    success: { icon: FiCheckCircle, bg: 'bg-accent-50', text: 'text-accent-800', border: 'border-accent-400' },
    error: { icon: FiAlertCircle, bg: 'bg-secondary-50', text: 'text-secondary-800', border: 'border-secondary-400' },
    warning: { icon: FiAlertTriangle, bg: 'bg-attention-50', text: 'text-attention-800', border: 'border-attention-400' },
    info: { icon: FiInfo, bg: 'bg-surface-50', text: 'text-primary-800', border: 'border-primary-300' },
  }

  const { icon: Icon, bg, text, border } = config[type]

  return (
    <div className={`${bg} border-l-4 ${border} p-4 rounded-lg mb-4 flex items-start justify-between`}>
      <div className="flex items-start gap-3">
        <Icon className={`h-5 w-5 mt-0.5 ${text}`} />
        <p className={`text-sm ${text}`}>{message}</p>
      </div>
      <button onClick={() => { setVisible(false); onClose?.() }} className="text-accent-500 hover:text-primary-700">
        <FiX className="h-4 w-4" />
      </button>
    </div>
  )
}

export default Alert