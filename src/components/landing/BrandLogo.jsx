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

const BrandLogo = ({ compact = false, scrolled = false, onClick }) => {
  const { softwareName } = useLandingBranding()
  const title = (softwareName || fallbackSiteName).trim() || fallbackSiteName

  const boxClass = compact ? LOGO_BOX.compact : scrolled ? LOGO_BOX.scrolled : LOGO_BOX.default

  return (
    <Link to="/" onClick={onClick} className="group flex items-center gap-2.5 sm:gap-3" aria-label={`${title} home`}>
      <span
        className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-primary-100 bg-white shadow-sm ${boxClass}`}
      >
        <img
          src={PLATFORM_LOGO_SRC}
          alt=""
          className="h-full w-full scale-[1.55] object-contain"
        />
      </span>
      {!compact && (
        <span className="text-[1.22rem] font-semibold leading-none tracking-tight text-primary-800">
          {title}
        </span>
      )}
    </Link>
  )
}

export default BrandLogo
