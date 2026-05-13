import React from 'react'
import { motion } from 'framer-motion'
import SectionHeader from './SectionHeader'

const BestThingsSection = ({ items }) => (
  <section id="best" className="py-14 sm:py-20 lg:py-24">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <SectionHeader
        eyebrow="Benefits Section"
        title="Built for Faster Service and Better Restaurant Operations"
        description="Every feature is designed to help restaurant teams work faster while giving guests a smoother dining experience."
      />
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-60px' }}
        variants={{
          hidden: { opacity: 0 },
          show: { opacity: 1, transition: { staggerChildren: 0.08 } },
        }}
        className="mt-10 grid gap-3 sm:mt-12 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {items.map((item) => {
          const Icon = item.icon
          return (
            <motion.div
              key={item.value}
              variants={{
                hidden: { opacity: 0, y: 24 },
                show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
              }}
              whileHover={{ y: -6 }}
              className="group rounded-2xl border border-surface-200 bg-gradient-to-br from-white via-surface-50/60 to-secondary-50/50 p-5 shadow-sm transition-all duration-300 hover:shadow-xl sm:p-6"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-600 text-white shadow-lg shadow-primary-900/20 transition-all duration-300 group-hover:rotate-6 group-hover:bg-secondary-600 sm:h-12 sm:w-12">
                <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
              </span>
              <h3 className="mt-4 text-xl font-black text-slate-950 sm:mt-5 sm:text-2xl">{item.value}</h3>
              <p className="mt-2 text-sm leading-7 text-slate-600 sm:mt-3">{item.label}</p>
            </motion.div>
          )
        })}
      </motion.div>
    </div>
  </section>
)

export default BestThingsSection
