import React from 'react'
import { motion } from 'framer-motion'
import { BadgeCheck, ChefHat, LayoutDashboard, ShieldCheck } from 'lucide-react'
import SectionHeader from './SectionHeader'

const points = [
  { icon: LayoutDashboard, text: 'Platform admins control CMS, blogs, restaurants, KYC, plans, billing, and tickets.' },
  { icon: ChefHat, text: 'Restaurant teams manage menus, tables, QR codes, employees, orders, and promotions.' },
  { icon: ShieldCheck, text: 'Role-based access keeps customers, staff, vendors, and platform admins in the right place.' },
]

const AboutSection = ({ about }) => (
  <section id="about" className="bg-slate-950 py-16 text-white sm:py-24">
    <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
      <motion.div
        initial={{ opacity: 0, x: -24 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden rounded-[2rem]"
      >
        <img src={about.image} alt={about.title} className="h-full min-h-[420px] w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
        <div className="absolute bottom-5 left-5 right-5 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
          <div className="flex items-center gap-3">
            <BadgeCheck className="h-6 w-6 text-emerald-300" />
            <p className="text-sm font-black">Dynamic about photo and copy from CMS page key containing "about".</p>
          </div>
        </div>
      </motion.div>

      <div className="flex flex-col justify-center">
        <SectionHeader align="left" tone="dark" eyebrow="About" title={about.title} description={about.description} />
        <div className="mt-10 grid gap-4">
          {points.map((point, index) => {
            const Icon = point.icon
            return (
              <motion.div
                key={point.text}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ delay: index * 0.08, duration: 0.5 }}
                className="grid gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 sm:grid-cols-[auto_1fr]"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-400 text-slate-950">
                  <Icon className="h-5 w-5" />
                </span>
                <p className="text-sm font-semibold leading-7 text-slate-300">{point.text}</p>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  </section>
)

export default AboutSection
