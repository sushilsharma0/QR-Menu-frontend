import React from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { ArrowRight, BadgePercent, Gift, Sparkles } from 'lucide-react'

const DEFAULT_BULLETS = [
  'Free restaurant onboarding',
  'QR menu setup included',
  'Dashboard access included',
  'No hidden setup charges',
]

const OfferBanner = ({ offer }) => {
  const reduceMotion = useReducedMotion()
  const { scrollYProgress } = useScroll()
  const scale = useTransform(scrollYProgress, [0, 0.18, 0.34], [0.96, 1.02, 1])
  const bullets = offer.bullets?.length ? offer.bullets : DEFAULT_BULLETS

  return (
    <section className="relative px-4 pb-12 sm:px-6 sm:pb-16 lg:px-8">
      <motion.div
        style={reduceMotion ? undefined : { scale }}
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto grid max-w-[92rem] overflow-hidden rounded-3xl border border-primary-200/30 bg-gradient-to-br from-primary-900 via-secondary-700 to-slate-950 shadow-2xl shadow-primary-900/25 sm:rounded-[2rem] lg:grid-cols-[1.02fr_0.98fr]"
      >
        <div className="relative z-10 flex flex-col justify-center p-5 text-white sm:p-8 md:p-10 lg:p-12">
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-black text-attention-200 backdrop-blur sm:px-4 sm:py-2 sm:text-sm"
          >
            <BadgePercent className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            {offer.eyebrow}
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, delay: 0.18 }}
            className="mt-4 text-2xl font-black leading-tight tracking-tight sm:mt-5 sm:text-4xl md:text-5xl"
          >
            {offer.title}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, delay: 0.26 }}
            className="mt-3 max-w-2xl text-sm leading-7 text-slate-300 sm:mt-5 sm:text-base sm:leading-8"
          >
            {offer.description}
          </motion.p>

          <div className="mt-5 grid gap-2 text-xs font-semibold text-slate-200 sm:text-sm md:grid-cols-2">
            {bullets.map((item, idx) => (
              <motion.p
                key={`${item}-${idx}`}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.3 + idx * 0.08 }}
                className="inline-flex items-center gap-2"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-attention-300" />
                {item}
              </motion.p>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.55 }}
            className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row"
          >
            <Link
              to="/vendor/register"
              className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-accent-500 px-5 py-3.5 text-sm font-black text-white shadow-lg shadow-accent-900/20 transition-all duration-300 hover:-translate-y-0.5 hover:bg-accent-600 hover:shadow-accent-900/40 sm:px-6 sm:py-4"
            >
              {offer.ctaLabel}
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
            <Link
              to="/vendor/login"
              className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/10 px-5 py-3.5 text-sm font-black text-white backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/20 sm:px-6 sm:py-4"
            >
              Already registered? Login
            </Link>
          </motion.div>
        </div>

        <div className="relative min-h-[260px] overflow-hidden sm:min-h-[320px] lg:min-h-0">
          <img
            src={offer.image}
            alt={offer.title}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/55 to-transparent lg:bg-gradient-to-r lg:from-slate-950 lg:via-slate-950/45 lg:to-transparent" />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            animate={reduceMotion ? undefined : { rotate: [0, -3, 3, 0], y: [0, -8, 0] }}
            className="absolute bottom-4 left-4 right-4 rounded-2xl border border-white/20 bg-white/95 p-4 shadow-2xl backdrop-blur sm:bottom-6 sm:left-6 sm:right-6 sm:p-5 lg:left-auto lg:w-72"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary-100 text-secondary-700 sm:h-12 sm:w-12">
                <Gift className="h-5 w-5 sm:h-6 sm:w-6" />
              </span>
              <div>
                <p className="text-xl font-black text-slate-950 sm:text-2xl">{offer.badgeTitle || '1 Month Free'}</p>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 sm:text-xs">
                  {offer.badgeSubtitle || 'Launch offer'}
                </p>
              </div>
            </div>
          </motion.div>
          <motion.div
            animate={reduceMotion ? undefined : { scale: [1, 1.15, 1], opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute right-5 top-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-300 text-slate-950 shadow-xl sm:right-8 sm:top-8 sm:h-14 sm:w-14"
          >
            <Sparkles className="h-5 w-5 sm:h-6 sm:w-6" />
          </motion.div>
        </div>
      </motion.div>
    </section>
  )
}

export default OfferBanner
