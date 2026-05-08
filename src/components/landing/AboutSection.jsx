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
  <section id="about" className="py-16 sm:py-24">
    <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
      <motion.div
        initial={{ opacity: 0, x: -24 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden rounded-[2rem] border border-surface-200 shadow-xl"
      >
        <img src={about.image} alt={about.title} className="h-full min-h-[420px] w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-primary-900/65 via-transparent to-transparent" />
        <div className="absolute bottom-5 left-5 right-5 rounded-2xl border border-white/30 bg-white/80 p-4 backdrop-blur">
          <div className="flex items-center gap-3">
            <BadgeCheck className="h-6 w-6 text-primary-600" />
            <p className="text-sm font-black text-slate-900">Trusted by restaurants for practical daily operations.</p>
          </div>
        </div>
      </motion.div>

      <div className="flex flex-col justify-center">
        <SectionHeader
          align="left"
          eyebrow="About Section"
          title={about.title}
          description={`${about.description} From digital menus to kitchen coordination and cashier billing, the platform connects your entire restaurant workflow in one place.`}
        />
        <h3 className="mt-8 text-sm font-black uppercase tracking-[0.2em] text-primary-700">What Restaurants Can Do</h3>
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {points.map((point, index) => {
            const Icon = point.icon
            return (
              <motion.div
                key={point.text}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ delay: index * 0.08, duration: 0.5 }}
                className="grid gap-4 rounded-2xl border border-surface-200 bg-gradient-to-br from-white to-surface-50 p-5 sm:grid-cols-[auto_1fr]"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-600 text-white">
                  <Icon className="h-5 w-5" />
                </span>
                <p className="text-sm font-semibold leading-7 text-slate-600">{point.text}</p>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  </section>
)

export default AboutSection
