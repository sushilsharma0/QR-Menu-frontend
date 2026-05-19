import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiMonitor } from 'react-icons/fi'
import Card from '../../common/Card'
import DeviceSessionCard from './DeviceSessionCard'
import { sectionMotionDelayed, listContainerVariants } from './deviceAnimations'
export default function ActiveSessionsSection({
  sessions = [],
  loading,
  revoking,
  onRevoke,
}) {
  return (
    <motion.section {...sectionMotionDelayed(0.14)}>
      <Card title="Active sessions" icon={FiMonitor}>
        {loading ? (
          <div className="flex justify-center py-12">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }}
              className="h-8 w-8 rounded-full border-2 border-primary-600 border-t-transparent"
            />
          </div>
        ) : sessions.length ? (
          <motion.div
            variants={listContainerVariants}
            initial="hidden"
            animate="show"
            className="space-y-3"
          >
            <AnimatePresence mode="popLayout">
              {sessions.map((session, index) => (
                <DeviceSessionCard
                  key={session.id}
                  session={session}
                  onRevoke={onRevoke}
                  revoking={revoking}
                  index={index}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-10 text-center text-sm text-gray-500 dark:text-gray-400"
          >
            No active sessions found.
          </motion.div>
        )}
      </Card>
    </motion.section>
  )
}
