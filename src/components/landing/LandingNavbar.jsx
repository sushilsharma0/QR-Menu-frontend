import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Menu, X } from 'lucide-react'
import BrandLogo from './BrandLogo'
import { navItems } from './landingDefaults'

const NavLink = ({ item, onClick }) => (
  <a href={item.href} onClick={onClick} className="rounded-full px-4 py-2 text-sm font-black text-slate-600 transition hover:bg-white hover:text-slate-950 hover:shadow-sm">
    {item.label}
  </a>
)

const LandingNavbar = () => {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  const close = () => setOpen(false)

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 px-3 py-3 sm:px-5">
        <nav className="mx-auto grid h-16 max-w-7xl grid-cols-[auto_1fr_auto] items-center rounded-2xl border border-white/80 bg-white/90 px-4 shadow-xl shadow-slate-900/5 backdrop-blur-xl lg:px-5">
          <BrandLogo />

          <div className="hidden justify-center lg:flex">
            <div className="flex items-center gap-1 rounded-full bg-slate-100 p-1">
              {navItems.map((item) => <NavLink key={item.label} item={item} />)}
            </div>
          </div>

          <div className="hidden items-center justify-end gap-3 lg:flex">
            <Link to="/vendor/login" className="rounded-xl px-4 py-2 text-sm font-black text-slate-700 transition hover:bg-slate-100">
              Login
            </Link>
            <Link to="/vendor/register" className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-lg shadow-slate-900/20 transition hover:-translate-y-0.5">
              Start Free
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setOpen(true)}
            className="ml-auto flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-800 lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </nav>
      </header>

      {open && (
        <div className="fixed inset-0 z-[60] bg-slate-950/50 lg:hidden" onClick={close}>
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            className="ml-auto flex h-full w-[min(88vw,390px)] flex-col bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex h-16 items-center justify-between border-b border-slate-200 px-5">
              <BrandLogo onClick={close} />
              <button type="button" onClick={close} className="flex h-10 w-10 items-center justify-center rounded-xl hover:bg-slate-100" aria-label="Close menu">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid gap-2 p-5">
              {navItems.map((item) => (
                <a key={item.label} href={item.href} onClick={close} className="rounded-xl px-4 py-3 text-base font-black text-slate-800 hover:bg-slate-100">
                  {item.label}
                </a>
              ))}
            </div>
            <div className="mt-auto grid gap-3 border-t border-slate-200 p-5">
              <Link to="/vendor/register" onClick={close} className="rounded-xl bg-slate-950 px-5 py-3 text-center text-sm font-black text-white">
                Register Vendor
              </Link>
              <Link to="/vendor/login" onClick={close} className="rounded-xl border border-slate-200 px-5 py-3 text-center text-sm font-black text-slate-700">
                Vendor Login
              </Link>
            </div>
          </motion.aside>
        </div>
      )}
    </>
  )
}

export default LandingNavbar
