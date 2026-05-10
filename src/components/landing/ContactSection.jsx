import React, { useMemo } from 'react'
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
    <section id="contact" className="py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Contact Us"
          title="Need help setting up your restaurant?"
          description="Talk to our team for onboarding, QR menu setup, billing help, and restaurant workflow guidance."
        />

        <div className="mt-12 grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-3xl border border-surface-200 bg-gradient-to-br from-white via-surface-50/60 to-secondary-50/30 p-6 shadow-sm sm:p-8">
            <h3 className="text-xl font-black text-slate-950">Let’s launch your restaurant faster</h3>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              We help restaurants, cafes, and food businesses start digital ordering with confidence.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {contactItems.map((item) => {
                const Icon = item.icon
                const Container = item.href === '#' ? 'div' : 'a'
                return (
                  <Container
                    key={item.label}
                    href={item.href === '#' ? undefined : item.href}
                    className="group flex items-center gap-3 rounded-2xl border border-surface-200 bg-white px-4 py-3 transition hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-md"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-600 text-white transition group-hover:bg-secondary-600">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-xs font-black uppercase tracking-wide text-slate-500">{item.label}</p>
                      <p className="text-sm font-bold text-slate-800">{item.value}</p>
                    </div>
                  </Container>
                )
              })}
            </div>

            <div className="mt-6 rounded-2xl border border-surface-200 bg-white p-4">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-primary-700">Support Hours</p>
              <p className="mt-2 text-sm font-bold text-slate-800">24/7 Support Available</p>
              <p className="mt-1 text-xs text-slate-500">Anytime help for onboarding, setup, and live restaurant operations.</p>
            </div>
          </div>

          <div className="rounded-3xl border border-surface-200 bg-gradient-to-br from-primary-700 via-primary-600 to-secondary-600 p-6 text-white shadow-xl sm:p-8">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-wide text-attention-100">
              <MessageCircle className="h-3.5 w-3.5" />
              Quick Support
            </span>
            <h3 className="mt-4 text-2xl font-black tracking-tight">Chat with us on WhatsApp</h3>
            <p className="mt-3 text-sm leading-7 text-white/90">
              Get instant support for onboarding, pricing, and setup. Our team is ready to assist your restaurant.
            </p>
            <div className="mt-4 grid gap-2 text-xs font-bold text-white/90">
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
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-black text-primary-700 transition hover:-translate-y-0.5"
            >
              Start WhatsApp Chat
              <ArrowRight className="h-4 w-4" />
            </a>

            <div className="mt-5 rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-attention-100">Priority Onboarding</p>
              <p className="mt-1 text-sm font-semibold text-white">First response usually within 10 minutes, 24/7.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default ContactSection
