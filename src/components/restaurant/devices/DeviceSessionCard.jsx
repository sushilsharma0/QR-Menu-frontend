import React from 'react'
import { motion } from 'framer-motion'
import { FiClock, FiMapPin, FiMonitor, FiShield, FiSlash } from 'react-icons/fi'
import Button from '../../common/Button'
import DeviceAlertBadges from './DeviceAlertBadges'
import { formatDeviceDate, formatDeviceLocation } from './deviceUtils'
import { listItemVariants } from './deviceAnimations'

export default function DeviceSessionCard({ session, onRevoke, revoking, index = 0 }) {
  return (
    <motion.div
      variants={listItemVariants}
      whileHover={{ y: -2 }}
      className={`rounded-xl border p-4 transition-shadow hover:shadow-md ${
        session.isCurrent
          ? 'border-primary-200 bg-primary-50/40 dark:border-primary-800 dark:bg-primary-950/20'
          : 'border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900'
      }`}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <motion.div
          className="min-w-0"
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.04 }}
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 text-primary-700 dark:bg-gray-800 dark:text-primary-300">
              <FiMonitor className="h-5 w-5" />
            </span>
            <div>
              <p className="font-black text-gray-950 dark:text-gray-100">
                {session.browser} on {session.operatingSystem}
                {session.isCurrent && (
                  <span className="ml-2 text-xs font-bold text-primary-700 dark:text-primary-300">
                    Current
                  </span>
                )}
              </p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Device ID: {session.deviceId}
              </p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {session.deviceType || 'Device'}
                {session.screenResolution ? ` · ${session.screenResolution}` : ''}
                {session.timezone ? ` · ${session.timezone}` : ''}
              </p>
            </div>
          </div>
          <div className="mt-4 grid gap-3 text-sm text-gray-600 dark:text-gray-300 md:grid-cols-3">
            <span className="inline-flex items-center gap-2">
              <FiMapPin className="h-4 w-4 shrink-0" />
              {formatDeviceLocation(session.loginLocation)}
            </span>
            <span className="inline-flex items-center gap-2">
              <FiShield className="h-4 w-4 shrink-0" />
              {session.ipAddress || 'Unknown IP'}
            </span>
            <span className="inline-flex items-center gap-2">
              <FiClock className="h-4 w-4 shrink-0" />
              {formatDeviceDate(session.lastActiveAt)}
            </span>
          </div>
          <div className="mt-3">
            <DeviceAlertBadges alerts={session.alerts} />
          </div>
        </motion.div>
        <div className="flex flex-wrap gap-2">
          {!session.isCurrent && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onRevoke(session.id)}
              loading={revoking === session.id}
            >
              <FiSlash className="mr-2 h-4 w-4" />
              Revoke
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  )
}
