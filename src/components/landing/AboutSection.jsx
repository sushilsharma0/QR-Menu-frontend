import React from 'react'
import { motion } from 'framer-motion'
import { BadgeCheck, ChefHat, LayoutDashboard, ShieldCheck, Sparkles, Users } from 'lucide-react'
import SectionHeader from './SectionHeader'

const points = [
  { icon: ChefHat, text: 'Create and manage digital menus' },
  { icon: LayoutDashboard, text: 'Control pricing and stock instantly' },
  { icon: Users, text: 'Track live order status' },
  { icon: ShieldCheck, text: 'Manage tables and billing' },
  { icon: Sparkles, text: 'Give staff role-based access and improve customer ordering experience' },
]

const AboutSection = ({ about }) => (
  <section id="about" className="py-14 sm:py-20 lg:py-24">
    <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:gap-10 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
      <motion.div
        initial={{ opacity: 0, x: -24 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-3xl border border-surface-200 shadow-xl sm:rounded-[2rem]"
      >
        <img
          src={about.image}
          alt={about.title}
          loading="lazy"
          className="h-full min-h-[280px] w-full object-cover transition-transform duration-700 hover:scale-105 sm:min-h-[360px] lg:min-h-[420px]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-primary-900/65 via-transparent to-transparent" />
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="absolute bottom-4 left-4 right-4 rounded-2xl border border-white/30 bg-white/85 p-3 backdrop-blur sm:bottom-5 sm:left-5 sm:right-5 sm:p-4"
        >
          <div className="flex items-center gap-3">
            <BadgeCheck className="h-5 w-5 shrink-0 text-primary-600 sm:h-6 sm:w-6" />
            <p className="text-xs font-black text-slate-900 sm:text-sm">
              Trusted by restaurants for practical daily operations.
            </p>
          </div>
        </motion.div>
      </motion.div>

      <div className="flex flex-col justify-center">
        <SectionHeader
          align="left"
          eyebrow="About Section"
          title={about.title}
          description={`${about.description} From digital menus to kitchen coordination and cashier billing, the platform connects your entire restaurant workflow in one place.`}
        />
        <h3 className="mt-6 text-xs font-black uppercase tracking-[0.2em] text-primary-700 sm:mt-8 sm:text-sm">
          What Restaurants Can Do
        </h3>
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-60px' }}
          variants={{
            hidden: { opacity: 0 },
            show: { opacity: 1, transition: { staggerChildren: 0.08 } },
          }}
          className="mt-6 grid gap-3 sm:mt-10 sm:gap-4 sm:grid-cols-2"
        >
          {points.map((point) => {
            const Icon = point.icon
            return (
              <motion.div
                key={point.text}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
                }}
                whileHover={{ y: -4, scale: 1.01 }}
                className="grid gap-3 rounded-2xl border border-surface-200 bg-gradient-to-br from-white to-surface-50 p-4 transition-all duration-300 hover:border-primary-200 hover:shadow-lg sm:gap-4 sm:p-5 sm:grid-cols-[auto_1fr]"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-600 text-white sm:h-11 sm:w-11">
                  <Icon className="h-5 w-5" />
                </span>
                <p className="text-sm font-semibold leading-7 text-slate-600">{point.text}</p>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </div>
  </section>
)

export default AboutSection
