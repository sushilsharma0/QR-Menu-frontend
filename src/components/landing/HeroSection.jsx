import React from 'react'
import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform } from 'framer-motion'
import { ArrowRight, BellRing, BookOpenText, CheckCircle2, Clock3, QrCode, ReceiptText, Sparkles, UtensilsCrossed } from 'lucide-react'

const floatingFeatures = [
  { icon: QrCode, title: 'Scan QR', text: 'Open menu' },
  { icon: UtensilsCrossed, title: 'Choose food', text: 'Add to cart' },
  { icon: BellRing, title: 'Live order', text: 'Kitchen alert' },
  { icon: ReceiptText, title: 'Bill ready', text: 'Cashier sync' },
]

const qrBlocks = Array.from({ length: 49 }, (_, index) => index)

const HeroSection = ({ hero }) => {
  const { scrollYProgress } = useScroll()
  const phoneScale = useTransform(scrollYProgress, [0, 0.18, 0.36], [1, 1.08, 0.96])
  const cardScale = useTransform(scrollYProgress, [0, 0.22, 0.42], [0.96, 1.04, 0.98])

  return (
    <section id="home" className="relative px-4 pt-28 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-7rem)] max-w-7xl items-center gap-12 py-12 lg:grid-cols-[1.02fr_0.98fr]">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="text-center lg:text-left">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/90 px-4 py-2 text-sm font-black text-emerald-700 shadow-sm backdrop-blur">
            <Sparkles className="h-4 w-4" />
            {hero.eyebrow}
          </div>
          <h1 className="mt-7 text-4xl font-black leading-[1.02] tracking-tight text-slate-950 sm:text-6xl lg:text-7xl">
            {hero.title}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg lg:mx-0">
            {hero.description}
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
            <Link to="/vendor/register" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-7 py-4 text-sm font-black text-white shadow-2xl shadow-slate-900/20 transition hover:-translate-y-0.5">
              Start Restaurant Setup
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a href="#blog" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-7 py-4 text-sm font-black text-slate-800 shadow-sm transition hover:-translate-y-0.5">
              Learn From Blog
              <BookOpenText className="h-4 w-4" />
            </a>
          </div>
          <div className="mt-8 grid gap-3 text-left sm:grid-cols-3">
            {['QR menu', 'Live kitchen', 'Admin CMS'].map((item) => (
              <div key={item} className="flex items-center gap-2 rounded-xl border border-white/80 bg-white/75 px-3 py-3 text-sm font-black text-slate-700 shadow-sm backdrop-blur">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                {item}
              </div>
            ))}
          </div>
        </motion.div>

        <div className="relative mx-auto h-[650px] w-full max-w-[590px]">
          <motion.div style={{ scale: phoneScale, x: '-50%' }} className="absolute left-1/2 top-12 z-10 w-[255px] sm:w-[300px]">
            <div className="rounded-[2.4rem] border-[10px] border-slate-950 bg-slate-950 shadow-2xl shadow-slate-900/25">
              <div className="overflow-hidden rounded-[1.8rem] bg-[#f8fbf8]">
                <div className="h-8 bg-slate-950" />
                <div className="p-4">
                  <div className="rounded-2xl bg-white p-3 shadow-sm">
                    <img src={hero.image} alt="Restaurant menu preview" className="h-28 w-full rounded-xl object-cover" />
                    <p className="mt-3 text-xs font-black uppercase tracking-[0.2em] text-emerald-700">Table 07</p>
                    <h2 className="mt-1 text-xl font-black text-slate-950">Today's Menu</h2>
                  </div>
                  <div className="mt-4 grid gap-3">
                    {['Chicken momo', 'Newari khaja set', 'Masala tea'].map((item, index) => (
                      <div key={item} className="flex items-center justify-between rounded-xl bg-white px-3 py-3 shadow-sm">
                        <div>
                          <p className="text-sm font-black text-slate-900">{item}</p>
                          <p className="text-xs font-bold text-slate-500">{index === 0 ? 'Popular' : 'Ready in 12 min'}</p>
                        </div>
                        <span className="rounded-lg bg-emerald-100 px-2 py-1 text-xs font-black text-emerald-700">Add</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 rounded-2xl bg-slate-950 p-3 text-white">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-300">Order total</span>
                      <span className="text-sm font-black">Rs. 1,240</span>
                    </div>
                    <div className="mt-3 rounded-xl bg-emerald-500 py-2 text-center text-xs font-black text-slate-950">Send to kitchen</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            style={{ scale: cardScale, x: '-50%' }}
            animate={{ y: [0, -12, 0] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute left-1/2 top-[455px] z-20 w-[210px] rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl sm:left-[74%] sm:top-[410px]"
          >
            <div className="relative mx-auto grid h-28 w-28 grid-cols-7 gap-1 overflow-hidden rounded-xl bg-white p-2">
              {qrBlocks.map((block) => (
                <span key={block} className={(block % 5 === 0 || block % 7 === 0 || [1, 2, 6, 8, 16, 24, 32, 40, 46].includes(block)) ? 'rounded-sm bg-slate-950' : 'rounded-sm bg-slate-100'} />
              ))}
              <motion.span
                animate={{ y: [0, 88, 0] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute left-2 right-2 top-2 h-1 rounded-full bg-emerald-400 shadow-lg shadow-emerald-500/50"
              />
            </div>
            <div className="mt-3 flex items-center justify-center gap-2 text-xs font-black text-slate-700">
              <Clock3 className="h-4 w-4 text-emerald-600" />
              QR scanning now
            </div>
          </motion.div>

          {floatingFeatures.map((feature, index) => {
            const Icon = feature.icon
            const positions = [
              'left-0 top-7',
              'right-0 top-20',
              'left-3 bottom-24',
              'right-1 bottom-8',
            ]
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, scale: 0.86, y: 24 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                animate={{ y: [0, index % 2 === 0 ? -10 : 10, 0] }}
                transition={{ duration: 4 + index * 0.25, repeat: Infinity, ease: 'easeInOut', delay: index * 0.08 }}
                className={`absolute z-20 hidden w-40 rounded-2xl border border-white/80 bg-white/90 p-4 shadow-xl shadow-slate-900/10 backdrop-blur sm:block ${positions[index]}`}
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-white">
                  <Icon className="h-5 w-5" />
                </span>
                <p className="mt-3 text-sm font-black text-slate-950">{feature.title}</p>
                <p className="text-xs font-bold text-slate-500">{feature.text}</p>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default HeroSection
