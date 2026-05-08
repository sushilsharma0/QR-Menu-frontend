import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Menu, X } from 'lucide-react'
import BrandLogo from './BrandLogo'
import { navItems } from './landingDefaults'

const NavLink = ({ item, onClick, isActive = false }) => (
  <a
    href={item.href}
    onClick={(event) => onClick(event, item.href)}
    className={`rounded-full px-4 py-2 text-sm font-black transition ${
      isActive
        ? 'bg-white text-primary-700 shadow-sm'
        : 'text-slate-600 hover:bg-white hover:text-primary-700 hover:shadow-sm'
    }`}
  >
    {item.label}
  </a>
)

const LandingNavbar = () => {
  const [open, setOpen] = useState(false)
  const [activeSection, setActiveSection] = useState('#home')
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 12)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const sections = navItems
      .map((item) => document.querySelector(item.href))
      .filter(Boolean)

    if (!sections.length) return undefined

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(`#${entry.target.id}`)
          }
        })
      },
      { rootMargin: '-35% 0px -45% 0px', threshold: 0.01 },
    )

    sections.forEach((section) => observer.observe(section))
    return () => observer.disconnect()
  }, [])

  const close = () => setOpen(false)
  const handleSectionNav = (event, href) => {
    if (!href?.startsWith('#')) return
    event.preventDefault()

    const section = document.querySelector(href)
    if (!section) return

    const rect = section.getBoundingClientRect()
    const sectionHeight = rect.height
    const viewportHeight = window.innerHeight
    const targetTop = window.scrollY + rect.top - Math.max(0, (viewportHeight - sectionHeight) / 2) - 24

    window.scrollTo({
      top: Math.max(0, targetTop),
      behavior: 'smooth',
    })
  }

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 px-3 py-3 sm:px-5">
        <nav
          className={`mx-auto grid max-w-7xl grid-cols-[auto_1fr_auto] items-center rounded-2xl border px-4 backdrop-blur-xl transition-all lg:px-5 ${
            scrolled
              ? 'h-14 border-surface-300 bg-white/95 shadow-2xl shadow-slate-900/10'
              : 'h-16 border-white/80 bg-white/90 shadow-xl shadow-slate-900/5'
          }`}
        >
          <BrandLogo />

          <div className="hidden justify-center lg:flex">
            <div className="flex items-center gap-1 rounded-full bg-slate-100 p-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.label}
                  item={item}
                  onClick={handleSectionNav}
                  isActive={activeSection === item.href}
                />
              ))}
            </div>
          </div>

          <div className="hidden items-center justify-end gap-3 lg:flex">
            <Link to="/vendor/login" className="rounded-xl px-4 py-2 text-sm font-black text-slate-700 transition hover:bg-slate-100">
              Login
            </Link>
            <Link to="/vendor/register" className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-primary-900/20 transition hover:-translate-y-0.5 hover:bg-primary-700">
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
                <a
                  key={item.label}
                  href={item.href}
                  onClick={(event) => {
                    handleSectionNav(event, item.href)
                    close()
                  }}
                  className="rounded-xl px-4 py-3 text-base font-black text-slate-800 hover:bg-slate-100"
                >
                  {item.label}
                </a>
              ))}
            </div>
            <div className="mt-auto grid gap-3 border-t border-slate-200 p-5">
              <Link to="/vendor/register" onClick={close} className="rounded-xl bg-primary-600 px-5 py-3 text-center text-sm font-black text-white">
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
