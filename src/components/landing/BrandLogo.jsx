import React from 'react'
import { Link } from 'react-router-dom'
import { QrCode } from 'lucide-react'
import { siteName } from './landingDefaults'

const BrandLogo = ({ compact = false, onClick }) => (
  <Link to="/" onClick={onClick} className="group flex items-center gap-3" aria-label={`${siteName} home`}>
    <span className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-[14px] border border-primary-200 bg-white shadow-md shadow-primary-900/10">
      <span className="absolute inset-0 bg-gradient-to-br from-primary-600 via-secondary-500 to-accent-500 opacity-95 transition duration-300 group-hover:scale-110" />
      <span className="absolute -right-3 -top-3 h-5 w-5 rounded-full bg-attention-300 blur-sm" />
      <QrCode className="relative h-5 w-5 text-white" />
    </span>
    {!compact && (
      <span className="leading-none">
        <span className="block bg-gradient-to-r from-primary-700 via-secondary-700 to-primary-900 bg-clip-text text-[1.22rem] font-black tracking-tight text-transparent">
          QR Restro
        </span>
        <span className="block text-[10px] font-black uppercase tracking-[0.38em] text-slate-500">Nepal</span>
      </span>
    )}
  </Link>
)

export default BrandLogo
