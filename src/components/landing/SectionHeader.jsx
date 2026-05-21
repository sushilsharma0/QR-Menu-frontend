import React from 'react'
import { LazyMotion, domAnimation, m } from 'framer-motion'

const SectionHeader = ({ eyebrow, title, description, align = 'center', tone = 'light' }) => (
  <LazyMotion features={domAnimation}>
    <m.div
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={align === 'left' ? 'max-w-2xl' : 'mx-auto max-w-3xl text-center'}
    >
      <p
        className={
          tone === 'dark'
            ? 'text-[11px] font-black uppercase tracking-[0.22em] text-attention-200 sm:text-sm sm:tracking-[0.25em]'
            : 'text-[11px] font-black uppercase tracking-[0.22em] text-primary-700 sm:text-sm sm:tracking-[0.25em]'
        }
      >
        {eyebrow}
      </p>
      <h2
        className={
          tone === 'dark'
            ? 'mt-3 text-2xl font-semibold leading-tight tracking-tight text-white sm:mt-4 sm:text-3xl md:text-4xl lg:text-5xl'
            : 'mt-3 text-2xl font-semibold leading-tight tracking-tight text-slate-950 sm:mt-4 sm:text-3xl md:text-4xl lg:text-5xl'
        }
      >
        {title}
      </h2>
      {description && (
        <p
          className={
            tone === 'dark'
              ? 'mt-3 text-sm leading-7 text-slate-300 sm:mt-5 sm:text-base sm:leading-8'
              : 'mt-3 text-sm leading-7 text-slate-600 sm:mt-5 sm:text-base sm:leading-8'
          }
        >
          {description}
        </p>
      )}
    </m.div>
  </LazyMotion>
)

export default SectionHeader
