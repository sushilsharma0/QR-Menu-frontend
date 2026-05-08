import React from 'react'
import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform } from 'framer-motion'
import { ArrowRight, BadgePercent, Gift, Sparkles } from 'lucide-react'

const OfferBanner = ({ offer }) => {
  const { scrollYProgress } = useScroll()
  const scale = useTransform(scrollYProgress, [0, 0.18, 0.34], [0.96, 1.03, 1])

  return (
    <section className="relative px-4 pb-16 sm:px-6 lg:px-8">
      <motion.div
        style={{ scale }}
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.7 }}
        className="mx-auto grid max-w-7xl overflow-hidden rounded-[2rem] border border-primary-200/30 bg-gradient-to-br from-primary-900 via-secondary-700 to-slate-950 shadow-2xl shadow-primary-900/25 lg:grid-cols-[1.02fr_0.98fr]"
      >
        <div className="relative z-10 flex flex-col justify-center p-6 text-white sm:p-10 lg:p-12">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-black text-attention-200 backdrop-blur">
            <BadgePercent className="h-4 w-4" />
            {offer.eyebrow}
          </div>
          <h2 className="mt-5 text-3xl font-black leading-tight tracking-tight sm:text-5xl">{offer.title}</h2>
          <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300">{offer.description}</p>
          <div className="mt-5 grid gap-2 text-sm font-semibold text-slate-200 sm:grid-cols-2">
            {[
              'Free restaurant onboarding',
              'QR menu setup included',
              'Dashboard access included',
              'No hidden setup charges',
            ].map((item) => (
              <p key={item} className="inline-flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-attention-300" />
                {item}
              </p>
            ))}
          </div>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link to="/vendor/register" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-accent-500 px-6 py-4 text-sm font-black text-white shadow-lg shadow-accent-900/20 transition hover:-translate-y-0.5 hover:bg-accent-600">
              {offer.ctaLabel}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/vendor/login" className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/10 px-6 py-4 text-sm font-black text-white backdrop-blur transition hover:-translate-y-0.5">
              Already Registered? Login
            </Link>
          </div>
        </div>

        <div className="relative min-h-[320px] overflow-hidden">
          <img src={offer.image} alt={offer.title} className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/45 to-transparent lg:from-slate-950/30" />
          <motion.div
            animate={{ rotate: [0, -4, 4, 0], y: [0, -10, 0] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute bottom-6 left-6 right-6 rounded-2xl border border-white/20 bg-white/90 p-5 shadow-2xl backdrop-blur sm:left-auto sm:w-72"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary-100 text-secondary-700">
                <Gift className="h-6 w-6" />
              </span>
              <div>
                <p className="text-2xl font-black text-slate-950">1 Month Free</p>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">First 10 restaurants</p>
              </div>
            </div>
          </motion.div>
          <motion.div
            animate={{ scale: [1, 1.15, 1], opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute right-8 top-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-300 text-slate-950 shadow-xl"
          >
            <Sparkles className="h-6 w-6" />
          </motion.div>
        </div>
      </motion.div>
    </section>
  )
}

export default OfferBanner
