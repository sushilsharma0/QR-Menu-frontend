import React from 'react'
import { motion } from 'framer-motion'

const SectionHeader = ({ eyebrow, title, description, align = 'center', tone = 'light' }) => (
  <motion.div
    initial={{ opacity: 0, y: 22 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-80px' }}
    transition={{ duration: 0.6 }}
    className={align === 'left' ? 'max-w-2xl' : 'mx-auto max-w-3xl text-center'}
  >
    <p className={tone === 'dark' ? 'text-sm font-black uppercase tracking-[0.25em] text-attention-200' : 'text-sm font-black uppercase tracking-[0.25em] text-primary-700'}>{eyebrow}</p>
    <h2 className={tone === 'dark' ? 'mt-4 text-3xl font-black tracking-tight text-white sm:text-5xl' : 'mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-5xl'}>{title}</h2>
    {description && <p className={tone === 'dark' ? 'mt-5 text-base leading-8 text-slate-300' : 'mt-5 text-base leading-8 text-slate-600'}>{description}</p>}
  </motion.div>
)

export default SectionHeader
