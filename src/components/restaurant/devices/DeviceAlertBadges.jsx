import React from 'react'
import { FiAlertTriangle } from 'react-icons/fi'

const sessionAlertLabels = (alerts = {}) =>
  [
    alerts.unknownDevice && 'Unknown device',
    alerts.impossibleTravel && 'Impossible travel',
    alerts.suspiciousConcurrentSessions && 'Many sessions',
  ].filter(Boolean)

export default function DeviceAlertBadges({ alerts = {} }) {
  const activeAlerts = sessionAlertLabels(alerts)

  if (!activeAlerts.length) {
    return (
      <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-bold text-green-700 dark:bg-green-900/25 dark:text-green-300">
        Trusted
      </span>
    )
  }

  return (
    <div className="flex flex-wrap gap-2">
      {activeAlerts.map((label) => (
        <span
          key={label}
          className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-800 dark:bg-amber-900/25 dark:text-amber-200"
        >
          <FiAlertTriangle className="h-3 w-3" />
          {label}
        </span>
      ))}
    </div>
  )
}
