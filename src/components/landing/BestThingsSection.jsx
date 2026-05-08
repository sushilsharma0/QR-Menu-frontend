import React from 'react'
import { motion } from 'framer-motion'
import SectionHeader from './SectionHeader'

const BestThingsSection = ({ items }) => (
  <section id="best" className="bg-white/80 py-16 backdrop-blur sm:py-24">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <SectionHeader
        eyebrow="Best Things"
        title="A platform that feels ready before the rush starts."
        description="The landing page, public content, restaurant operations, and platform control panel now work as one product story."
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
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-950 text-white">
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
