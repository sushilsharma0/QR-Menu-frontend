import React, { useState } from 'react'
import { FiBell, FiVolume2 } from 'react-icons/fi'
import Card from '../common/Card'
import Button from '../common/Button'
import {
  getNotificationSettings,
  saveNotificationSettings,
  useOrderAlerts,
} from '../../hooks/useOrderAlerts'

export default function NotificationSettingsPanel() {
  const [settings, setSettings] = useState(getNotificationSettings)
  const { playTestBell, requestBrowserPermission } = useOrderAlerts()

  const update = (patch) => {
    const next = { ...settings, ...patch }
    setSettings(next)
    saveNotificationSettings(next)
  }

  return (
    <Card title="Realtime Notifications">
      <div className="space-y-4">
        <div className="flex items-center gap-3 rounded-2xl bg-primary-50 p-4 text-primary-800">
          <FiBell className="h-5 w-5" />
          <p className="text-sm font-semibold">Controls for POS, kitchen, cashier, and restaurant order alerts on this device.</p>
        </div>

        {[
          ['soundEnabled', 'Sound alerts'],
          ['popupEnabled', 'Toast popups'],
          ['browserNotificationsEnabled', 'Browser notifications'],
        ].map(([key, label]) => (
          <label key={key} className="flex items-center justify-between rounded-xl border border-surface-200 px-4 py-3 text-sm font-semibold">
            {label}
            <input
              type="checkbox"
              checked={Boolean(settings[key])}
              onChange={(e) => update({ [key]: e.target.checked })}
            />
          </label>
        ))}

        {[
          ['kitchenVolume', 'Kitchen volume'],
          ['cashierVolume', 'Cashier volume'],
          ['restaurantVolume', 'Restaurant dashboard volume'],
        ].map(([key, label]) => (
          <label key={key} className="block rounded-xl border border-surface-200 px-4 py-3">
            <span className="mb-2 flex items-center justify-between text-sm font-semibold">
              {label}
              <span>{Math.round(Number(settings[key]) * 100)}%</span>
            </span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings[key]}
              onChange={(e) => update({ [key]: Number(e.target.value) })}
              className="w-full"
            />
          </label>
        ))}

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" onClick={playTestBell}>
            <FiVolume2 className="mr-2" /> Test sound
          </Button>
          <Button type="button" variant="secondary" onClick={requestBrowserPermission}>
            Enable browser notifications
          </Button>
        </div>
      </div>
    </Card>
  )
}
