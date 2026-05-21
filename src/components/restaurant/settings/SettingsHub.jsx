import React from 'react'
import { LazyMotion, domAnimation, m } from 'framer-motion'
import { FiChevronRight, FiSettings } from 'react-icons/fi'
import { SETTINGS_SECTIONS } from './settingsConfig'
import { listContainerVariants, listItemVariants, sectionMotion } from '../devices/deviceAnimations'

export default function SettingsHub({ onSelectSection, isFeatureEnabled }) {
  const sections = SETTINGS_SECTIONS.filter(
    (section) => !section.requiresFeature || isFeatureEnabled(section.requiresFeature),
  )

  return (
    <LazyMotion features={domAnimation}>
      <div className="space-y-6">
      <m.section
        {...sectionMotion}
        className="relative overflow-hidden rounded-3xl border border-surface-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900"
      >
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-r from-primary-50 via-surface-50 to-violet-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800" />
        <div className="relative p-5 md:p-7">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary-100 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary-700 shadow-sm dark:border-gray-700 dark:bg-gray-800/80 dark:text-primary-300">
            <FiSettings className="h-4 w-4" />
            Configuration
          </div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-gray-950 dark:text-gray-100">
            Restaurant Settings
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-gray-500 dark:text-gray-400">
            Choose a section to manage your profile, appearance, notifications, backups, and more.
          </p>
        </div>
      </m.section>

      <m.div
        variants={listContainerVariants}
        initial="hidden"
        animate="show"
        className="grid gap-3 sm:grid-cols-2"
      >
        {sections.map((section) => {
          const Icon = section.icon
          return (
            <m.button
              key={section.id}
              type="button"
              variants={listItemVariants}
              whileHover={{ y: -3, scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => onSelectSection(section.id)}
              className="group flex items-start gap-4 rounded-2xl border border-surface-200 bg-white p-5 text-left shadow-sm transition hover:border-primary-200 hover:shadow-md dark:border-gray-800 dark:bg-gray-900 dark:hover:border-primary-800"
            >
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${section.accent} text-white shadow-md`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-bold text-gray-950 dark:text-gray-100">{section.label}</p>
                  <FiChevronRight className="h-5 w-5 shrink-0 text-gray-300 transition group-hover:translate-x-0.5 group-hover:text-primary-600 dark:text-gray-600" />
                </div>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{section.description}</p>
              </div>
            </m.button>
          )
        })}
      </m.div>
    </div>
    </LazyMotion>
  )
}
