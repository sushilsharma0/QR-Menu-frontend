import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { LazyMotion, domAnimation, m } from 'framer-motion'
import { FiFacebook, FiInstagram, FiLinkedin, FiTwitter } from 'react-icons/fi'
import { ArrowRight, BookOpenText, ChefHat, QrCode, TabletSmartphone } from 'lucide-react'
import BrandLogo from './BrandLogo'
import { navItems } from './landingDefaults'
import { useLandingBranding } from '../../context/LandingBrandingContext'

const socials = [
  { label: 'Facebook', icon: FiFacebook, href: 'https://facebook.com' },
  { label: 'Instagram', icon: FiInstagram, href: 'https://instagram.com' },
  { label: 'Twitter', icon: FiTwitter, href: 'https://twitter.com' },
  { label: 'LinkedIn', icon: FiLinkedin, href: 'https://linkedin.com' },
]
const LandingFooter = () => {
  const { softwareName, publicSiteUrl, footer: footerCopy } = useLandingBranding()
  const [copyrightYear, setCopyrightYear] = useState('')
  const displayName = softwareName || 'QR Restro Nepal'
  const siteUrl = (publicSiteUrl || '').trim()

  useEffect(() => {
    setCopyrightYear(new Date().getFullYear())
  }, [])

  return (
    <footer className="border-t border-surface-200 bg-surface-50/60 py-10 sm:py-12">
      <div className="mx-auto max-w-[92rem] px-4 sm:px-6 lg:px-8">
        <LazyMotion features={domAnimation}>
        <m.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mb-8 rounded-2xl border border-surface-200 bg-white p-5 shadow-sm sm:mb-10 sm:p-7 lg:flex lg:items-center lg:justify-between"
        >
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-primary-700 sm:text-xs sm:tracking-[0.24em]">
              Get started
            </p>
            <h3 className="mt-2 text-xl font-semibold leading-tight tracking-tight text-slate-950 sm:text-2xl md:text-3xl">
              {footerCopy?.ctaTitle || 'Ready to Modernize Your Restaurant?'}
            </h3>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
              {footerCopy?.ctaSubtitle ||
                'Launch your restaurant with QR menus, live kitchen sync, digital billing, and a complete restaurant dashboard in minutes.'}
            </p>
          </div>
          <div className="mt-4 flex flex-col gap-2.5 sm:flex-row sm:gap-3 lg:mt-0">
            <Link
              to="/vendor/register"
              className="group inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-primary-900/20 transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary-700 hover:shadow-primary-900/30"
            >
              Start Free
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
            <Link
              to="/vendor/login"
              className="rounded-xl border border-surface-300 bg-white px-5 py-3 text-center text-sm font-black text-slate-700 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary-200 hover:bg-surface-50 hover:text-primary-700"
            >
              Restaurant Login
            </Link>
          </div>
        </m.div>

        <div className="grid gap-8 sm:gap-10 md:grid-cols-2 lg:grid-cols-[1.2fr_0.8fr_1fr]">
          <m.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="md:col-span-2 lg:col-span-1"
          >
            <BrandLogo />
            <p className="mt-4 max-w-md text-sm leading-7 text-slate-600 sm:mt-5">
              {footerCopy?.tagline ||
                'Modern QR menu and restaurant management platform for restaurants, cafes, hotels, and food businesses across Nepal.'}
            </p>
            {siteUrl ? (
              <p className="mt-3 text-xs font-bold text-primary-700">
                <a
                  href={siteUrl.startsWith('http') ? siteUrl : `https://${siteUrl}`}
                  className="hover:underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  {siteUrl.replace(/^https?:\/\//i, '')}
                </a>
              </p>
            ) : null}
            <div className="mt-5 flex flex-wrap gap-2 text-[11px] font-black text-slate-600 sm:mt-6 sm:text-xs">
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-white px-2.5 py-1.5 transition-all hover:-translate-y-0.5 hover:shadow-md sm:gap-2 sm:px-3 sm:py-2">
                <QrCode className="h-3.5 w-3.5 text-primary-600 sm:h-4 sm:w-4" />
                QR Ordering
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-white px-2.5 py-1.5 transition-all hover:-translate-y-0.5 hover:shadow-md sm:gap-2 sm:px-3 sm:py-2">
                <TabletSmartphone className="h-3.5 w-3.5 text-primary-600 sm:h-4 sm:w-4" />
                Digital Menu
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-white px-2.5 py-1.5 transition-all hover:-translate-y-0.5 hover:shadow-md sm:gap-2 sm:px-3 sm:py-2">
                <ChefHat className="h-3.5 w-3.5 text-orange-600 sm:h-4 sm:w-4" />
                Kitchen Workflow
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-white px-2.5 py-1.5 transition-all hover:-translate-y-0.5 hover:shadow-md sm:gap-2 sm:px-3 sm:py-2">
                <BookOpenText className="h-3.5 w-3.5 text-secondary-600 sm:h-4 sm:w-4" />
                Platform CMS
              </span>
            </div>
          </m.div>

          <m.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 sm:text-sm sm:tracking-[0.22em]">
              Quick Links
            </h3>
            <div className="mt-4 grid gap-2.5 sm:mt-5 sm:gap-3">
              {navItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="inline-flex w-fit items-center gap-1 text-sm font-bold text-slate-700 transition-all duration-200 hover:translate-x-1 hover:text-primary-700"
                >
                  {item.label}
                </a>
              ))}
              <Link
                to="/vendor/login"
                className="inline-flex w-fit items-center gap-1 text-sm font-bold text-slate-700 transition-all duration-200 hover:translate-x-1 hover:text-primary-700"
              >
                Vendor Login
              </Link>
            </div>
          </m.div>

          <m.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 sm:text-sm sm:tracking-[0.22em]">
              Platform Vision
            </h3>
            <p className="mt-3 text-sm leading-7 text-slate-600 sm:mt-4">
              Helping restaurants across Nepal deliver faster service, cleaner operations, and better guest experiences through smart digital ordering.
            </p>
            <h4 className="mt-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500 sm:mt-5 sm:text-xs sm:tracking-[0.2em]">
              Social
            </h4>
            <div className="mt-3 flex flex-wrap gap-2.5 sm:mt-5 sm:gap-3">
              {socials.map((social, index) => {
                const Icon = social.icon
                return (
                  <m.a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={social.label}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    whileHover={{ y: -5, rotate: index % 2 === 0 ? -6 : 6, scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ duration: 0.35, delay: index * 0.04 }}
                    className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition-all hover:border-primary-200 hover:text-primary-700 sm:h-12 sm:w-12"
                  >
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                  </m.a>
                )
              })}
            </div>
            <p className="mt-5 text-[11px] font-semibold text-slate-500 sm:mt-6 sm:text-xs">
              Â© {copyrightYear || '2026'} {displayName}. Built for modern restaurants.
            </p>
          </m.div>
        </div>

        <div className="mt-8 border-t border-surface-200 pt-4 text-center text-[11px] font-semibold text-slate-500 sm:mt-10 sm:pt-5 sm:text-xs">
          <p>Â© {copyrightYear || '2026'} {displayName}</p>
        </div>
        </LazyMotion>
      </div>
    </footer>
  )
}

export default LandingFooter
