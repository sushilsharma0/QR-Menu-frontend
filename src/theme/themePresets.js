export const THEME_STORAGE_KEY = 'qrmenu_theme_settings'

export const FONT_OPTIONS = [
  { label: 'Inter', value: 'Inter, system-ui, sans-serif' },
  { label: 'System UI', value: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
  { label: 'Arial', value: 'Arial, Helvetica, sans-serif' },
  { label: 'Helvetica', value: 'Helvetica, Arial, sans-serif' },
  { label: 'Roboto', value: 'Roboto, Inter, system-ui, sans-serif' },
  { label: 'Open Sans', value: '"Open Sans", Inter, system-ui, sans-serif' },
  { label: 'Lato', value: 'Lato, Inter, system-ui, sans-serif' },
  { label: 'Poppins', value: 'Poppins, Inter, system-ui, sans-serif' },
  { label: 'DM Sans', value: '"DM Sans", Inter, system-ui, sans-serif' },
  { label: 'Montserrat', value: 'Montserrat, Inter, system-ui, sans-serif' },
  { label: 'Nunito', value: 'Nunito, Inter, system-ui, sans-serif' },
  { label: 'Raleway', value: 'Raleway, Inter, system-ui, sans-serif' },
  { label: 'Ubuntu', value: 'Ubuntu, Inter, system-ui, sans-serif' },
  { label: 'Merriweather', value: 'Merriweather, Georgia, serif' },
  { label: 'Georgia', value: 'Georgia, "Times New Roman", serif' },
  { label: 'Times New Roman', value: '"Times New Roman", Times, serif' },
  { label: 'Playfair Display', value: '"Playfair Display", Georgia, serif' },
  { label: 'Courier New', value: '"Courier New", Courier, monospace' },
  { label: 'Fira Code', value: '"Fira Code", "Courier New", monospace' },
]

export const PREDEFINED_THEMES = [
  {
    id: 'royal_brown',
    name: 'Royal Brown',
    tier: 'default',
    palette: {
      primary: '#8f2800',
      secondary: '#b64a26',
      accent: '#756a03',
      attention: '#a69b02',
      surface: '#feefa5',
      background: '#fffcf1',
      text: '#391000',
    },
  },
  {
    id: 'modern_blue',
    name: 'Modern Blue',
    tier: 'default',
    palette: {
      primary: '#1d4ed8',
      secondary: '#3b82f6',
      accent: '#0f172a',
      attention: '#f59e0b',
      surface: '#eff6ff',
      background: '#f8fbff',
      text: '#0f172a',
    },
  },
  {
    id: 'emerald_green',
    name: 'Emerald Green',
    tier: 'default',
    palette: {
      primary: '#065f46',
      secondary: '#10b981',
      accent: '#064e3b',
      attention: '#facc15',
      surface: '#ecfdf5',
      background: '#f7fffb',
      text: '#052e26',
    },
  },
  {
    id: 'luxury_black_gold',
    name: 'Luxury Black & Gold',
    tier: 'premium_ready',
    palette: {
      primary: '#111827',
      secondary: '#1f2937',
      accent: '#d4af37',
      attention: '#fbbf24',
      surface: '#f9fafb',
      background: '#ffffff',
      text: '#111827',
    },
  },
  {
    id: 'elegant_purple',
    name: 'Elegant Purple',
    tier: 'default',
    palette: {
      primary: '#6d28d9',
      secondary: '#8b5cf6',
      accent: '#4c1d95',
      attention: '#f59e0b',
      surface: '#f5f3ff',
      background: '#fbfaff',
      text: '#2e1065',
    },
  },
  {
    id: 'sunset_orange',
    name: 'Sunset Orange',
    tier: 'seasonal_ready',
    palette: {
      primary: '#ea580c',
      secondary: '#fb923c',
      accent: '#7c2d12',
      attention: '#facc15',
      surface: '#fff7ed',
      background: '#fffaf5',
      text: '#431407',
    },
  },
]

export const DEFAULT_THEME_SETTINGS = {
  activeTheme: 'royal_brown',
  mode: 'light',
  darkMode: false,
  fontFamily: 'Inter, system-ui, sans-serif',
  allowCustomThemes: true,
  customPalette: null,
  branchOverridesEnabled: false,
  branchThemes: {},
  branding: {
    logo: '',
    favicon: '',
    backgroundImage: '',
  },
}

const clamp = (value) => Math.max(0, Math.min(255, value))

const hexToRgb = (hex) => {
  const clean = String(hex || '').replace('#', '')
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean
  const value = parseInt(full, 16)
  if (Number.isNaN(value)) return { r: 143, g: 40, b: 0 }
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  }
}

const rgbToHex = ({ r, g, b }) =>
  `#${[r, g, b].map((v) => clamp(Math.round(v)).toString(16).padStart(2, '0')).join('')}`

const mix = (hex, target, weight) => {
  const from = hexToRgb(hex)
  const to = hexToRgb(target)
  return rgbToHex({
    r: from.r + (to.r - from.r) * weight,
    g: from.g + (to.g - from.g) * weight,
    b: from.b + (to.b - from.b) * weight,
  })
}

export const buildScale = (hex) => ({
  50: mix(hex, '#ffffff', 0.9),
  100: mix(hex, '#ffffff', 0.78),
  200: mix(hex, '#ffffff', 0.6),
  300: mix(hex, '#ffffff', 0.42),
  400: mix(hex, '#ffffff', 0.22),
  500: hex,
  600: mix(hex, '#000000', 0.12),
  700: mix(hex, '#000000', 0.28),
  800: mix(hex, '#000000', 0.44),
  900: mix(hex, '#000000', 0.62),
})

export const isValidHex = (value) => /^#[0-9a-fA-F]{6}$/.test(String(value || ''))

export const getThemeById = (themeId) =>
  PREDEFINED_THEMES.find((theme) => theme.id === themeId) || PREDEFINED_THEMES[0]

export const normalizeThemeSettings = (settings = {}) => {
  const raw = settings?.themeSettings || settings || {}
  const activeTheme = PREDEFINED_THEMES.some((theme) => theme.id === raw.activeTheme)
    ? raw.activeTheme
    : DEFAULT_THEME_SETTINGS.activeTheme
  const mode = raw.mode || (raw.darkMode ? 'dark' : 'light')
  const fontFamily = FONT_OPTIONS.some((font) => font.value === raw.fontFamily)
    ? raw.fontFamily
    : DEFAULT_THEME_SETTINGS.fontFamily

  const customPalette =
    raw.customPalette && typeof raw.customPalette === 'object'
      ? Object.fromEntries(
          Object.entries(raw.customPalette).reduce((entries, [key, value]) => {
            if (isValidHex(value)) entries.push([key, value])
            return entries
          }, []),
        )
      : null

  return {
    ...DEFAULT_THEME_SETTINGS,
    ...raw,
    activeTheme,
    mode,
    darkMode: mode === 'dark',
    fontFamily,
    customPalette,
    branding: {
      ...DEFAULT_THEME_SETTINGS.branding,
      ...(raw.branding || {}),
    },
  }
}

export const getEffectivePalette = (settings) => {
  const normalized = normalizeThemeSettings(settings)
  if (normalized.activeTheme === 'custom' && normalized.customPalette) {
    const fallback = getThemeById(DEFAULT_THEME_SETTINGS.activeTheme).palette
    return { ...fallback, ...normalized.customPalette }
  }
  return getThemeById(normalized.activeTheme).palette
}

export const resolveMode = (mode) => {
  if (mode === 'system') {
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return mode === 'dark' ? 'dark' : 'light'
}

export const applyThemeToDocument = (settings) => {
  if (typeof document === 'undefined') return
  const normalized = normalizeThemeSettings(settings)
  const palette = getEffectivePalette(normalized)
  const root = document.documentElement
  const isDark = resolveMode(normalized.mode) === 'dark'
  const semantic = {
    ...palette,
    background: isDark ? '#0b1120' : palette.background || palette.surface,
    foreground: isDark ? '#f8fafc' : palette.text || '#111827',
    muted: isDark ? '#111827' : mix(palette.surface, '#ffffff', 0.55),
    card: isDark ? '#111827' : '#ffffff',
    border: isDark ? '#1f2937' : mix(palette.surface, '#000000', 0.08),
  }

  ;['primary', 'secondary', 'accent', 'attention', 'surface'].forEach((name) => {
    const scale = buildScale(palette[name])
    Object.entries(scale).forEach(([step, value]) => {
      root.style.setProperty(`--color-${name}-${step}`, value)
    })
    root.style.setProperty(`--color-${name}`, palette[name])
  })

  Object.entries(semantic).forEach(([key, value]) => {
    root.style.setProperty(`--color-${key}`, value)
  })
  root.style.setProperty('--button-spinner-color', palette.primary || '#8f2800')
  root.style.setProperty('--button-spinner-on-solid', palette.primary || '#8f2800')
  root.style.setProperty('--button-spinner-on-light', palette.primary || '#8f2800')
  root.style.setProperty('--font-app', normalized.fontFamily)
  root.classList.toggle('dark', isDark)
  root.dataset.theme = normalized.activeTheme
  root.dataset.themeMode = normalized.mode
}
