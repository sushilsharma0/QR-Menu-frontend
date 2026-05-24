import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Menu, Sparkles, X } from 'lucide-react'
import BrandLogo from './BrandLogo'
import { navItems } from './landingDefaults'

const NavLink = ({ item, onClick, isActive = false }) => (
  <motion.a
    href={item.href}
    onClick={(event) => onClick(event, item.href)}
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.98 }}
    className={`relative rounded-full px-3 py-2 text-sm font-black transition-all duration-300 xl:px-4 ${
      isActive
        ? 'bg-gradient-to-br from-primary-600 to-primary-700 text-white shadow-lg shadow-primary-600/30'
        : 'text-slate-600 hover:bg-white hover:text-primary-700 hover:shadow-md'
    }`}
  >
    {item.label}
    {isActive && (
      <motion.span
        layoutId="activeNav"
        className="absolute inset-0 -z-10 rounded-full bg-gradient-to-br from-primary-600 to-primary-700"
        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
      />
    )}
  </motion.a>
)

const LandingNavbar = () => {
  const [open, setOpen] = useState(false)
  const [activeSection, setActiveSection] = useState('#home')
  const [scrolled, setScrolled] = useState(false)
  const [isHovering, setIsHovering] = useState(false)

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const sections = navItems.flatMap((item) => {
      const section = document.querySelector(item.href)
      return section ? [section] : []
    })

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
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="fixed inset-x-0 top-0 z-50 px-3 py-3 sm:px-5 sm:py-4"
      >
        <motion.nav
          animate={{
            scale: scrolled ? 0.98 : 1,
          }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          className={`mx-auto grid max-w-[92rem] grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border px-3 backdrop-blur-xl transition-all duration-500 sm:gap-6 sm:px-5 lg:grid-cols-[auto_1fr_auto] lg:gap-8 lg:px-6 ${
            scrolled
              ? 'h-14 border-slate-200/60 bg-white/80 shadow-2xl shadow-slate-900/[0.08] sm:h-16'
              : 'h-16 border-white/60 bg-white/70 shadow-xl shadow-slate-900/5 sm:h-[4.5rem]'
          }`}
        >
          {/* Gradient overlay on hover */}
          <motion.div
            animate={{ opacity: isHovering ? 0.03 : 0 }}
            transition={{ duration: 0.3 }}
            className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-r from-primary-500 via-secondary-500 to-primary-500"
          />

          {/* Logo */}
          <div className="flex min-h-0 min-w-0 items-center">
            <BrandLogo scrolled={scrolled} showSlogan />
          </div>

          {/* Desktop Navigation */}
          <div className="hidden justify-center lg:flex">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="flex items-center gap-1 rounded-full bg-slate-100/80 p-1.5 backdrop-blur-sm"
            >
              {navItems.map((item, index) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + index * 0.05, duration: 0.3 }}
                >
                  <NavLink
                    item={item}
                    onClick={handleSectionNav}
                    isActive={activeSection === item.href}
                  />
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Desktop CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="hidden items-center justify-end gap-2 lg:flex xl:gap-3"
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                to="/vendor/login"
                className="group relative overflow-hidden rounded-xl px-4 py-2.5 text-sm font-black text-slate-700 transition-all duration-300 hover:text-primary-700 xl:px-5"
              >
                <span className="relative z-10">Login</span>
                <motion.div
                  className="absolute inset-0 bg-slate-100"
                  initial={{ scale: 0.95, opacity: 0 }}
                  whileHover={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.2 }}
                />
              </Link>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            >
              <Link
                to="/vendor/register"
                className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-br from-primary-600 to-primary-700 px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-primary-600/30 transition-all duration-300 hover:shadow-xl hover:shadow-primary-600/40 xl:px-6"
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-primary-700 to-primary-800"
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                />
                <Sparkles className="relative z-10 h-4 w-4" />
                <span className="relative z-10">Start Free</span>
                <ArrowRight className="relative z-10 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </motion.div>
          </motion.div>

          {/* Mobile Menu Button */}
          <motion.button
            type="button"
            onClick={() => setOpen(true)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="relative ml-auto flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200/80 bg-white/90 text-slate-800 shadow-md transition-all duration-300 hover:border-primary-300 hover:text-primary-700 hover:shadow-lg active:shadow-sm sm:h-11 sm:w-11 lg:hidden"
            aria-label="Open menu"
          >
            <motion.div
              animate={{ rotate: open ? 90 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <Menu className="h-5 w-5 sm:h-5 sm:w-5" />
            </motion.div>
            
            {/* Pulse effect */}
            <motion.span
              className="absolute inset-0 rounded-xl bg-primary-500/20"
              initial={{ scale: 1, opacity: 0 }}
              animate={{ scale: [1, 1.4, 1], opacity: [0, 0.3, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
          </motion.button>
        </motion.nav>
      </motion.header>

      {/* Mobile Menu */}
      <AnimatePresence mode="wait">
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 z-[60] bg-slate-950/60 backdrop-blur-md lg:hidden"
              onClick={close}
            />

            {/* Mobile Drawer */}
            <motion.aside
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ 
                type: 'spring', 
                damping: 30, 
                stiffness: 300,
                opacity: { duration: 0.2 }
              }}
              className="fixed right-0 top-0 z-[61] flex h-full w-[min(88vw,380px)] flex-col overflow-hidden bg-white shadow-2xl lg:hidden"
              onClick={(event) => event.stopPropagation()}
            >
              {/* Header with gradient */}
              <div className="relative flex h-16 items-center justify-between border-b border-slate-200 bg-gradient-to-br from-slate-50 to-white px-5 sm:h-[4.5rem] sm:px-6">
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <BrandLogo compact onClick={close} />
                </motion.div>

                <motion.button
                  type="button"
                  onClick={close}
                  whileHover={{ rotate: 90, scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-800 transition-all duration-300 hover:bg-slate-200 sm:h-11 sm:w-11"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </motion.button>
              </div>

              {/* Navigation Items */}
              <motion.div
                initial="hidden"
                animate="show"
                variants={{
                  hidden: { opacity: 0 },
                  show: { 
                    opacity: 1, 
                    transition: { 
                      staggerChildren: 0.08, 
                      delayChildren: 0.15 
                    } 
                  },
                }}
                className="flex-1 overflow-y-auto px-4 py-6 sm:px-6"
              >
                <div className="grid gap-2">
                  {navItems.map((item) => (
                    <motion.div
                      key={item.label}
                      variants={{
                        hidden: { opacity: 0, x: 30, y: 10 },
                        show: { 
                          opacity: 1, 
                          x: 0, 
                          y: 0,
                          transition: { 
                            duration: 0.4,
                            ease: [0.22, 1, 0.36, 1]
                          } 
                        },
                      }}
                    >
                      <motion.a
                        href={item.href}
                        onClick={(event) => {
                          handleSectionNav(event, item.href)
                          close()
                        }}
                        whileHover={{ scale: 1.02, x: 5 }}
                        whileTap={{ scale: 0.98 }}
                        className={`group relative block overflow-hidden rounded-xl px-5 py-4 text-base font-black transition-all duration-300 ${
                          activeSection === item.href
                            ? 'bg-gradient-to-br from-primary-600 to-primary-700 text-white shadow-lg shadow-primary-600/30'
                            : 'bg-slate-50 text-slate-800 hover:bg-slate-100 hover:text-primary-700'
                        }`}
                      >
                        <span className="relative z-10 flex items-center justify-between">
                          {item.label}
                          <motion.span
                            initial={{ x: -10, opacity: 0 }}
                            animate={{ 
                              x: activeSection === item.href ? 0 : -10, 
                              opacity: activeSection === item.href ? 1 : 0 
                            }}
                            className="text-white"
                          >
                            <ArrowRight className="h-4 w-4" />
                          </motion.span>
                        </span>

                        {/* Hover gradient effect */}
                        {activeSection !== item.href && (
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-br from-primary-50 to-secondary-50"
                            initial={{ opacity: 0, scale: 0.8 }}
                            whileHover={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.2 }}
                          />
                        )}
                      </motion.a>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* CTA Section */}
              <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.4 }}
                className="border-t border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4 sm:p-6"
              >
                <div className="grid gap-3">
                  <motion.div whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}>
                    <Link
                      to="/vendor/register"
                      onClick={close}
                      className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-br from-primary-600 to-primary-700 px-6 py-4 text-center text-base font-black text-white shadow-lg shadow-primary-600/30 transition-all duration-300 hover:shadow-xl hover:shadow-primary-600/40"
                    >
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-br from-primary-700 to-primary-800"
                        initial={{ opacity: 0 }}
                        whileHover={{ opacity: 1 }}
                        transition={{ duration: 0.2 }}
                      />
                      <Sparkles className="relative z-10 h-4 w-4" />
                      <span className="relative z-10">Register Vendor</span>
                      <ArrowRight className="relative z-10 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </Link>
                  </motion.div>

                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Link
                      to="/vendor/login"
                      onClick={close}
                      className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl border-2 border-slate-200 bg-white px-6 py-4 text-center text-base font-black text-slate-700 transition-all duration-300 hover:border-primary-300 hover:bg-slate-50 hover:text-primary-700"
                    >
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-br from-primary-50 to-secondary-50"
                        initial={{ opacity: 0 }}
                        whileHover={{ opacity: 1 }}
                        transition={{ duration: 0.2 }}
                      />
                      <span className="relative z-10">Vendor Login</span>
                    </Link>
                  </motion.div>
                </div>
              </motion.div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

export default LandingNavbar
