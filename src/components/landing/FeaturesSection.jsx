import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import SectionHeader from './SectionHeader'

const FeaturesSection = ({ features }) => (
  <section id="features" className="py-14 sm:py-20 lg:py-24">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="rounded-2xl border border-surface-200 bg-gradient-to-br from-white via-surface-50/70 to-secondary-50/40 p-5 shadow-sm sm:rounded-3xl sm:p-7 md:p-8"
      >
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <SectionHeader
            align="left"
            eyebrow="Features"
            title="Everything Your Restaurant Needs in One Smart Platform"
            description="A complete workflow designed for restaurants in Nepal - from digital menu to billing."
          />
          <Link
            to="/vendor/register"
            className="group inline-flex w-fit items-center gap-2 rounded-2xl bg-primary-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-primary-900/20 transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary-700 hover:shadow-primary-900/30"
          >
            Start setup
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="mt-5 grid gap-2 sm:mt-6 sm:gap-3 sm:grid-cols-3">
          {['QR ordering', 'Live kitchen flow', 'Fast cashier billing'].map((pill, idx) => (
            <motion.div
              key={pill}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.1 + idx * 0.08 }}
              className="rounded-xl border border-surface-200 bg-white px-3 py-2.5 text-center text-xs font-black text-slate-700 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary-200 hover:text-primary-700 hover:shadow-md sm:px-4 sm:py-3 sm:text-sm"
            >
              {pill}
            </motion.div>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-60px' }}
        variants={{
          hidden: { opacity: 0 },
          show: { opacity: 1, transition: { staggerChildren: 0.07 } },
        }}
        className="mt-8 grid gap-3 sm:mt-10 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
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
              variants={{
                hidden: { opacity: 0, y: 26 },
                show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
              }}
              whileHover={{ y: -6 }}
              className="group relative overflow-hidden rounded-2xl border border-surface-200 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-xl sm:p-6"
            >
              <div className="absolute right-0 top-0 h-24 w-24 -translate-y-10 translate-x-10 rounded-full bg-surface-100/80 blur-2xl transition-all duration-500 group-hover:scale-150" />
              <span className={`relative flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 sm:h-12 sm:w-12 ${iconTone}`}>
                <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
              </span>
              <h3 className="relative mt-4 text-lg font-black text-slate-950 sm:mt-5 sm:text-xl">{feature.title}</h3>
              <p className="relative mt-2 text-sm leading-7 text-slate-600 sm:mt-3">{feature.text}</p>
            </motion.article>
          )
        })}
      </motion.div>
    </div>
  </section>
)

export default FeaturesSection
