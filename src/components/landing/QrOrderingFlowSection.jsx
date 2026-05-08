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
  <section className="py-16 sm:py-24">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <SectionHeader
        eyebrow="QR Ordering Flow"
        title="Simple Ordering Journey From Scan to Billing"
        description="Customers scan a QR code at the table, browse the menu instantly, place orders, and receive live order updates - all without waiting for printed menus or staff assistance."
      />

      <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((step, index) => {
          const Icon = step.icon
          return (
            <motion.div
              key={step.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ delay: index * 0.05, duration: 0.4 }}
              className="flex items-center gap-3 rounded-xl border border-surface-200 bg-white p-4 shadow-sm"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-600 text-white">
                <Icon className="h-4 w-4" />
              </span>
              <p className="text-sm font-black text-slate-800">{step.label}</p>
            </motion.div>
          )
        })}
      </div>
    </div>
  </section>
)

export default QrOrderingFlowSection
