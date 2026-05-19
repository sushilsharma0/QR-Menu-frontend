import React from 'react'
import { motion } from 'framer-motion'
import { FiAlertTriangle, FiClock, FiMonitor, FiShield } from 'react-icons/fi'
import { sectionMotionDelayed } from './deviceAnimations'
import { countSuspiciousSessions } from './deviceUtils'

function MetricTile({ label, value, sub, icon: Icon, accent }) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      className="rounded-2xl border border-surface-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            {label}
          </p>
          <p className="mt-2 text-2xl font-bold text-gray-950 dark:text-gray-100">{value}</p>
          {sub && <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{sub}</p>}
        </div>
        <motion.div
          className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${accent} text-white shadow-md`}
          whileHover={{ scale: 1.05 }}
        >
          <Icon className="h-5 w-5" />
        </motion.div>
      </div>
    </motion.div>
  )
}

export default function DevicesSummarySection({ sessions = [], history = [], loading }) {
  const suspicious = countSuspiciousSessions(sessions)
  const otherDevices = sessions.filter((s) => !s.isCurrent).length

  return (
    <motion.section
      {...sectionMotionDelayed(0.08)}
      className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"
    >
      <MetricTile
        label="Active sessions"
        value={loading ? '—' : sessions.length}
        sub="Signed in right now"
        icon={FiMonitor}
        accent="from-primary-600 to-secondary-500"
      />
      <MetricTile
        label="Other devices"
        value={loading ? '—' : otherDevices}
        sub="Can be force logged out"
        icon={FiShield}
        accent="from-blue-500 to-indigo-500"
      />
      <MetricTile
        label="Needs review"
        value={loading ? '—' : suspicious}
        sub="Unknown device or travel alerts"
        icon={FiAlertTriangle}
        accent="from-amber-500 to-orange-500"
      />
      <MetricTile
        label="Login history"
        value={loading ? '—' : Math.min(history.length, 20)}
        sub="Recent entries shown"
        icon={FiClock}
        accent="from-emerald-500 to-teal-500"
      />
    </motion.section>
  )
}
