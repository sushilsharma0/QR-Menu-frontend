import React from 'react'
import { FiBell } from 'react-icons/fi'
import Card from '../../common/Card'
import NotificationSettingsPanel from '../../notifications/NotificationSettingsPanel'

export default function NotificationsSettingsSection() {
  return (
    <Card title="Notification preferences" icon={FiBell}>
      <NotificationSettingsPanel />
    </Card>
  )
}
