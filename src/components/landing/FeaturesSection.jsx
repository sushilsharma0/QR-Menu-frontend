import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import SectionHeader from './SectionHeader'

const FeaturesSection = ({ features }) => (
  <section id="features" className="py-16 sm:py-24">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <SectionHeader
          align="left"
          eyebrow="Features"
          title="Everything restaurants need, managed from clean portals."
          description="Admins can publish feature cards from CMS by creating active entries with type Feature."
        />
        <Link to="/vendor/register" className="inline-flex w-fit items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-900/20 transition hover:-translate-y-0.5">
          Start setup
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature, index) => {
          const Icon = feature.icon
          return (
            <motion.article
              key={`${feature.title}-${index}`}
              initial={{ opacity: 0, y: 26 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              whileHover={{ y: -5 }}
              transition={{ duration: 0.45, delay: index * 0.04 }}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-950 text-white">
                <Icon className="h-6 w-6" />
              </span>
              <h3 className="mt-5 text-xl font-black text-slate-950">{feature.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{feature.text}</p>
            </motion.article>
          )
        })}
      </div>
    </div>
  </section>
)

export default FeaturesSection
