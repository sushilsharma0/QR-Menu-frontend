import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiArrowLeft } from 'react-icons/fi'
import Button from '../../common/Button'
import { getPlatformSectionById } from './platformSettingsConfig'
import { sectionMotion } from '../../restaurant/devices/deviceAnimations'

export default function PlatformSettingsSectionShell({ sectionId, onBack, children, footer }) {
  const section = getPlatformSectionById(sectionId)

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={sectionId}
        initial={{ opacity: 0, x: 16 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -12 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="space-y-6"
      >
        <motion.section
          {...sectionMotion}
          className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-start gap-3">
            <Button type="button" variant="outline" size="sm" onClick={onBack}>
              <FiArrowLeft className="mr-2 h-4 w-4" />
              All settings
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-950 dark:text-gray-100">
                {section?.label || 'Settings'}
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {section?.description}
              </p>
            </div>
          </div>
        </motion.section>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.35 }}
        >
          {children}
        </motion.div>

        {footer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.12 }}
            className="flex flex-wrap gap-3 border-t border-gray-100 pt-4 dark:border-gray-800"
          >
            {footer}
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}
