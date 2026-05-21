import React from 'react'
import { LazyMotion, domAnimation, m } from 'framer-motion'
import { useLandingBranding } from '../../context/LandingBrandingContext'

const dots = Array.from({ length: 18 }, (_, i) => ({
  id: `dot-${i}`,
  top: `${((i * 37) % 100)}%`,
  left: `${((i * 61 + 13) % 100)}%`,
  duration: 4 + (i % 5) * 0.8,
  delay: (i % 4) * 0.5,
}))

const LandingBackground = () => {
  const { themeTokens } = useLandingBranding()

  return (
    <LazyMotion features={domAnimation}>
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-transparent">
      {/* Soft pastel gradient (light UI feel) */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.08),transparent_40%),radial-gradient(circle_at_bottom,rgba(168,85,247,0.07),transparent_45%),linear-gradient(to_bottom,rgba(255,255,255,1),rgba(248,250,252,1))]" />

      {/* PREMIUM GRID (main upgrade) */}
      <div className="absolute inset-0">
        {/* Large grid */}
        <div className="absolute inset-0 opacity-[0.06] bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:90px_90px]" />

        {/* Small grid overlay (gives depth) */}
        <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:30px_30px]" />

        {/* Soft fade mask so grid doesn’t feel harsh */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_20%,rgba(255,255,255,0.9))]" />
      </div>

      {/* Floating blobs */}
      <m.div
        animate={{ x: [0, 30, 0], y: [0, -25, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        className={`absolute left-[-10rem] top-[-8rem] h-[26rem] w-[26rem] rounded-full blur-3xl opacity-30 ${themeTokens.blobA}`}
      />

      <m.div
        animate={{ x: [0, -30, 0], y: [0, 30, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
        className={`absolute bottom-[-10rem] right-[-10rem] h-[30rem] w-[30rem] rounded-full blur-3xl opacity-25 ${themeTokens.blobB}`}
      />

      {/* Soft center glow */}
      <div className="absolute left-1/2 top-1/3 h-[22rem] w-[22rem] -translate-x-1/2 rounded-full bg-sky-300/10 blur-[120px]" />

      {/* Elegant curves */}
      <svg
        className={`absolute left-1/2 top-0 h-[700px] w-[1500px] -translate-x-1/2 opacity-30 ${themeTokens.curve}`}
        viewBox="0 0 1500 700"
        fill="none"
      >
        <m.path
          d="M-100 380C150 120 350 620 620 320C880 20 1100 140 1300 300C1450 420 1600 300 1750 120"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 3 }}
        />

        <m.path
          d="M-80 500C180 300 420 650 700 420C950 200 1200 260 1400 400C1550 500 1650 420 1780 300"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 4, delay: 0.3 }}
        />
      </svg>

      {/* Floating dots */}
      <div className="absolute inset-0">
        {dots.map((dot) => (
          <m.span
            key={dot.id}
            className="absolute h-1.5 w-1.5 rounded-full bg-slate-500/20"
            style={{
              top: dot.top,
              left: dot.left,
            }}
            animate={{
              y: [0, -15, 0],
              opacity: [0.2, 0.6, 0.2],
              scale: [1, 1.3, 1],
            }}
            transition={{
              duration: dot.duration,
              repeat: Infinity,
              delay: dot.delay,
            }}
          />
        ))}
      </div>

      {/* Soft vignette (very light, not dark) */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_60%,rgba(255,255,255,0.4))]" />
    </div>
    </LazyMotion>
  )
}

export default LandingBackground
