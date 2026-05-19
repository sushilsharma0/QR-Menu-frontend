import React from 'react'
import { motion } from 'framer-motion'
import { FiRefreshCw, FiShield } from 'react-icons/fi'
import Button from '../../common/Button'
import { sectionMotion } from './deviceAnimations'

export default function DevicesPageHeader({
  onRefresh,
  onRevokeOthers,
  loading,
  revokingOthers,
}) {
  return (
    <motion.section
      {...sectionMotion}
      className="relative overflow-hidden rounded-3xl border border-surface-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900"
    >
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-r from-primary-50 via-surface-50 to-indigo-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800" />
      <div className="relative p-5 md:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary-100 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary-700 shadow-sm dark:border-gray-700 dark:bg-gray-800/80 dark:text-primary-300">
              <FiShield className="h-4 w-4" />
              Security
            </div>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-gray-950 dark:text-gray-100">
              Active Devices
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-gray-500 dark:text-gray-400">
              Review browser sessions, revoke access on unfamiliar devices, and inspect recent login
              activity.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" onClick={onRefresh} disabled={loading}>
              <FiRefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={onRevokeOthers}
              loading={revokingOthers}
            >
              Force Logout Others
            </Button>
          </div>
        </div>
      </div>
    </motion.section>
  )
}
