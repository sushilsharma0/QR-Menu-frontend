import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import SectionHeader from './SectionHeader'

const FeaturesSection = ({ features }) => (
  <section id="features" className="py-16 sm:py-24">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-surface-200 bg-gradient-to-br from-white via-surface-50/70 to-secondary-50/40 p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <SectionHeader
            align="left"
            eyebrow="Features"
            title="Everything Your Restaurant Needs in One Smart Platform"
            description="A complete workflow designed for restaurants in Nepal - from digital menu to billing."
          />
          <Link to="/vendor/register" className="inline-flex w-fit items-center gap-2 rounded-2xl bg-primary-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-primary-900/20 transition hover:-translate-y-0.5 hover:bg-primary-700">
            Start setup
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {['QR ordering', 'Live kitchen flow', 'Fast cashier billing'].map((pill) => (
            <div key={pill} className="rounded-xl border border-surface-200 bg-white px-4 py-3 text-center text-sm font-black text-slate-700">
              {pill}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature, index) => {
          const Icon = feature.icon
          const iconTone = index % 3 === 0
            ? 'bg-primary-600'
            : index % 3 === 1
              ? 'bg-secondary-600'
              : 'bg-accent-500'

          return (
            <motion.article
              key={`${feature.title}-${index}`}
              initial={{ opacity: 0, y: 26 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              whileHover={{ y: -6 }}
              transition={{ duration: 0.45, delay: index * 0.04 }}
              className="group relative overflow-hidden rounded-2xl border border-surface-200 bg-white p-6 shadow-sm transition hover:shadow-xl"
            >
              <div className="absolute right-0 top-0 h-24 w-24 -translate-y-10 translate-x-10 rounded-full bg-surface-100/80 blur-2xl" />
              <span className={`relative flex h-12 w-12 items-center justify-center rounded-xl text-white shadow-lg transition group-hover:scale-105 ${iconTone}`}>
                <Icon className="h-6 w-6" />
              </span>
              <h3 className="relative mt-5 text-xl font-black text-slate-950">{feature.title}</h3>
              <p className="relative mt-3 text-sm leading-7 text-slate-600">{feature.text}</p>
            </motion.article>
          )
        })}
      </div>
    </div>
  </section>
)

export default FeaturesSection
