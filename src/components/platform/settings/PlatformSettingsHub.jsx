import React from 'react'
import { LazyMotion, domAnimation, m } from 'framer-motion'
import { FiChevronRight, FiInfo, FiSettings } from 'react-icons/fi'
import { PLATFORM_ACCOUNT_SECTIONS } from './platformSettingsConfig'
import { listContainerVariants, listItemVariants, sectionMotion } from '../../restaurant/devices/deviceAnimations'

export default function PlatformSettingsHub({ onSelectSection }) {
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
            My account
          </div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-gray-950 dark:text-gray-100">Settings</h1>
          <p className="mt-2 max-w-3xl text-sm text-gray-500 dark:text-gray-400">
            Account overview, profile, and sign-in credentials. Other platform tools stay in the sidebar so nothing is configured twice.
          </p>
        </div>
      </m.section>

      <div className="flex gap-3 rounded-2xl border border-primary-100 bg-primary-50/70 p-4 text-sm text-primary-950 dark:border-primary-900/40 dark:bg-primary-950/25 dark:text-primary-100">
        <FiInfo className="mt-0.5 h-5 w-5 shrink-0 opacity-90" aria-hidden />
        <p className="leading-relaxed">
          Need to change employee ID, designation, or department? Super admins do that under <strong className="font-semibold">System → Admins</strong>. Billing and invoices live under{' '}
          <strong className="font-semibold">Finance</strong>.
        </p>
      </div>

      <m.div
        variants={listContainerVariants}
        initial="hidden"
        animate="show"
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
      >
        {PLATFORM_ACCOUNT_SECTIONS.map((section) => {
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
