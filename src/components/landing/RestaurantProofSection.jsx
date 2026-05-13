import React, { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { featuredRestaurants, landingStats } from './landingDefaults'
import api from '../../services/api'

const AnimatedCounter = ({ target, suffix = '' }) => {
  const [value, setValue] = useState(0)

  useEffect(() => {
    let frameId
    const duration = 1800
    const start = performance.now()

    const update = (now) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.floor(target * eased))
      if (progress < 1) {
        frameId = requestAnimationFrame(update)
      }
    }

    frameId = requestAnimationFrame(update)
    return () => cancelAnimationFrame(frameId)
  }, [target])

  return <>{value.toLocaleString()}{suffix}</>
}

const RestaurantProofSection = () => {
  const [restaurants, setRestaurants] = useState(featuredRestaurants)

  useEffect(() => {
    const fetchTrustedRestaurants = async () => {
      try {
        const res = await api.get('/customer/landing/stats', { skipErrorToast: true })
        const rows = res?.data?.data?.restaurants
        if (!Array.isArray(rows) || !rows.length) return

        const normalized = rows.map((item) => ({
          name: item.name,
          code: item.code,
          logo: item.logo || '',
        }))
        setRestaurants(normalized)
      } catch (error) {
        // Keep default trusted restaurants.
      }
    }

    fetchTrustedRestaurants()
  }, [])

  const marqueeItems = useMemo(() => [...restaurants, ...restaurants], [restaurants])

  return (
    <section className="py-14 sm:py-18 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-2xl border border-surface-200 bg-gradient-to-br from-white via-surface-50/70 to-secondary-50/35 p-5 shadow-xl backdrop-blur sm:rounded-3xl sm:p-8 lg:p-10"
        >
          <div className="text-center">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-primary-700 sm:text-sm sm:tracking-[0.24em]">
              Trust / Stats Section
            </p>
            <h2 className="mt-3 text-2xl font-black leading-tight tracking-tight text-slate-950 sm:text-3xl md:text-4xl lg:text-5xl">
              Restaurants Across Nepal Are Moving to Digital Ordering
            </h2>
            <p className="mx-auto mt-3 max-w-3xl text-sm leading-7 text-slate-600 sm:mt-4 sm:text-base">
              Restaurants are using QR Restro Nepal daily to simplify operations, reduce waiting time, and improve customer satisfaction.
            </p>
            <motion.span
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: 0.3 }}
              className="mt-4 inline-flex items-center rounded-full border border-primary-200 bg-white px-3 py-1.5 text-[11px] font-black uppercase tracking-wide text-primary-700 shadow-sm sm:mt-5 sm:px-4 sm:py-2 sm:text-xs"
            >
              Growing Every Week
            </motion.span>
          </div>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-60px' }}
            variants={{
              hidden: { opacity: 0 },
              show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
            }}
            className="mt-8 grid gap-3 sm:mt-10 sm:gap-4 sm:grid-cols-3"
          >
            {landingStats.map((stat) => (
              <motion.div
                key={stat.label}
                variants={{
                  hidden: { opacity: 0, y: 16 },
                  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
                }}
                whileHover={{ y: -5 }}
                className="group relative overflow-hidden rounded-2xl border border-surface-200 bg-white p-4 text-center shadow-sm transition-all duration-300 hover:shadow-lg sm:p-5"
              >
                <div className="absolute right-0 top-0 h-20 w-20 -translate-y-8 translate-x-8 rounded-full bg-primary-100/60 blur-2xl transition-all duration-500 group-hover:scale-150" />
                <p className="relative text-2xl font-black text-primary-700 sm:text-3xl md:text-4xl">
                  <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                </p>
                <p className="relative mt-1.5 text-xs font-bold uppercase tracking-wide text-slate-600 sm:mt-2 sm:text-sm">
                  {stat.label}
                </p>
              </motion.div>
            ))}
          </motion.div>

          <div className="mt-8 overflow-hidden rounded-2xl border border-surface-200 bg-white shadow-sm landing-logo-marquee-track sm:mt-10">
            <div className="border-b border-surface-200 bg-surface-50/70 px-3 py-2.5 sm:px-4 sm:py-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-600 sm:text-xs sm:tracking-[0.2em]">
                  Trusted By
                </p>
                <p className="text-[9px] font-bold uppercase tracking-wide text-slate-500 sm:text-[10px]">
                  Hover to pause
                </p>
              </div>
            </div>
            <div className="landing-logo-marquee flex items-center gap-3 px-3 py-3 sm:gap-6 sm:px-4 sm:py-4">
              {marqueeItems.map((restaurant, index) => (
                <div
                  key={`${restaurant.name}-${index}`}
                  className="inline-flex min-w-max items-center gap-2.5 rounded-xl border border-surface-200 bg-surface-50 px-3 py-2 transition-all duration-300 hover:border-primary-200 hover:bg-white hover:shadow-md sm:gap-3 sm:px-4 sm:py-2.5"
                >
                  {restaurant.logo ? (
                    <img src={restaurant.logo} alt={restaurant.name} className="h-8 w-8 rounded-lg object-cover sm:h-9 sm:w-9" loading="lazy" />
                  ) : (
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-[10px] font-black text-white sm:h-9 sm:w-9 sm:text-xs">
                      {restaurant.code}
                    </span>
                  )}
                  <span className="text-xs font-bold text-slate-700 sm:text-sm">{restaurant.name}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default RestaurantProofSection
