import React from 'react'
import { FiCopy, FiCreditCard, FiGift } from 'react-icons/fi'
import Card from '../../common/Card'
import toast from '../../../utils/toast'

export default function SubscriptionSettingsSection({ restaurant }) {
  const referralCode = restaurant?.referralCode || ''

  const copyReferralCode = async () => {
    if (!referralCode) return
    try {
      await navigator.clipboard.writeText(referralCode)
      toast.success('Referral code copied')
    } catch {
      toast.error('Could not copy referral code')
    }
  }

  return (
    <Card title="Subscription Settings" icon={FiCreditCard}>
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-950/20">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-amber-700 shadow-sm dark:bg-gray-900 dark:text-amber-300">
              <FiGift className="h-5 w-5" />
            </span>
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100">Refer a restaurant</p>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Both restaurants get 1 extra month after the new restaurant activates their first plan.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={copyReferralCode}
            disabled={!referralCode}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-amber-300 bg-white px-4 py-2 text-sm font-semibold text-amber-800 shadow-sm transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-amber-800 dark:bg-gray-900 dark:text-amber-200 dark:hover:bg-amber-950"
          >
            <FiCopy className="h-4 w-4" />
            {referralCode || 'Code loading'}
          </button>
        </div>
      </div>
    </Card>
  )
}
