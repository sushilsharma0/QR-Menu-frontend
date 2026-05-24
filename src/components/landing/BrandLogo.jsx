import React from 'react'
import { Link } from 'react-router-dom'
import { siteName as fallbackSiteName } from './landingDefaults'
import { useLandingBranding } from '../../context/LandingBrandingContext'
import { PLATFORM_LOGO_SRC } from '../../constants/platformBrand'

/** Fits inside LandingNavbar bar (h-14–h-16 / sm:h-16–[4.5rem]) */
const LOGO_BOX = {
  compact: 'h-10 w-10',
  scrolled: 'h-9 w-9 sm:h-10 sm:w-10',
  default: 'h-10 w-10 sm:h-11 sm:w-11',
}

const BrandLogo = ({ compact = false, scrolled = false, showSlogan = false, onClick }) => {
  const { softwareName, brandSubtitle, landingLogo } = useLandingBranding()
  const title = (softwareName || fallbackSiteName).trim() || fallbackSiteName
  const slogan = String(brandSubtitle || '').trim()
  const logoSrc = landingLogo || PLATFORM_LOGO_SRC

  const boxClass = compact ? LOGO_BOX.compact : scrolled ? LOGO_BOX.scrolled : LOGO_BOX.default

  return (
    <Link to="/" onClick={onClick} className="group flex items-center gap-2.5 sm:gap-3" aria-label={`${title} home`}>
      <span
        className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-primary-100 bg-white shadow-sm ${boxClass}`}
      >
        <img
          src={logoSrc}
          alt=""
          className="h-full w-full scale-[1.55] object-contain"
        />
      </span>
      {!compact && (
        <span className="min-w-0">
          <span className="block truncate text-[1.05rem] font-semibold leading-none tracking-tight text-primary-800 sm:text-[1.22rem]">
            {title}
          </span>
          {showSlogan && slogan ? (
            <span className="mt-1 block max-w-[11rem] truncate text-[10px] font-bold uppercase leading-none tracking-wide text-slate-500 sm:max-w-[14rem] sm:text-[11px]">
              {slogan}
            </span>
          ) : null}
        </span>
      )}
    </Link>
  )
}

export default BrandLogo
