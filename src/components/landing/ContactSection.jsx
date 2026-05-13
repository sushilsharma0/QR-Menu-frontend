import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Mail, MapPin, MessageCircle, Phone } from 'lucide-react'
import SectionHeader from './SectionHeader'
import { useLandingBranding } from '../../context/LandingBrandingContext'

const ContactSection = () => {
  const { contactPhone, supportEmail, publicSiteUrl, chat, softwareName } = useLandingBranding()

  const contactItems = useMemo(() => {
    const items = []
    const phone = (contactPhone || '').trim()
    if (phone) {
      const digits = phone.replace(/\D/g, '')
      items.push({
        icon: Phone,
        label: 'Phone',
        value: phone,
        href: digits ? `tel:+${digits}` : '#',
      })
    }
    const email = (supportEmail || '').trim()
    if (email) {
      items.push({
        icon: Mail,
        label: 'Email',
        value: email,
        href: `mailto:${email}`,
      })
    }
    const url = (publicSiteUrl || '').trim()
    if (url) {
      const href = url.startsWith('http') ? url : `https://${url}`
      items.push({
        icon: MapPin,
        label: 'Website',
        value: url.replace(/^https?:\/\//i, ''),
        href,
      })
    }
    if (!items.length) {
      items.push(
        { icon: Phone, label: 'Phone', value: '+977 9800000000', href: 'tel:+9779800000000' },
        { icon: Mail, label: 'Email', value: 'support@example.com', href: 'mailto:support@example.com' },
        { icon: MapPin, label: 'Location', value: 'Kathmandu, Nepal', href: '#' },
      )
    }
    return items
  }, [contactPhone, supportEmail, publicSiteUrl])

  const waDigits = String(chat?.whatsappNumber || '').replace(/\D/g, '')
  const waMsg = encodeURIComponent(chat?.whatsappMessage || `Hi ${softwareName || ''}, I want to set up my restaurant.`)
  const waHref = waDigits ? `https://wa.me/${waDigits}?text=${waMsg}` : 'https://wa.me/'

  return (
    <section id="contact" className="py-14 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Contact Us"
          title="Need help setting up your restaurant?"
          description="Talk to our team for onboarding, QR menu setup, billing help, and restaurant workflow guidance."
        />

        <div className="mt-10 grid gap-4 sm:mt-12 sm:gap-5 lg:grid-cols-[1.05fr_0.95fr]">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-2xl border border-surface-200 bg-gradient-to-br from-white via-surface-50/60 to-secondary-50/30 p-5 shadow-sm sm:rounded-3xl sm:p-7 lg:p-8"
          >
            <h3 className="text-lg font-black text-slate-950 sm:text-xl">Let’s launch your restaurant faster</h3>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              We help restaurants, cafes, and food businesses start digital ordering with confidence.
            </p>

            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: '-60px' }}
              variants={{
                hidden: { opacity: 0 },
                show: { opacity: 1, transition: { staggerChildren: 0.08 } },
              }}
              className="mt-5 grid gap-2.5 sm:mt-6 sm:gap-3 sm:grid-cols-2"
            >
              {contactItems.map((item) => {
                const Icon = item.icon
                const Container = item.href === '#' ? motion.div : motion.a
                return (
                  <Container
                    key={item.label}
                    variants={{
                      hidden: { opacity: 0, y: 12 },
                      show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
                    }}
                    whileHover={{ y: -3, scale: 1.01 }}
                    href={item.href === '#' ? undefined : item.href}
                    className="group flex items-center gap-3 rounded-2xl border border-surface-200 bg-white px-3 py-2.5 transition-all duration-300 hover:border-primary-200 hover:shadow-md sm:px-4 sm:py-3"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white transition-all duration-300 group-hover:rotate-6 group-hover:bg-secondary-600 sm:h-10 sm:w-10">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-wide text-slate-500 sm:text-xs">
                        {item.label}
                      </p>
                      <p className="truncate text-sm font-bold text-slate-800">{item.value}</p>
                    </div>
                  </Container>
                )
              })}
            </motion.div>

            <div className="mt-5 rounded-2xl border border-surface-200 bg-white p-4 sm:mt-6">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary-700 sm:text-xs sm:tracking-[0.2em]">
                Support Hours
              </p>
              <p className="mt-2 text-sm font-bold text-slate-800">24/7 Support Available</p>
              <p className="mt-1 text-xs text-slate-500">Anytime help for onboarding, setup, and live restaurant operations.</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="relative overflow-hidden rounded-2xl border border-surface-200 bg-gradient-to-br from-primary-700 via-primary-600 to-secondary-600 p-5 text-white shadow-xl sm:rounded-3xl sm:p-7 lg:p-8"
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1], opacity: [0.4, 0.6, 0.4] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/15 blur-3xl"
            />
            <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-attention-100 sm:text-xs">
              <MessageCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              Quick Support
            </span>
            <h3 className="mt-3 text-xl font-black leading-tight tracking-tight sm:mt-4 sm:text-2xl">
              Chat with us on WhatsApp
            </h3>
            <p className="mt-2 text-sm leading-7 text-white/90 sm:mt-3">
              Get instant support for onboarding, pricing, and setup. Our team is ready to assist your restaurant.
            </p>
            <div className="mt-3 grid gap-2 text-xs font-bold text-white/90 sm:mt-4">
              <p className="inline-flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-attention-200" />
                Free onboarding guidance
              </p>
              <p className="inline-flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-attention-200" />
                Setup support for menu and QR
              </p>
              <p className="inline-flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-attention-200" />
                Fast billing and workflow help
              </p>
            </div>
            <a
              href={waHref}
              target="_blank"
              rel="noreferrer"
              className="group mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-black text-primary-700 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl sm:mt-6 sm:px-5"
            >
              Start WhatsApp Chat
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </a>

            <div className="mt-4 rounded-2xl border border-white/20 bg-white/10 p-3 backdrop-blur sm:mt-5 sm:p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-attention-100 sm:text-[11px] sm:tracking-[0.2em]">
                Priority Onboarding
              </p>
              <p className="mt-1 text-xs font-semibold text-white sm:text-sm">
                First response usually within 10 minutes, 24/7.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

export default ContactSection
