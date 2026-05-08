import React from 'react'

const LandingBackground = () => (
  <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-surface-50">
    <div className="landing-grid absolute inset-0 opacity-70" />
    <svg className="landing-curve absolute left-1/2 top-10 h-[620px] w-[1280px] -translate-x-1/2 text-primary-500/25" viewBox="0 0 1280 620" fill="none">
      <path d="M-30 380C135 206 275 570 448 324C624 73 791 91 944 248C1067 374 1167 302 1317 111" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M-20 475C192 300 309 657 512 410C716 162 886 208 1020 356C1126 472 1223 427 1320 310" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
    <div className="absolute right-[-8rem] top-24 h-80 w-80 rounded-full bg-secondary-200/40 blur-3xl" />
    <div className="absolute bottom-20 left-[-8rem] h-96 w-96 rounded-full bg-attention-200/35 blur-3xl" />
  </div>
)

export default LandingBackground
