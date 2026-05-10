import React, { createContext, useContext } from 'react'
import { getLandingTheme } from '../components/landing/landingThemePresets'
import { siteName as defaultSiteName } from '../components/landing/landingDefaults'

const LandingBrandingContext = createContext(null)

export function LandingBrandingProvider({ value, children }) {
  const themeId = value?.landingTheme || 'default'
  const merged = {
    ...value,
    themeTokens: getLandingTheme(themeId),
  }
  return <LandingBrandingContext.Provider value={merged}>{children}</LandingBrandingContext.Provider>
}

export function useLandingBranding() {
  const ctx = useContext(LandingBrandingContext)
  return (
    ctx || {
      themeTokens: getLandingTheme('default'),
      softwareName: defaultSiteName,
      brandSubtitle: 'Nepal',
      publicSiteUrl: '',
      chat: { enabled: false },
      footer: {},
    }
  )
}
