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
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-surface-200 bg-gradient-to-br from-white via-surface-50/70 to-secondary-50/35 p-6 shadow-xl backdrop-blur sm:p-10">
          <div className="text-center">
            <p className="text-sm font-black uppercase tracking-[0.24em] text-primary-700">Trust / Stats Section</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">
              Restaurants Across Nepal Are Moving to Digital Ordering
            </h2>
            <p className="mx-auto mt-4 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
              Restaurants are using QR Restro Nepal daily to simplify operations, reduce waiting time, and improve customer satisfaction.
            </p>
            <span className="mt-5 inline-flex items-center rounded-full border border-primary-200 bg-white px-4 py-2 text-xs font-black uppercase tracking-wide text-primary-700 shadow-sm">
              Growing Every Week
            </span>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {landingStats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ delay: index * 0.08, duration: 0.45 }}
                className="group relative overflow-hidden rounded-2xl border border-surface-200 bg-white p-5 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="absolute right-0 top-0 h-20 w-20 -translate-y-8 translate-x-8 rounded-full bg-primary-100/60 blur-2xl" />
                <p className="relative text-3xl font-black text-primary-700 sm:text-4xl">
                  <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                </p>
                <p className="relative mt-2 text-sm font-bold uppercase tracking-wide text-slate-600">{stat.label}</p>
              </motion.div>
            ))}
          </div>

          <div className="mt-10 overflow-hidden rounded-2xl border border-surface-200 bg-white shadow-sm landing-logo-marquee-track">
            <div className="border-b border-surface-200 bg-surface-50/70 px-4 py-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-600">Trusted By</p>
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Hover to pause</p>
              </div>
            </div>
            <div className="landing-logo-marquee flex items-center gap-4 px-4 py-4 sm:gap-6">
              {marqueeItems.map((restaurant, index) => (
                <div
                  key={`${restaurant.name}-${index}`}
                  className="inline-flex min-w-max items-center gap-3 rounded-xl border border-surface-200 bg-surface-50 px-4 py-2.5"
                >
                  {restaurant.logo ? (
                    <img src={restaurant.logo} alt={restaurant.name} className="h-9 w-9 rounded-lg object-cover" loading="lazy" />
                  ) : (
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-600 text-xs font-black text-white">
                      {restaurant.code}
                    </span>
                  )}
                  <span className="text-sm font-bold text-slate-700">{restaurant.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default RestaurantProofSection
