import React from 'react'
import { motion } from 'framer-motion'
import SectionHeader from './SectionHeader'

const BestThingsSection = ({ items }) => (
  <section id="best" className="py-16 sm:py-24">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <SectionHeader
        eyebrow="Benefits Section"
        title="Built for Faster Service and Better Restaurant Operations"
        description="Every feature is designed to help restaurant teams work faster while giving guests a smoother dining experience."
      />
      <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {items.map((item, index) => {
          const Icon = item.icon
          return (
            <motion.div
              key={item.value}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ delay: index * 0.07, duration: 0.5 }}
              className="group rounded-2xl border border-surface-200 bg-gradient-to-br from-white via-surface-50/60 to-secondary-50/50 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-600 text-white shadow-lg shadow-primary-900/20 transition group-hover:bg-secondary-600">
                <Icon className="h-6 w-6" />
              </span>
              <h3 className="mt-5 text-2xl font-black text-slate-950">{item.value}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{item.label}</p>
            </motion.div>
          )
        })}
      </div>
    </div>
  </section>
)

export default BestThingsSection
