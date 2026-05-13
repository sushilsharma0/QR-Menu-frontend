import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  DEFAULT_THEME_SETTINGS,
  THEME_STORAGE_KEY,
  applyThemeToDocument,
  normalizeThemeSettings,
  resolveMode,
} from '../theme/themePresets'

const LEGACY_THEME_KEY = 'qrmenu_theme'
const ThemeContext = createContext(null)

const readInitialTheme = () => {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    if (stored) return normalizeThemeSettings(JSON.parse(stored))

    const legacy = localStorage.getItem(LEGACY_THEME_KEY)
    if (legacy === 'dark' || legacy === 'light') {
      return normalizeThemeSettings({
        ...DEFAULT_THEME_SETTINGS,
        mode: legacy,
        darkMode: legacy === 'dark',
      })
    }
  } catch {
    // Local storage can fail in private contexts; defaults still render.
  }
  return normalizeThemeSettings(DEFAULT_THEME_SETTINGS)
}

export const ThemeProvider = ({ children }) => {
  const [themeSettings, setThemeSettings] = useState(readInitialTheme)

  useEffect(() => {
    applyThemeToDocument(themeSettings)
    try {
      localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(themeSettings))
      localStorage.setItem(LEGACY_THEME_KEY, resolveMode(themeSettings.mode))
    } catch {
      // CSS variables are already applied, persistence is best-effort.
    }
  }, [themeSettings])

  useEffect(() => {
    const media = window.matchMedia?.('(prefers-color-scheme: dark)')
    if (!media) return undefined
    const handleSystemChange = () => {
      if (themeSettings.mode === 'system') applyThemeToDocument(themeSettings)
    }
    media.addEventListener?.('change', handleSystemChange)
    return () => media.removeEventListener?.('change', handleSystemChange)
  }, [themeSettings])

  useEffect(() => {
    const handleExternalTheme = (event) => {
      if (event.detail) setThemeSettings(normalizeThemeSettings(event.detail))
    }
    window.addEventListener('qrmenu:theme-settings', handleExternalTheme)
    return () => window.removeEventListener('qrmenu:theme-settings', handleExternalTheme)
  }, [])

  const updateTheme = useCallback((updates) => {
    setThemeSettings((prev) => normalizeThemeSettings({ ...prev, ...updates }))
  }, [])

  const applyRemoteTheme = useCallback((settings) => {
    if (!settings) return
    setThemeSettings(normalizeThemeSettings(settings.themeSettings || settings))
  }, [])

  const resetTheme = useCallback(() => {
    setThemeSettings(normalizeThemeSettings(DEFAULT_THEME_SETTINGS))
  }, [])

  const setTheme = useCallback((mode) => {
    updateTheme({ mode })
  }, [updateTheme])

  const toggleTheme = useCallback(() => {
    updateTheme({ mode: resolveMode(themeSettings.mode) === 'dark' ? 'light' : 'dark' })
  }, [themeSettings.mode, updateTheme])

  const value = useMemo(() => {
    const resolvedTheme = resolveMode(themeSettings.mode)
    return {
      theme: resolvedTheme,
      mode: themeSettings.mode,
      isDark: resolvedTheme === 'dark',
      themeSettings,
      setTheme,
      updateTheme,
      applyRemoteTheme,
      resetTheme,
      toggleTheme,
    }
  }, [applyRemoteTheme, resetTheme, setTheme, themeSettings, toggleTheme, updateTheme])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export const useTheme = () => {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
