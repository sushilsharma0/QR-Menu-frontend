import React from 'react'
import { FiCreditCard } from 'react-icons/fi'
import Card from '../../common/Card'

export default function SubscriptionSettingsSection({ restaurant, onToggleAutoRenew }) {
  return (
    <Card title="Subscription Settings" icon={FiCreditCard}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-medium text-gray-900 dark:text-gray-100">Auto-renew Subscription</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Automatically renew your plan when it expires
          </p>
        </div>
        <button
          type="button"
          onClick={onToggleAutoRenew}
          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
            restaurant?.autoRenew ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
          }`}
          aria-pressed={Boolean(restaurant?.autoRenew)}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              restaurant?.autoRenew ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
    </Card>
  )
}
