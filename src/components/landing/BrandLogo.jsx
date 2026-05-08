import React from 'react'
import { Link } from 'react-router-dom'
import { QrCode } from 'lucide-react'
import { siteName } from './landingDefaults'

const BrandLogo = ({ compact = false, onClick }) => (
  <Link to="/" onClick={onClick} className="group flex items-center gap-3" aria-label={`${siteName} home`}>
    <span className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-950 text-white shadow-lg shadow-slate-900/15">
      <span className="absolute inset-0 bg-[linear-gradient(135deg,rgba(16,185,129,0.95),rgba(14,165,233,0.6),rgba(251,191,36,0.75))] opacity-80 transition group-hover:scale-125" />
      <QrCode className="relative h-5 w-5" />
    </span>
    {!compact && (
      <span className="leading-none">
        <span className="block bg-gradient-to-r from-slate-950 via-emerald-700 to-amber-600 bg-clip-text text-xl font-black tracking-tight text-transparent">
          QR Restro
        </span>
        <span className="block text-[11px] font-black uppercase tracking-[0.34em] text-slate-500">Nepal</span>
      </span>
    )}
  </Link>
)

export default BrandLogo
