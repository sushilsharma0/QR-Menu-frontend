import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiFacebook, FiInstagram, FiLinkedin, FiTwitter } from 'react-icons/fi'
import { BookOpenText, ChefHat, TabletSmartphone } from 'lucide-react'
import BrandLogo from './BrandLogo'
import { navItems } from './landingDefaults'

const socials = [
  { label: 'Facebook', icon: FiFacebook, href: 'https://facebook.com' },
  { label: 'Instagram', icon: FiInstagram, href: 'https://instagram.com' },
  { label: 'Twitter', icon: FiTwitter, href: 'https://twitter.com' },
  { label: 'LinkedIn', icon: FiLinkedin, href: 'https://linkedin.com' },
]

const LandingFooter = () => (
  <footer className="border-t border-slate-200 bg-[#f7fbf7] py-12">
    <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[1.2fr_0.8fr_1fr] lg:px-8">
      <div>
        <BrandLogo />
        <p className="mt-5 max-w-md text-sm leading-7 text-slate-600">
          Digital menu, QR ordering, restaurant dashboards, and platform CMS for restaurants across Nepal.
        </p>
        <div className="mt-6 flex flex-wrap gap-3 text-sm font-black text-slate-600">
          <span className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2"><TabletSmartphone className="h-4 w-4 text-emerald-600" />Responsive</span>
          <span className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2"><ChefHat className="h-4 w-4 text-orange-600" />Restaurant first</span>
          <span className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2"><BookOpenText className="h-4 w-4 text-sky-600" />Admin blog</span>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-black uppercase tracking-[0.22em] text-slate-500">Explore</h3>
        <div className="mt-5 grid gap-3">
          {navItems.map((item) => (
            <a key={item.label} href={item.href} className="text-sm font-bold text-slate-700 transition hover:text-emerald-700">
              {item.label}
            </a>
          ))}
          <Link to="/vendor/login" className="text-sm font-bold text-slate-700 transition hover:text-emerald-700">Vendor Login</Link>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-black uppercase tracking-[0.22em] text-slate-500">Social</h3>
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
                className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm hover:text-emerald-700"
              >
                <Icon className="h-5 w-5" />
              </motion.a>
            )
          })}
        </div>
        <p className="mt-6 text-xs font-semibold text-slate-500">© {new Date().getFullYear()} QR Restro Nepal. All rights reserved.</p>
      </div>
    </div>
  </footer>
)

export default LandingFooter
