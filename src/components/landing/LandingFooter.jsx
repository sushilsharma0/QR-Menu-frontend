import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiFacebook, FiInstagram, FiLinkedin, FiTwitter } from 'react-icons/fi'
import { ArrowRight, BookOpenText, ChefHat, QrCode, TabletSmartphone } from 'lucide-react'
import BrandLogo from './BrandLogo'
import { navItems } from './landingDefaults'

const socials = [
  { label: 'Facebook', icon: FiFacebook, href: 'https://facebook.com' },
  { label: 'Instagram', icon: FiInstagram, href: 'https://instagram.com' },
  { label: 'Twitter', icon: FiTwitter, href: 'https://twitter.com' },
  { label: 'LinkedIn', icon: FiLinkedin, href: 'https://linkedin.com' },
]

const LandingFooter = () => (
  <footer className="border-t border-surface-200 bg-surface-50/60 py-12">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="mb-10 rounded-2xl border border-surface-200 bg-white p-6 shadow-sm sm:p-7 lg:flex lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-primary-700">Final CTA Section</p>
          <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">Ready to Modernize Your Restaurant?</h3>
          <p className="mt-2 max-w-2xl text-sm text-slate-600 sm:text-base">Launch your restaurant with QR menus, live kitchen sync, digital billing, and a complete restaurant dashboard in minutes.</p>
        </div>
        <div className="mt-4 flex gap-3 lg:mt-0">
          <Link to="/vendor/register" className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-primary-900/20 transition hover:-translate-y-0.5 hover:bg-primary-700">
            Start Free
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link to="/vendor/login" className="rounded-xl border border-surface-300 bg-white px-5 py-3 text-sm font-black text-slate-700 hover:bg-surface-50">
            Restaurant Login
          </Link>
        </div>
      </div>

      <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr_1fr]">
      <div>
        <BrandLogo />
        <p className="mt-5 max-w-md text-sm leading-7 text-slate-600">
          Modern QR menu and restaurant management platform for restaurants, cafes, hotels, and food businesses across Nepal.
        </p>
        <div className="mt-6 flex flex-wrap gap-2 text-xs font-black text-slate-600">
          <span className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2"><QrCode className="h-4 w-4 text-primary-600" />QR Ordering</span>
          <span className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2"><TabletSmartphone className="h-4 w-4 text-primary-600" />Digital Menu</span>
          <span className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2"><ChefHat className="h-4 w-4 text-orange-600" />Kitchen Workflow</span>
          <span className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2"><BookOpenText className="h-4 w-4 text-secondary-600" />Platform CMS</span>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-black uppercase tracking-[0.22em] text-slate-500">Quick Links</h3>
        <div className="mt-5 grid gap-3">
          {navItems.map((item) => (
            <a key={item.label} href={item.href} className="text-sm font-bold text-slate-700 transition hover:text-primary-700">
              {item.label}
            </a>
          ))}
          <Link to="/vendor/login" className="text-sm font-bold text-slate-700 transition hover:text-primary-700">Vendor Login</Link>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-black uppercase tracking-[0.22em] text-slate-500">Platform Vision</h3>
        <p className="mt-4 text-sm leading-7 text-slate-600">
          Helping restaurants across Nepal deliver faster service, cleaner operations, and better guest experiences through smart digital ordering.
        </p>
        <h4 className="mt-5 text-xs font-black uppercase tracking-[0.2em] text-slate-500">Social</h4>
        <div className="mt-5 flex flex-wrap gap-3">
          {socials.map((social, index) => {
            const Icon = social.icon
            return (
              <motion.a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noreferrer"
                aria-label={social.label}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                whileHover={{ y: -5, rotate: index % 2 === 0 ? -4 : 4 }}
                transition={{ duration: 0.35, delay: index * 0.04 }}
                className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm hover:text-primary-700"
              >
                <Icon className="h-5 w-5" />
              </motion.a>
            )
          })}
        </div>
        <p className="mt-6 text-xs font-semibold text-slate-500">© {new Date().getFullYear()} QR Restro Nepal. Built for modern restaurants.</p>
      </div>
      </div>

      <div className="mt-10 border-t border-surface-200 pt-5 text-center text-xs font-semibold text-slate-500">
        <p>© {new Date().getFullYear()} QR Restro Nepal</p>
      </div>
    </div>
  </footer>
)

export default LandingFooter
