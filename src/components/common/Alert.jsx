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
    success: { icon: FiCheckCircle, bg: 'bg-green-50', text: 'text-green-800', border: 'border-green-400' },
    error: { icon: FiAlertCircle, bg: 'bg-red-50', text: 'text-red-800', border: 'border-red-400' },
    warning: { icon: FiAlertTriangle, bg: 'bg-yellow-50', text: 'text-yellow-800', border: 'border-yellow-400' },
    info: { icon: FiInfo, bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-400' },
  }

  const { icon: Icon, bg, text, border } = config[type]

  return (
    <div className={`${bg} border-l-4 ${border} p-4 rounded-lg mb-4 flex items-start justify-between`}>
      <div className="flex items-start gap-3">
        <Icon className={`h-5 w-5 mt-0.5 ${text}`} />
        <p className={`text-sm ${text}`}>{message}</p>
      </div>
      <button onClick={() => { setVisible(false); onClose?.() }} className="text-gray-400 hover:text-gray-600">
        <FiX className="h-4 w-4" />
      </button>
    </div>
  )
}

export default Alert