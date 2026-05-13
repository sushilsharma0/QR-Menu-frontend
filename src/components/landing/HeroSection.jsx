import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion'
import { ArrowRight, BellRing, BookOpenText, CheckCircle2, Clock3, QrCode, Sparkles, UtensilsCrossed } from 'lucide-react'
import { useLandingBranding } from '../../context/LandingBrandingContext'

function HeroCta({ href, className, children }) {
  const h = href || '#'
  if (h.startsWith('http') || h.startsWith('mailto:') || h.startsWith('tel:') || h.startsWith('#')) {
    return (
      <a href={h} className={className}>
        {children}
      </a>
    )
  }
  return (
    <Link to={h} className={className}>
      {children}
    </Link>
  )
}

const floatingFeatures = [
  { icon: QrCode, title: 'Scan QR', text: 'Open menu' },
  { icon: UtensilsCrossed, title: 'Choose food', text: 'Add to cart' },
  { icon: BellRing, title: 'Live order', text: 'Kitchen alert' },
]

const qrBlocks = Array.from({ length: 49 }, (_, index) => index)

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.05 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
}

const HeroSection = ({ hero }) => {
  const { themeTokens } = useLandingBranding()
  const reduceMotion = useReducedMotion()
  const { scrollYProgress } = useScroll()
  const phoneScale = useTransform(scrollYProgress, [0, 0.18, 0.36], [1, 1.05, 0.97])
  const cardScale = useTransform(scrollYProgress, [0, 0.22, 0.42], [0.96, 1.03, 0.98])
  const [typeText, setTypeText] = useState('')
  const [phraseIndex, setPhraseIndex] = useState(0)
  const [deleting, setDeleting] = useState(false)
  const typewriterPhrases = hero?.typewriterPhrases?.length
    ? hero.typewriterPhrases
    : ['QR scanning live', 'Kitchen synced', 'Cashier ready']

  useEffect(() => {
    setTypeText('')
    setPhraseIndex(0)
    setDeleting(false)
  }, [typewriterPhrases.join('|')])

  useEffect(() => {
    const current = typewriterPhrases[phraseIndex]
    let timeout

    if (!deleting && typeText.length < current.length) {
      timeout = setTimeout(() => setTypeText(current.slice(0, typeText.length + 1)), 85)
    } else if (!deleting && typeText.length === current.length) {
      timeout = setTimeout(() => setDeleting(true), 1100)
    } else if (deleting && typeText.length > 0) {
      timeout = setTimeout(() => setTypeText((prev) => prev.slice(0, -1)), 40)
    } else if (deleting && typeText.length === 0) {
      setDeleting(false)
      setPhraseIndex((prev) => (prev + 1) % typewriterPhrases.length)
    }

    return () => clearTimeout(timeout)
  }, [typeText, deleting, phraseIndex])

  return (
    <section id="home" className="relative px-4 pb-12 pt-24 sm:px-6 sm:pb-16 sm:pt-28 lg:px-8">
      <div className="mx-auto grid max-w-7xl items-center gap-10 py-6 sm:gap-12 sm:py-12 lg:min-h-[calc(100vh-7rem)] lg:grid-cols-[1.02fr_0.98fr]">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="text-center lg:text-left"
        >
          <motion.div
            variants={itemVariants}
            className={`inline-flex items-center gap-2 rounded-full border border-primary-200 bg-white/90 px-3 py-1.5 text-[11px] font-black shadow-sm backdrop-blur sm:px-4 sm:py-2 sm:text-sm ${themeTokens.accentText}`}
          >
            <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="line-clamp-1">{hero.eyebrow}</span>
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="mt-5 text-[2rem] font-black leading-[1.08] tracking-tight text-slate-950 xs:text-[2.25rem] sm:mt-7 sm:text-5xl md:text-6xl lg:text-7xl"
          >
            {hero.title}
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:mt-6 sm:text-base sm:leading-8 md:text-lg lg:mx-0"
          >
            {hero.description}
          </motion.p>

          <motion.p
            variants={itemVariants}
            className="mx-auto mt-2 max-w-2xl text-xs leading-6 text-slate-500 sm:mt-3 sm:text-sm sm:leading-7 md:text-base lg:mx-0"
          >
            {hero.subDescription}
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="mt-6 flex flex-col justify-center gap-3 sm:mt-8 sm:flex-row lg:justify-start"
          >
            <HeroCta
              href={hero.primaryCta?.href}
              className={`group inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-black text-white shadow-2xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-primary-900/30 sm:px-7 sm:py-4 ${themeTokens.primaryButton}`}
            >
              {hero.primaryCta?.text}
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </HeroCta>
            <HeroCta
              href={hero.secondaryCta?.href}
              className="group inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-black text-slate-800 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-md sm:px-7 sm:py-4"
            >
              {hero.secondaryCta?.text}
              <BookOpenText className="h-4 w-4 transition-transform duration-300 group-hover:rotate-6" />
            </HeroCta>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="mt-6 grid gap-2 text-left sm:mt-8 sm:grid-cols-2 sm:gap-3 lg:grid-cols-2 xl:grid-cols-4"
          >
            {(hero.bullets || []).map((item, idx) => (
              <motion.div
                key={item}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.5 + idx * 0.08 }}
                className="flex items-center gap-2 rounded-xl border border-white/80 bg-white/75 px-3 py-2.5 text-xs font-black text-slate-700 shadow-sm backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:bg-white hover:shadow-md sm:py-3 sm:text-sm"
              >
                <CheckCircle2 className={`h-4 w-4 shrink-0 ${themeTokens.ringAccent}`} />
                <span className="line-clamp-2">{item}</span>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        <div className="relative mx-auto mt-2 h-[560px] w-full max-w-[420px] sm:h-[640px] sm:max-w-[520px] md:h-[680px] lg:mt-0 lg:max-w-[590px]">
          <motion.div
            style={reduceMotion ? undefined : { scale: phoneScale, x: '-50%' }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="absolute left-1/2 top-2 z-10 w-[min(78vw,260px)] sm:top-8 sm:w-[280px] md:top-12 md:w-[300px]"
          >
            <div className="relative rounded-[2.2rem] border-[8px] border-slate-950 bg-slate-950 shadow-2xl shadow-slate-900/30 sm:rounded-[2.7rem] sm:border-[10px]">
              <span className="absolute -left-[11px] top-20 hidden h-9 w-1 rounded-full bg-slate-800 sm:-left-[13px] sm:top-24 sm:block sm:h-10" />
              <span className="absolute -left-[11px] top-32 hidden h-14 w-1 rounded-full bg-slate-800 sm:-left-[13px] sm:top-40 sm:block sm:h-16" />
              <span className="absolute -right-[11px] top-28 hidden h-14 w-1 rounded-full bg-slate-800 sm:-right-[13px] sm:top-32 sm:block sm:h-16" />
              <div className="overflow-hidden rounded-[1.5rem] bg-[#f8fbf8] sm:rounded-[1.8rem]">
                <div className="relative h-7 bg-slate-950 sm:h-9">
                  <span className="absolute left-1/2 top-1 h-4 w-20 -translate-x-1/2 rounded-full bg-black/95 sm:top-1.5 sm:h-5 sm:w-24" />
                </div>
                <div className="p-3 sm:p-4">
                  <div className="rounded-xl bg-white p-2.5 shadow-sm sm:rounded-2xl sm:p-3">
                    <img
                      src={hero.image}
                      alt="Restaurant menu preview"
                      loading="lazy"
                      className="h-24 w-full rounded-lg object-cover sm:h-28 sm:rounded-xl"
                    />
                    <p className={`mt-2 text-[10px] font-black uppercase tracking-[0.2em] sm:mt-3 sm:text-xs ${themeTokens.accentText}`}>
                      Table 07
                    </p>
                    <h2 className="mt-0.5 text-base font-black text-slate-950 sm:mt-1 sm:text-xl">
                      Today's Popular Items
                    </h2>
                  </div>
                  <div className="mt-3 grid gap-2 sm:mt-4 sm:gap-3">
                    {['Chicken momo', 'Newari khaja set', 'Masala tea'].map((item, index) => (
                      <motion.div
                        key={item}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: 0.6 + index * 0.12 }}
                        className="flex items-center justify-between rounded-lg bg-white px-2.5 py-2 shadow-sm sm:rounded-xl sm:px-3 sm:py-3"
                      >
                        <div>
                          <p className="text-xs font-black text-slate-900 sm:text-sm">{item}</p>
                          <p className="text-[10px] font-bold text-slate-500 sm:text-xs">
                            {index === 0 ? 'Most ordered today' : index === 1 ? 'Ready in 12 mins' : 'Freshly prepared'}
                          </p>
                        </div>
                        <span className="rounded-md bg-secondary-100 px-1.5 py-0.5 text-[9px] font-black text-secondary-700 sm:rounded-lg sm:px-2 sm:py-1 sm:text-xs">
                          Add
                        </span>
                      </motion.div>
                    ))}
                  </div>
                  <div className="mt-3 rounded-xl bg-slate-950 p-2.5 text-white sm:mt-4 sm:rounded-2xl sm:p-3">
                    <div className="text-[9px] font-black uppercase tracking-wide text-slate-300 sm:text-xs">
                      Order Summary
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-300 sm:text-xs">Total:</span>
                      <span className="text-xs font-black sm:text-sm">Rs. 1,240</span>
                    </div>
                    <div className={`mt-2 rounded-lg py-1.5 text-center text-[10px] font-black text-white sm:mt-3 sm:rounded-xl sm:py-2 sm:text-xs ${themeTokens.summaryBar}`}>
                      Send Order to Kitchen
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            style={reduceMotion ? undefined : { scale: cardScale, x: '-50%' }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="absolute bottom-2 left-1/2 z-20 w-[180px] rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl sm:bottom-auto sm:left-[74%] sm:top-[420px] sm:w-[210px] sm:p-4 md:top-[440px]"
          >
            <motion.div
              animate={reduceMotion ? undefined : { y: [0, -8, 0] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
              className="relative mx-auto grid h-20 w-20 grid-cols-7 gap-0.5 overflow-hidden rounded-lg bg-white p-1.5 sm:h-28 sm:w-28 sm:gap-1 sm:rounded-xl sm:p-2"
            >
              {qrBlocks.map((block) => (
                <span
                  key={block}
                  className={
                    block % 5 === 0 || block % 7 === 0 || [1, 2, 6, 8, 16, 24, 32, 40, 46].includes(block)
                      ? 'rounded-sm bg-slate-950'
                      : 'rounded-sm bg-slate-100'
                  }
                />
              ))}
              <motion.span
                animate={reduceMotion ? undefined : { y: [0, 60, 0] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                className={`absolute left-1.5 right-1.5 top-1.5 h-0.5 rounded-full opacity-90 shadow-lg sm:left-2 sm:right-2 sm:top-2 sm:h-1 ${themeTokens.ringAccent.replace('text-', 'bg-')}`}
              />
            </motion.div>
            <div className="mt-2 flex items-center justify-center gap-2 text-[10px] font-black text-slate-700 sm:mt-3 sm:text-xs">
              <Clock3 className="h-3.5 w-3.5 text-primary-600 sm:h-4 sm:w-4" />
              <span className="min-w-[88px] text-left sm:min-w-[112px]">
                {typeText}
                <span className="ml-0.5 inline-block h-3 w-[1.5px] animate-pulse bg-primary-600 align-middle sm:h-3.5" />
              </span>
            </div>
          </motion.div>

          {floatingFeatures.map((feature, index) => {
            const Icon = feature.icon
            const positions = [
              'left-0 top-7',
              'right-0 top-20',
              'left-3 bottom-24',
            ]
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, scale: 0.86, y: 24 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                animate={reduceMotion ? undefined : { y: [0, index % 2 === 0 ? -10 : 10, 0] }}
                transition={{ duration: 4 + index * 0.25, repeat: Infinity, ease: 'easeInOut', delay: index * 0.08 }}
                className={`absolute z-20 hidden w-40 rounded-2xl border border-white/80 bg-white/90 p-4 shadow-xl shadow-slate-900/10 backdrop-blur lg:block ${positions[index]}`}
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
