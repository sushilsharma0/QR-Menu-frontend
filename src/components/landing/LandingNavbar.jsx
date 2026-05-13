import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Menu, X } from 'lucide-react'
import BrandLogo from './BrandLogo'
import { navItems } from './landingDefaults'

const NavLink = ({ item, onClick, isActive = false }) => (
  <a
    href={item.href}
    onClick={(event) => onClick(event, item.href)}
    className={`relative rounded-full px-3 py-2 text-sm font-black transition-all duration-300 xl:px-4 ${
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
      <motion.header
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="fixed inset-x-0 top-0 z-50 px-2 py-2 sm:px-5 sm:py-3"
      >
        <nav
          className={`mx-auto grid max-w-7xl grid-cols-[auto_1fr_auto] items-center rounded-2xl border px-3 backdrop-blur-xl transition-all duration-300 sm:px-4 lg:px-5 ${
            scrolled
              ? 'h-13 border-surface-300 bg-white/95 shadow-2xl shadow-slate-900/10 sm:h-14'
              : 'h-14 border-white/80 bg-white/90 shadow-xl shadow-slate-900/5 sm:h-16'
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

          <div className="hidden items-center justify-end gap-2 lg:flex xl:gap-3">
            <Link
              to="/vendor/login"
              className="rounded-xl px-3 py-2 text-sm font-black text-slate-700 transition-all duration-300 hover:bg-slate-100 hover:text-primary-700 xl:px-4"
            >
              Login
            </Link>
            <Link
              to="/vendor/register"
              className="group inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-black text-white shadow-lg shadow-primary-900/20 transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary-700 hover:shadow-primary-900/30 xl:px-5"
            >
              Start Free
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setOpen(true)}
            className="ml-auto flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-800 transition-all duration-300 hover:scale-105 hover:border-primary-200 hover:text-primary-700 active:scale-95 sm:h-10 sm:w-10 lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        </nav>
      </motion.header>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[60] bg-slate-950/55 backdrop-blur-sm lg:hidden"
            onClick={close}
          >
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="ml-auto flex h-full w-[min(86vw,360px)] flex-col bg-white shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4 sm:px-5">
                <BrandLogo onClick={close} />
                <button
                  type="button"
                  onClick={close}
                  className="flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200 hover:rotate-90 hover:bg-slate-100"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <motion.div
                initial="hidden"
                animate="show"
                variants={{
                  hidden: { opacity: 0 },
                  show: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
                }}
                className="grid gap-1.5 overflow-y-auto p-4 sm:p-5"
              >
                {navItems.map((item) => (
                  <motion.a
                    key={item.label}
                    variants={{
                      hidden: { opacity: 0, x: 20 },
                      show: { opacity: 1, x: 0, transition: { duration: 0.35 } },
                    }}
                    href={item.href}
                    onClick={(event) => {
                      handleSectionNav(event, item.href)
                      close()
                    }}
                    className={`rounded-xl px-4 py-3 text-base font-black transition-all duration-200 ${
                      activeSection === item.href
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-slate-800 hover:bg-slate-100 hover:text-primary-700'
                    }`}
                  >
                    {item.label}
                  </motion.a>
                ))}
              </motion.div>

              <div className="mt-auto grid gap-3 border-t border-slate-200 p-4 sm:p-5">
                <Link
                  to="/vendor/register"
                  onClick={close}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-5 py-3 text-center text-sm font-black text-white shadow-lg shadow-primary-900/20 transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary-700"
                >
                  Register Vendor
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/vendor/login"
                  onClick={close}
                  className="rounded-xl border border-slate-200 px-5 py-3 text-center text-sm font-black text-slate-700 transition-all duration-300 hover:border-primary-200 hover:bg-slate-50 hover:text-primary-700"
                >
                  Vendor Login
                </Link>
              </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default LandingNavbar
