import React from 'react'
import { LazyMotion, domAnimation, m } from 'framer-motion'
import { FiClock } from 'react-icons/fi'
import Card from '../../common/Card'
import { formatDeviceDate, formatDeviceLocation } from './deviceUtils'
import { sectionMotionDelayed, tableRowVariants } from './deviceAnimations'

const HISTORY_LIMIT = 20
const EMPTY_HISTORY = []

export default function LoginHistorySection({ history = EMPTY_HISTORY, loading }) {
  const rows = history.slice(0, HISTORY_LIMIT)

  return (
    <LazyMotion features={domAnimation}>
      <m.section {...sectionMotionDelayed(0.2)}>
      <Card title="Login history" icon={FiClock}>
        {loading ? (
          <div className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">
            Loading history…
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 text-sm dark:divide-gray-800">
              <thead>
                <tr className="text-left text-xs font-black uppercase tracking-wider text-gray-400">
                  <th className="p-3">Device</th>
                  <th className="p-3">IP</th>
                  <th className="p-3">Location</th>
                  <th className="p-3">Login</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {rows.length ? (
                  rows.map((item, index) => (
                    <m.tr
                      key={item.id}
                      variants={tableRowVariants}
                      initial="hidden"
                      animate="show"
                      transition={{ delay: index * 0.03 }}
                      className="text-gray-700 dark:text-gray-200"
                    >
                      <td className="p-3">
                        {item.browser} on {item.operatingSystem}
                        <div className="text-xs text-gray-400">
                          {item.deviceType || 'Device'}
                          {item.timezone ? ` · ${item.timezone}` : ''}
                        </div>
                      </td>
                      <td className="p-3">{item.ipAddress || 'Unknown'}</td>
                      <td className="p-3">{formatDeviceLocation(item.loginLocation)}</td>
                      <td className="p-3">{formatDeviceDate(item.createdAt)}</td>
                      <td className="p-3">
                        {item.revokedAt ? (
                          <span className="text-amber-700 dark:text-amber-300">
                            Revoked: {item.revokedReason || 'ended'}
                          </span>
                        ) : (
                          <span className="font-semibold text-green-700 dark:text-green-300">
                            Active
                          </span>
                        )}
                      </td>
                    </m.tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-3 py-10 text-center text-sm text-gray-500 dark:text-gray-400"
                    >
                      No login history yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      </m.section>
    </LazyMotion>
  )
}
