import React from 'react'
import { Link } from 'react-router-dom'
import { QrCode } from 'lucide-react'
import { siteName as fallbackSiteName } from './landingDefaults'
import { useLandingBranding } from '../../context/LandingBrandingContext'

const BrandLogo = ({ compact = false, onClick }) => {
  const { softwareName, brandSubtitle } = useLandingBranding()
  const title = (softwareName || fallbackSiteName).trim() || fallbackSiteName
  const sub = (brandSubtitle || '').trim()

  return (
    <Link to="/" onClick={onClick} className="group flex items-center gap-3" aria-label={`${title} home`}>
      <span className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-[14px] border border-primary-200 bg-white shadow-md shadow-primary-900/10">
        <span className="absolute inset-0 bg-gradient-to-br from-primary-600 via-secondary-500 to-accent-500 opacity-95 transition duration-300 group-hover:scale-110" />
        <span className="absolute -right-3 -top-3 h-5 w-5 rounded-full bg-attention-300 blur-sm" />
        <QrCode className="relative h-5 w-5 text-white" />
      </span>
      {!compact && (
        <span className="leading-none">
          <span className="block text-[1.22rem] font-semibold tracking-tight text-primary-800">
            {title}
          </span>
          {sub ? (
            <span className="block text-[10px] font-black uppercase tracking-[0.38em] text-slate-500">{sub}</span>
          ) : null}
        </span>
      )}
    </Link>
  )
}

export default BrandLogo
