import React from 'react'
import { motion } from 'framer-motion'
import { BellRing, CreditCard, QrCode, ShoppingCart, UtensilsCrossed } from 'lucide-react'
import SectionHeader from './SectionHeader'

const steps = [
  { icon: QrCode, label: 'Scan QR Code' },
  { icon: UtensilsCrossed, label: 'Open Digital Menu' },
  { icon: ShoppingCart, label: 'Choose Food Items' },
  { icon: ShoppingCart, label: 'Add to Cart' },
  { icon: BellRing, label: 'Send Live Order' },
  { icon: BellRing, label: 'Kitchen Receives Alert' },
  { icon: CreditCard, label: 'Billing & Payment Ready' },
]

const QrOrderingFlowSection = () => (
  <section className="py-14 sm:py-20 lg:py-24">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <SectionHeader
        eyebrow="QR Ordering Flow"
        title="Simple Ordering Journey From Scan to Billing"
        description="Customers scan a QR code at the table, browse the menu instantly, place orders, and receive live order updates - all without waiting for printed menus or staff assistance."
      />

      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-60px' }}
        variants={{
          hidden: { opacity: 0 },
          show: { opacity: 1, transition: { staggerChildren: 0.06 } },
        }}
        className="mt-10 grid gap-2.5 sm:mt-12 sm:gap-3 sm:grid-cols-2 lg:grid-cols-4"
      >
        {steps.map((step, index) => {
          const Icon = step.icon
          return (
            <motion.div
              key={step.label}
              variants={{
                hidden: { opacity: 0, y: 20 },
                show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
              }}
              whileHover={{ y: -4, scale: 1.02 }}
              className="group flex items-center gap-3 rounded-xl border border-surface-200 bg-white p-3.5 shadow-sm transition-all duration-300 hover:border-primary-200 hover:shadow-md sm:p-4"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-600 text-white transition-all duration-300 group-hover:rotate-6 group-hover:bg-secondary-600 sm:h-10 sm:w-10">
                <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
              </span>
              <p className="text-sm font-black text-slate-800">{step.label}</p>
            </motion.div>
          )
        })}
      </motion.div>
    </div>
  </section>
)

export default QrOrderingFlowSection
