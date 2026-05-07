import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  BellRing,
  BookOpenText,
  ChefHat,
  ClipboardList,
  CreditCard,
  LayoutDashboard,
  Menu,
  QrCode,
  ShieldCheck,
  Sparkles,
  Store,
  TabletSmartphone,
  TicketCheck,
  Users,
  X,
} from 'lucide-react'

const navItems = [
  { label: 'Home', href: '#home' },
  { label: 'Software', href: '#software' },
  { label: 'Modules', href: '#modules' },
  { label: 'Workflow', href: '#workflow' },
  { label: 'Blog', to: '/blog' },
]

const modules = [
  { icon: Store, title: 'Vendor portal', text: 'Restaurant profile, KYC, subscription, billing, support tickets, and settings.' },
  { icon: ClipboardList, title: 'Menu builder', text: 'Categories, menu items, images, pricing, tax, availability, and promotions.' },
  { icon: QrCode, title: 'QR table system', text: 'Create tables, print QR codes, and let guests order directly from their seats.' },
  { icon: Users, title: 'Staff roles', text: 'Kitchen, cashier, waiter, and employee workflows separated by secure access.' },
  { icon: BellRing, title: 'Live order flow', text: 'Real-time notifications and order status tracking across every dashboard.' },
  { icon: BarChart3, title: 'Reports', text: 'Dashboard stats, order activity, billing records, and operational visibility.' },
]

const softwareDetails = [
  ['Separate access', 'Vendor, staff, and platform admin login systems are kept cleanly separated.'],
  ['Email verification', 'Vendor registration validates email codes before activating accounts.'],
  ['Google sign-in', 'Restaurant vendors can use Google auth for faster verified access.'],
  ['Platform control', 'Admins handle CMS, blogs, restaurants, KYC, plans, billing, and tickets.'],
]

const workflow = [
  ['01', 'Vendor registers', 'The restaurant owner creates a vendor account, verifies email, and completes profile/KYC.'],
  ['02', 'Menu goes live', 'Vendor adds categories, items, tables, QR codes, staff, and subscription details.'],
  ['03', 'Guests order', 'Customers scan QR, browse the digital menu, and place table orders instantly.'],
  ['04', 'Teams fulfill', 'Kitchen, cashier, waiter, and vendor dashboards stay updated in real time.'],
]

const LandingPage = () => {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  const close = () => setOpen(false)

  return (
    <div id="home" className="min-h-screen overflow-hidden bg-[#f8fbf8] text-slate-950">
      <header className="fixed inset-x-0 top-0 z-50 px-3 py-3 sm:px-5">
        <nav className="mx-auto grid h-16 max-w-7xl grid-cols-[auto_1fr_auto] items-center rounded-2xl border border-white/70 bg-white/90 px-4 shadow-xl shadow-slate-900/5 backdrop-blur-xl lg:px-5">
          <Link to="/" className="flex items-center gap-3" aria-label="QR Menu home">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-white">
              <QrCode className="h-5 w-5" />
            </span>
            <span className="hidden text-lg font-black tracking-tight sm:block">QR Menu</span>
          </Link>

          <div className="hidden justify-center lg:flex">
            <div className="flex items-center gap-1 rounded-full bg-slate-100 p-1">
              {navItems.map((item) => (
                item.to ? (
                  <Link key={item.label} to={item.to} className="rounded-full px-4 py-2 text-sm font-black text-slate-600 transition hover:bg-white hover:text-slate-950 hover:shadow-sm">
                    {item.label}
                  </Link>
                ) : (
                  <a key={item.label} href={item.href} className="rounded-full px-4 py-2 text-sm font-black text-slate-600 transition hover:bg-white hover:text-slate-950 hover:shadow-sm">
                    {item.label}
                  </a>
                )
              ))}
            </div>
          </div>

          <div className="hidden items-center justify-end gap-3 lg:flex">
            <Link to="/vendor/login" className="rounded-xl px-4 py-2 text-sm font-black text-slate-700 transition hover:bg-slate-100">
              Login
            </Link>
            <Link to="/vendor/register" className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-900/20 transition hover:bg-emerald-700">
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
            className="ml-auto h-full w-[min(88vw,390px)] bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex h-16 items-center justify-between border-b border-slate-200 px-5">
              <div className="flex items-center gap-3 font-black">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-white">
                  <QrCode className="h-5 w-5" />
                </span>
                QR Menu
              </div>
              <button type="button" onClick={close} className="flex h-10 w-10 items-center justify-center rounded-xl hover:bg-slate-100" aria-label="Close menu">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid gap-2 p-5">
              {navItems.map((item) => (
                item.to ? (
                  <Link key={item.label} to={item.to} onClick={close} className="rounded-xl px-4 py-3 text-base font-black text-slate-800 hover:bg-slate-100">
                    {item.label}
                  </Link>
                ) : (
                  <a key={item.label} href={item.href} onClick={close} className="rounded-xl px-4 py-3 text-base font-black text-slate-800 hover:bg-slate-100">
                    {item.label}
                  </a>
                )
              ))}
            </div>
            <div className="mt-auto grid gap-3 border-t border-slate-200 p-5">
              <Link to="/vendor/register" onClick={close} className="rounded-xl bg-emerald-600 px-5 py-3 text-center text-sm font-black text-white">
                Register Vendor
              </Link>
              <Link to="/vendor/login" onClick={close} className="rounded-xl border border-slate-200 px-5 py-3 text-center text-sm font-black text-slate-700">
                Vendor Login
              </Link>
            </div>
          </motion.aside>
        </div>
      )}

      <main>
        <section className="relative px-4 pt-28 sm:px-6 lg:px-8">
          <div className="absolute left-1/2 top-16 -z-10 h-[560px] w-[560px] -translate-x-1/2 rounded-full bg-emerald-200/50 blur-3xl" />
          <div className="mx-auto grid min-h-[calc(100vh-7rem)] max-w-7xl items-center gap-12 py-12 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-black text-emerald-700 shadow-sm">
                <Sparkles className="h-4 w-4" />
                Complete SaaS for QR restaurant operations
              </div>
              <h1 className="mt-7 text-4xl font-black leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
                One beautiful platform for digital menus, orders, staff, and vendors.
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg lg:mx-0">
                QR Menu SaaS helps restaurants launch contactless ordering, manage vendor operations, verify accounts, control subscriptions, and run live service from responsive dashboards.
              </p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
                <Link to="/vendor/register" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-7 py-4 text-sm font-black text-white shadow-2xl shadow-slate-900/20 transition hover:-translate-y-0.5">
                  Register Restaurant Vendor
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link to="/blog" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-7 py-4 text-sm font-black text-slate-800 shadow-sm transition hover:-translate-y-0.5">
                  Read Blog
                  <BookOpenText className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="relative">
              <div className="rounded-[2rem] border border-white bg-white p-3 shadow-2xl shadow-slate-900/15">
                <div className="overflow-hidden rounded-[1.5rem] bg-slate-950">
                  <img
                    src="https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&q=80&w=1200"
                    alt="Restaurant using QR ordering"
                    className="h-[360px] w-full object-cover sm:h-[520px]"
                  />
                </div>
              </div>
              <div className="absolute -bottom-6 left-4 right-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl sm:left-8 sm:right-auto sm:w-80">
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                    <TicketCheck className="h-6 w-6" />
                  </span>
                  <div>
                    <p className="text-sm font-black text-slate-950">Order #QR-1048 received</p>
                    <p className="text-xs font-semibold text-slate-500">Kitchen and cashier synced instantly</p>
                  </div>
                </div>
              </div>
              <div className="absolute -right-2 top-8 hidden rounded-2xl bg-slate-950 p-4 text-white shadow-2xl sm:block">
                <p className="text-3xl font-black">98%</p>
                <p className="text-xs font-bold text-slate-300">mobile ready</p>
              </div>
            </div>
          </div>
        </section>

        <section id="software" className="bg-white py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-black uppercase tracking-[0.25em] text-emerald-700">Software Details</p>
              <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">Designed as a real restaurant SaaS platform.</h2>
              <p className="mt-5 text-base leading-8 text-slate-600">
                This is more than a menu page. It separates platform admins, restaurant vendors, staff roles, and customers into the right workflows.
              </p>
            </div>
            <div className="mt-12 grid gap-4 md:grid-cols-2">
              {softwareDetails.map(([title, text]) => (
                <div key={title} className="rounded-2xl border border-slate-200 bg-[#f8fbf8] p-6">
                  <BadgeCheck className="h-6 w-6 text-emerald-600" />
                  <h3 className="mt-4 text-xl font-black">{title}</h3>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="modules" className="py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <div className="max-w-2xl">
                <p className="text-sm font-black uppercase tracking-[0.25em] text-emerald-700">Modules</p>
                <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">Everything restaurants need in one place.</h2>
              </div>
              <Link to="/vendor/register" className="inline-flex w-fit items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white">
                Start setup
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {modules.map((module) => {
                const Icon = module.icon
                return (
                  <motion.div key={module.title} whileHover={{ y: -5 }} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-950 text-white">
                      <Icon className="h-6 w-6" />
                    </span>
                    <h3 className="mt-5 text-xl font-black">{module.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-slate-600">{module.text}</p>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </section>

        <section id="workflow" className="bg-slate-950 py-16 text-white sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-10 lg:grid-cols-[0.75fr_1.25fr]">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.25em] text-emerald-300">Workflow</p>
                <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">From vendor signup to live table orders.</h2>
              </div>
              <div className="grid gap-4">
                {workflow.map(([step, title, text]) => (
                  <div key={step} className="grid gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 sm:grid-cols-[auto_1fr]">
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500 text-lg font-black">{step}</span>
                    <div>
                      <h3 className="text-lg font-black">{title}</h3>
                      <p className="mt-2 text-sm leading-7 text-slate-300">{text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white py-16 sm:py-24">
          <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-3 lg:px-8">
            {[
              { icon: LayoutDashboard, title: 'Platform admin controls blogs', text: 'Blog articles are CMS entries created and published by platform admins.' },
              { icon: CreditCard, title: 'Subscription ready', text: 'Restaurants can request plans, upload proof, and track invoices.' },
              { icon: ShieldCheck, title: 'Secure operations', text: 'JWT auth, role checks, and separate portals protect each workflow.' },
            ].map((item) => {
              const Icon = item.icon
              return (
                <div key={item.title} className="rounded-2xl bg-[#f8fbf8] p-6">
                  <Icon className="h-7 w-7 text-emerald-700" />
                  <h3 className="mt-4 text-xl font-black">{item.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{item.text}</p>
                </div>
              )
            })}
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-[#f8fbf8] py-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-white">
              <QrCode className="h-5 w-5" />
            </span>
            <div>
              <p className="font-black">QR Menu SaaS</p>
              <p className="text-sm text-slate-500">Digital menu and restaurant operations platform.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 text-sm font-black text-slate-600">
            <span className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2"><TabletSmartphone className="h-4 w-4 text-emerald-600" />Responsive</span>
            <span className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2"><ChefHat className="h-4 w-4 text-orange-600" />Restaurant first</span>
            <span className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2"><BookOpenText className="h-4 w-4 text-sky-600" />Admin blog</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage
