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
    <section id="home" className="relative overflow-hidden px-4 pb-12 pt-16 sm:px-6 sm:pb-16 sm:pt-24 lg:px-8 lg:pt-28">
      <div className="mx-auto grid max-w-7xl items-center gap-8 py-6 sm:gap-10 sm:py-8 lg:min-h-[calc(100vh-7rem)] lg:grid-cols-[1.1fr_0.9fr] lg:gap-12 lg:py-12">
        {/* Left Column - Content */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="relative z-10 text-center lg:text-left"
        >
          {/* Eyebrow Badge */}
          <motion.div
            variants={itemVariants}
            className={`inline-flex items-center gap-2 rounded-full border border-primary-200 bg-white/90 px-3 py-1.5 text-xs font-black shadow-sm backdrop-blur sm:px-4 sm:py-2 sm:text-sm ${themeTokens.accentText}`}
          >
            <Sparkles className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
            <span className="truncate">{hero.eyebrow}</span>
          </motion.div>

          {/* Main Title - Fixed responsive sizing */}
          <motion.h1
            variants={itemVariants}
            className="mt-4 text-3xl font-black leading-[1.1] tracking-tight text-slate-950 sm:mt-6 sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl"
          >
            {hero.title}
          </motion.h1>

          {/* Main Description - Fixed responsive sizing */}
          <motion.p
            variants={itemVariants}
            className="mx-auto mt-3 max-w-2xl text-base leading-relaxed text-slate-600 sm:mt-4 sm:text-lg sm:leading-relaxed lg:mx-0 lg:text-xl"
          >
            {hero.description}
          </motion.p>

          {/* Sub Description - Consistent sizing */}
          <motion.p
            variants={itemVariants}
            className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-slate-500 sm:text-base lg:mx-0"
          >
            {hero.subDescription}
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            variants={itemVariants}
            className="mt-6 flex flex-col justify-center gap-3 sm:mt-8 sm:flex-row lg:justify-start"
          >
            <HeroCta
              href={hero.primaryCta?.href}
              className={`group inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-black text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl sm:rounded-2xl sm:px-7 sm:py-4 sm:text-base ${themeTokens.primaryButton}`}
            >
              {hero.primaryCta?.text}
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1 sm:h-5 sm:w-5" />
            </HeroCta>
            <HeroCta
              href={hero.secondaryCta?.href}
              className="group inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-black text-slate-800 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-md sm:rounded-2xl sm:px-7 sm:py-4 sm:text-base"
            >
              {hero.secondaryCta?.text}
              <BookOpenText className="h-4 w-4 transition-transform duration-300 group-hover:rotate-6 sm:h-5 sm:w-5" />
            </HeroCta>
          </motion.div>

          {/* Feature Bullets - Better responsive grid */}
          <motion.div
            variants={itemVariants}
            className="mt-6 grid grid-cols-1 gap-2 text-left sm:mt-8 sm:grid-cols-2 sm:gap-3 lg:gap-3 xl:grid-cols-4"
          >
            {(hero.bullets || []).map((item, idx) => (
              <motion.div
                key={item}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.5 + idx * 0.08 }}
                className="flex items-start gap-2.5 rounded-xl border border-white/80 bg-white/75 px-3 py-2.5 text-xs font-bold text-slate-700 shadow-sm backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:bg-white hover:shadow-md sm:py-3 sm:text-sm"
              >
                <CheckCircle2 className={`mt-0.5 h-4 w-4 shrink-0 sm:h-5 sm:w-5 ${themeTokens.ringAccent}`} />
                <span className="line-clamp-2 leading-snug">{item}</span>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Right Column - Phone Mockup */}
        <div className="relative mx-auto mt-8 h-[480px] w-full max-w-[380px] sm:h-[560px] sm:max-w-[460px] lg:mt-0 lg:h-[640px] lg:max-w-[540px]">
          {/* Main Phone */}
          <motion.div
            style={reduceMotion ? undefined : { scale: phoneScale, x: '-50%' }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="absolute left-1/2 top-0 z-10 w-[240px] sm:top-4 sm:w-[260px] lg:top-8 lg:w-[290px]"
          >
            <div className="relative rounded-[2rem] border-[7px] border-slate-950 bg-slate-950 shadow-2xl shadow-slate-900/30 sm:rounded-[2.5rem] sm:border-[9px]">
              {/* Phone Buttons */}
              <span className="absolute -left-[9px] top-16 h-8 w-1 rounded-full bg-slate-800 sm:-left-[11px] sm:top-20 sm:h-10" />
              <span className="absolute -left-[9px] top-28 h-12 w-1 rounded-full bg-slate-800 sm:-left-[11px] sm:top-32 sm:h-14" />
              <span className="absolute -right-[9px] top-24 h-12 w-1 rounded-full bg-slate-800 sm:-right-[11px] sm:top-28 sm:h-14" />
              
              {/* Phone Screen */}
              <div className="overflow-hidden rounded-[1.4rem] bg-[#f8fbf8] sm:rounded-[1.7rem]">
                {/* Notch */}
                <div className="relative h-6 bg-slate-950 sm:h-8">
                  <span className="absolute left-1/2 top-0.5 h-4 w-20 -translate-x-1/2 rounded-full bg-black/95 sm:top-1 sm:h-5 sm:w-24" />
                </div>
                
                {/* Screen Content */}
                <div className="p-2.5 sm:p-3 lg:p-4">
                  {/* Header Card */}
                  <div className="rounded-xl bg-white p-2 shadow-sm sm:rounded-xl sm:p-2.5 lg:p-3">
                    <img
                      src={hero.image}
                      alt="Restaurant menu preview"
                      loading="lazy"
                      className="h-20 w-full rounded-lg object-cover sm:h-24 lg:h-28"
                    />
                    <p className={`mt-1.5 text-[9px] font-black uppercase tracking-[0.15em] sm:mt-2 sm:text-[10px] lg:text-xs ${themeTokens.accentText}`}>
                      Table 07
                    </p>
                    <h2 className="mt-0.5 text-sm font-black text-slate-950 sm:text-base lg:text-lg">
                      Today's Popular Items
                    </h2>
                  </div>
                  
                  {/* Menu Items */}
                  <div className="mt-2 grid gap-1.5 sm:mt-2.5 sm:gap-2 lg:gap-2.5">
                    {['Chicken momo', 'Newari khaja set', 'Masala tea'].map((item, index) => (
                      <motion.div
                        key={item}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: 0.6 + index * 0.12 }}
                        className="flex items-center justify-between rounded-lg bg-white px-2 py-1.5 shadow-sm sm:px-2.5 sm:py-2 lg:px-3 lg:py-2.5"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[11px] font-black text-slate-900 sm:text-xs lg:text-sm">{item}</p>
                          <p className="truncate text-[9px] font-bold text-slate-500 sm:text-[10px] lg:text-xs">
                            {index === 0 ? 'Most ordered today' : index === 1 ? 'Ready in 12 mins' : 'Freshly prepared'}
                          </p>
                        </div>
                        <span className="ml-2 shrink-0 rounded-md bg-secondary-100 px-1.5 py-0.5 text-[9px] font-black text-secondary-700 sm:rounded-lg sm:px-2 sm:py-1 sm:text-[10px] lg:text-xs">
                          Add
                        </span>
                      </motion.div>
                    ))}
                  </div>
                  
                  {/* Order Summary */}
                  <div className="mt-2 rounded-xl bg-slate-950 p-2 text-white sm:mt-2.5 sm:p-2.5 lg:mt-3 lg:p-3">
                    <div className="text-[8px] font-black uppercase tracking-wide text-slate-300 sm:text-[9px] lg:text-[10px]">
                      Order Summary
                    </div>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-[9px] font-bold text-slate-300 sm:text-[10px] lg:text-xs">Total:</span>
                      <span className="text-xs font-black sm:text-sm">Rs. 1,240</span>
                    </div>
                    <div className={`mt-1.5 rounded-lg py-1.5 text-center text-[9px] font-black text-white sm:mt-2 sm:py-2 sm:text-[10px] lg:text-xs ${themeTokens.summaryBar}`}>
                      Send Order to Kitchen
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* QR Code Card */}
          <motion.div
            style={reduceMotion ? undefined : { scale: cardScale, x: '-50%' }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="absolute bottom-0 left-1/2 z-20 w-[160px] rounded-2xl border border-slate-200 bg-white p-2.5 shadow-2xl sm:bottom-auto sm:left-[70%] sm:top-[380px] sm:w-[180px] sm:p-3 lg:top-[440px] lg:w-[200px] lg:p-4"
          >
            <motion.div
              animate={reduceMotion ? undefined : { y: [0, -8, 0] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
              className="relative mx-auto grid h-16 w-16 grid-cols-7 gap-0.5 overflow-hidden rounded-lg bg-white p-1 sm:h-20 sm:w-20 sm:gap-0.5 sm:p-1.5 lg:h-24 lg:w-24"
            >
              {qrBlocks.map((block) => (
                <span
                  key={block}
                  className={
                    block % 5 === 0 || block % 7 === 0 || [1, 2, 6, 8, 16, 24, 32, 40, 46].includes(block)
                      ? 'rounded-[1px] bg-slate-950'
                      : 'rounded-[1px] bg-slate-100'
                  }
                />
              ))}
              <motion.span
                animate={reduceMotion ? undefined : { y: [0, 48, 0] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                className={`absolute left-1 right-1 top-1 h-0.5 rounded-full opacity-90 shadow-md sm:left-1.5 sm:right-1.5 sm:top-1.5 sm:h-0.5 ${themeTokens.ringAccent.replace('text-', 'bg-')}`}
              />
            </motion.div>
            <div className="mt-1.5 flex items-center justify-center gap-1.5 text-[9px] font-black text-slate-700 sm:mt-2 sm:gap-2 sm:text-[10px] lg:text-xs">
              <Clock3 className="h-3 w-3 shrink-0 text-primary-600 sm:h-3.5 sm:w-3.5" />
              <span className="min-w-[72px] text-left sm:min-w-[88px]">
                {typeText}
                <span className="ml-0.5 inline-block h-2.5 w-[1.5px] animate-pulse bg-primary-600 align-middle sm:h-3" />
              </span>
            </div>
          </motion.div>

          {/* Floating Feature Cards - Hidden on mobile/tablet */}
          {floatingFeatures.map((feature, index) => {
            const Icon = feature.icon
            const positions = [
              'left-0 top-4',
              'right-0 top-16',
              'left-2 bottom-20',
            ]
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, scale: 0.86, y: 24 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                animate={reduceMotion ? undefined : { y: [0, index % 2 === 0 ? -10 : 10, 0] }}
                transition={{ duration: 4 + index * 0.25, repeat: Infinity, ease: 'easeInOut', delay: index * 0.08 }}
                className={`absolute z-20 hidden w-36 rounded-xl border border-white/80 bg-white/90 p-3 shadow-xl shadow-slate-900/10 backdrop-blur xl:block ${positions[index]}`}
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-950 text-white">
                  <Icon className="h-4 w-4" />
                </span>
                <p className="mt-2.5 text-xs font-black text-slate-950">{feature.title}</p>
                <p className="text-[10px] font-bold text-slate-500">{feature.text}</p>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default HeroSection