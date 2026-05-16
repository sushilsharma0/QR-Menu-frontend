import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import toast from '@utils/toast'
import { FiCheck, FiImage, FiMoon, FiRefreshCw, FiSun, FiUpload, FiX, FiEye } from 'react-icons/fi'
import api from '../../services/api'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import { useAuth } from '../../hooks/useAuth'
import NotificationSettingsPanel from '../../components/notifications/NotificationSettingsPanel'
import { useTheme } from '../../context/ThemeContext'
import {
  DEFAULT_THEME_SETTINGS,
  FONT_OPTIONS,
  PREDEFINED_THEMES,
  getEffectivePalette,
  isValidHex,
  normalizeThemeSettings,
} from '../../theme/themePresets'

const customPaletteFields = [
  ['primary', 'Primary'],
  ['secondary', 'Secondary'],
  ['accent', 'Accent'],
  ['attention', 'Attention'],
  ['surface', 'Surface'],
  ['background', 'Background'],
  ['text', 'Text'],
]

const getEditablePalette = (settings) => ({
  ...getEffectivePalette(settings),
  ...(settings.customPalette || {}),
})

const normalizeHexEntry = (value) => {
  const clean = String(value || '').replace(/^#/, '').replace(/[^0-9a-fA-F]/g, '').slice(0, 6)
  return `#${clean}`
}

function ThemePaletteCard({ theme, selected, onSelect }) {
  const colors = ['primary', 'secondary', 'accent', 'attention', 'surface']
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group rounded-lg border p-4 text-left transition hover:-translate-y-1 hover:shadow-md ${
        selected
          ? 'border-primary-500 bg-primary-50 shadow-sm ring-2 ring-primary-100 dark:bg-gray-800 dark:ring-gray-700'
          : 'border-gray-100 bg-white hover:border-primary-200 dark:border-gray-800 dark:bg-gray-900'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-black text-gray-950 dark:text-gray-100">{theme.name}</p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-gray-400">
            {theme.tier === 'default' ? 'Included' : 'Premium ready'}
          </p>
        </div>
        {selected && (
          <span className="rounded-full bg-primary-600 p-1 text-white">
            <FiCheck className="h-3.5 w-3.5" />
          </span>
        )}
      </div>
      <div className="mt-4 flex gap-2">
        {colors.map((key) => (
          <span
            key={key}
            className="h-7 w-7 rounded-full border border-white shadow-sm ring-1 ring-black/5"
            style={{ backgroundColor: theme.palette[key] }}
            title={key}
          />
        ))}
      </div>
      <div className="mt-4 overflow-hidden rounded-lg border border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-950">
        <div className="flex">
          <div className="w-12 p-2" style={{ backgroundColor: theme.palette.primary }}>
            <div className="mb-2 h-4 rounded bg-white/25" />
            <div className="h-2 rounded bg-white/50" />
          </div>
          <div className="flex-1 p-2">
            <div className="mb-2 h-2 w-1/2 rounded" style={{ backgroundColor: theme.palette.secondary }} />
            <div className="rounded-md p-2" style={{ backgroundColor: theme.palette.surface }}>
              <span className="inline-block rounded px-2 py-1 text-[10px] font-bold text-white" style={{ backgroundColor: theme.palette.primary }}>
                Sample
              </span>
            </div>
          </div>
        </div>
      </div>
    </button>
  )
}

function BrandUpload({ id, label, preview, onChange, hint }) {
  return (
    <div className="rounded-lg border border-gray-100 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <p className="font-bold text-gray-900 dark:text-gray-100">{label}</p>
      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{hint}</p>
      {preview && (
        <div className="mt-3 h-24 overflow-hidden rounded-lg border border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-gray-950">
          <img src={preview} alt={`${label} preview`} className="h-full w-full object-contain" />
        </div>
      )}
      <div className="mt-3 rounded-lg border-2 border-dashed border-gray-200 p-4 text-center transition hover:border-primary-400 dark:border-gray-700">
        <input id={id} type="file" accept="image/*" onChange={onChange} className="hidden" />
        <label htmlFor={id} className="inline-flex cursor-pointer items-center gap-2 text-sm font-bold text-primary-700 dark:text-primary-300">
          <FiUpload className="h-4 w-4" />
          Upload
        </label>
      </div>
    </div>
  )
}

const Settings = () => {
  const [loading, setLoading] = useState(false)
  const [restaurant, setRestaurant] = useState(null)
  const [logoPreview, setLogoPreview] = useState(null)
  const [backgroundPreview, setBackgroundPreview] = useState(null)
  const [logoFile, setLogoFile] = useState(null)
  const [backgroundFile, setBackgroundFile] = useState(null)
  const [faviconPreview, setFaviconPreview] = useState(null)
  const [brandBackgroundPreview, setBrandBackgroundPreview] = useState(null)
  const [faviconFile, setFaviconFile] = useState(null)
  const [brandBackgroundFile, setBrandBackgroundFile] = useState(null)
  const [showLogoPreview, setShowLogoPreview] = useState(false)
  const [showBackgroundPreview, setShowBackgroundPreview] = useState(false)
  const [themeDraft, setThemeDraft] = useState(normalizeThemeSettings(DEFAULT_THEME_SETTINGS))
  const [paletteInputs, setPaletteInputs] = useState(getEditablePalette(DEFAULT_THEME_SETTINGS))
  const { mergeUser } = useAuth()
  const { updateTheme, applyRemoteTheme, resetTheme } = useTheme()
  const { register, handleSubmit, setValue, formState: { errors } } = useForm()

  useEffect(() => {
    fetchRestaurant()
  }, [])

  useEffect(() => {
    setPaletteInputs(getEditablePalette(themeDraft))
  }, [themeDraft])

  const fetchRestaurant = async () => {
    try {
      const res = await api.get('/restaurant/auth/profile')
      setRestaurant(res.data.data)
      
      // Set form values (name is read-only)
      setValue('name', res.data.data.name)
      setValue('phone', res.data.data.phone)
      setValue('address', res.data.data.address)
      setValue('city', res.data.data.city)
      setValue('state', res.data.data.state)
      setValue('pincode', res.data.data.pincode)
      setValue('description', res.data.data.description)
      setValue('openingTime', res.data.data.openingTime)
      setValue('closingTime', res.data.data.closingTime)
      
      // Set logo and background previews
      if (res.data.data.logo) {
        setLogoPreview(res.data.data.logo)
      }
      if (res.data.data.backgroundPhoto) {
        setBackgroundPreview(res.data.data.backgroundPhoto)
      }
      if (res.data.data.favicon) {
        setFaviconPreview(res.data.data.favicon)
      }
      if (res.data.data.brandBackgroundImage) {
        setBrandBackgroundPreview(res.data.data.brandBackgroundImage)
      }
      const loadedTheme = normalizeThemeSettings(res.data.data.settings?.themeSettings)
      setThemeDraft(loadedTheme)
      setPaletteInputs(getEditablePalette(loadedTheme))
      applyRemoteTheme(loadedTheme)
    } catch (error) {
      toast.error('Failed to fetch restaurant settings')
    }
  }

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Logo must be less than 5MB')
      return
    }
    
    setLogoFile(file)
    const reader = new FileReader()
    reader.onload = (e) => setLogoPreview(e.target.result)
    reader.readAsDataURL(file)
  }

  const handleBackgroundChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }
    
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Background photo must be less than 10MB')
      return
    }
    
    setBackgroundFile(file)
    const reader = new FileReader()
    reader.onload = (e) => setBackgroundPreview(e.target.result)
    reader.readAsDataURL(file)
  }

  const handleBrandAssetChange = (setter, previewSetter, maxMb = 5) => (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }
    if (file.size > maxMb * 1024 * 1024) {
      toast.error(`Image must be less than ${maxMb}MB`)
      return
    }
    setter(file)
    const reader = new FileReader()
    reader.onload = (event) => previewSetter(event.target.result)
    reader.readAsDataURL(file)
  }

  const updateThemeDraft = (updates) => {
    setThemeDraft((prev) => {
      const next = normalizeThemeSettings({ ...prev, ...updates })
      updateTheme(next)
      return next
    })
  }

  const useCustomPalette = () => {
    setThemeDraft((prev) => {
      const next = normalizeThemeSettings({
        ...prev,
        activeTheme: 'custom',
        customPalette: getEditablePalette(prev),
      })
      updateTheme(next)
      return next
    })
  }

  const applyCustomPaletteColor = (key, value) => {
    setThemeDraft((prev) => {
      const next = normalizeThemeSettings({
        ...prev,
        activeTheme: 'custom',
        customPalette: {
          ...getEditablePalette(prev),
          [key]: value,
        },
      })
      updateTheme(next)
      return next
    })
  }

  const updateCustomPalette = (key, value) => {
    const nextValue = normalizeHexEntry(value)
    setPaletteInputs((prev) => ({ ...prev, [key]: nextValue }))
    if (isValidHex(nextValue)) applyCustomPaletteColor(key, nextValue)
  }

  const commitCustomPalette = (key) => {
    const currentValue = paletteInputs[key]
    if (isValidHex(currentValue)) {
      applyCustomPaletteColor(key, currentValue)
      return
    }
    setPaletteInputs(getEditablePalette(themeDraft))
    toast.error('Enter a valid 6-digit hex color, for example #6d28d9')
  }

  const resetThemeDraft = () => {
    const next = normalizeThemeSettings(DEFAULT_THEME_SETTINGS)
    setThemeDraft(next)
    setPaletteInputs(getEditablePalette(next))
    resetTheme()
  }

  const clearLogo = () => {
    setLogoFile(null)
    setLogoPreview(null)
    if (restaurant?.logo) setLogoPreview(restaurant.logo)
  }

  const clearBackground = () => {
    setBackgroundFile(null)
    setBackgroundPreview(null)
    if (restaurant?.backgroundPhoto) setBackgroundPreview(restaurant.backgroundPhoto)
  }

  const onSubmit = async (data) => {
    try {
      setLoading(true)
      const formData = new FormData()

      // Only append values that are actually present — otherwise FormData
      // serialises `undefined` / `null` to the literal strings "undefined"
      // / "null", which then get persisted into MongoDB.
      const appendIfPresent = (key, value) => {
        if (value === undefined || value === null) return
        const str = String(value)
        if (!str.trim()) return
        formData.append(key, str)
      }

      appendIfPresent('phone', data.phone)
      appendIfPresent('address', data.address)
      appendIfPresent('city', data.city)
      appendIfPresent('state', data.state)
      appendIfPresent('pincode', data.pincode)
      appendIfPresent('description', data.description)
      appendIfPresent('openingTime', data.openingTime)
      appendIfPresent('closingTime', data.closingTime)
      
      // Add file fields if present
      if (logoFile) {
        formData.append('logo', logoFile)
      }
      if (backgroundFile) {
        formData.append('backgroundPhoto', backgroundFile)
      }
      if (faviconFile) {
        formData.append('favicon', faviconFile)
      }
      if (brandBackgroundFile) {
        formData.append('brandBackgroundImage', brandBackgroundFile)
      }
      formData.append('themeSettings', JSON.stringify(themeDraft))
      
      const response = await api.put('/restaurant/auth/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      const updatedRestaurant = response.data?.data
      if (updatedRestaurant) {
        mergeUser({
          name: updatedRestaurant.name,
          phone: updatedRestaurant.phone,
          logo: updatedRestaurant.logo,
          favicon: updatedRestaurant.favicon,
          slug: updatedRestaurant.slug,
          currency: updatedRestaurant?.settings?.currency,
          themeSettings: updatedRestaurant?.settings?.themeSettings,
        })
        applyRemoteTheme(updatedRestaurant?.settings?.themeSettings)
      }
      
      toast.success('Settings updated successfully')
      setLogoFile(null)
      setBackgroundFile(null)
      setFaviconFile(null)
      setBrandBackgroundFile(null)
      await fetchRestaurant()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update settings')
    } finally {
      setLoading(false)
    }
  }

  const toggleAutoRenew = async () => {
    try {
      await api.patch('/restaurant/package/auto-renew', { autoRenew: !restaurant?.autoRenew })
      toast.success(`Auto-renew ${!restaurant?.autoRenew ? 'enabled' : 'disabled'}`)
      fetchRestaurant()
    } catch (error) {
      toast.error('Failed to update auto-renew')
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Restaurant Settings</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your restaurant profile, header photo, and customer-facing branding</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <NotificationSettingsPanel />

        <Card
          title="Appearance - Theme Customization"
          icon={FiImage}
          actions={
            <Button type="button" variant="outline" size="sm" onClick={resetThemeDraft}>
              <FiRefreshCw className="mr-2 h-4 w-4" />
              Reset default
            </Button>
          }
        >
          <div className="space-y-6">
            <div className="grid gap-3 md:grid-cols-3">
              {[
                { value: 'light', label: 'Light', icon: FiSun },
                { value: 'dark', label: 'Dark', icon: FiMoon },
                { value: 'system', label: 'System', icon: FiRefreshCw },
              ].map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => updateThemeDraft({ mode: value })}
                  className={`flex items-center justify-between rounded-lg border px-4 py-3 text-sm font-bold transition hover:-translate-y-0.5 ${
                    themeDraft.mode === value
                      ? 'border-primary-500 bg-primary-50 text-primary-800 shadow-sm dark:bg-gray-800 dark:text-gray-100'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-primary-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    {label}
                  </span>
                  {themeDraft.mode === value && <FiCheck className="h-4 w-4" />}
                </button>
              ))}
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">Palettes</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Hover to inspect, click to preview instantly across the app.</p>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {PREDEFINED_THEMES.map((theme) => (
                  <ThemePaletteCard
                    key={theme.id}
                    theme={theme}
                    selected={themeDraft.activeTheme === theme.id}
                    onSelect={() => updateThemeDraft({ activeTheme: theme.id })}
                  />
                ))}
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-lg border border-gray-100 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-gray-100">Custom palette creator</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Use color pickers or hex values for custom branding.</p>
                  </div>
                  <Button type="button" size="sm" variant="secondary" onClick={useCustomPalette}>
                    Use custom
                  </Button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {customPaletteFields.map(([key, label]) => {
                    const value = paletteInputs[key] || getEditablePalette(themeDraft)[key] || '#111827'
                    const colorValue = isValidHex(value) ? value : getEditablePalette(themeDraft)[key] || '#111827'
                    return (
                      <label key={key} className="rounded-lg border border-gray-100 p-3 dark:border-gray-800">
                        <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">{label}</span>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={colorValue}
                            onChange={(e) => {
                              setPaletteInputs((prev) => ({ ...prev, [key]: e.target.value }))
                              applyCustomPaletteColor(key, e.target.value)
                            }}
                            className="h-10 w-12 cursor-pointer rounded border border-gray-200 bg-white p-1 dark:border-gray-700 dark:bg-gray-900"
                          />
                          <input
                            value={value}
                            onChange={(e) => updateCustomPalette(key, e.target.value)}
                            onBlur={() => commitCustomPalette(key)}
                            className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-800 outline-none focus:border-primary-400 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                          />
                        </div>
                      </label>
                    )
                  })}
                </div>
              </div>

              <div className="rounded-lg border border-gray-100 bg-app-card p-4 shadow-sm dark:border-gray-800">
                <h3 className="font-bold text-gray-900 dark:text-gray-100">Live preview</h3>
                <div className="mt-4 overflow-hidden rounded-lg border border-app-border bg-app-background">
                  <div className="flex">
                    <div className="w-24 bg-primary-700 p-3 text-white">
                      <div className="mb-4 h-8 w-8 rounded-lg bg-white/20" />
                      <div className="space-y-2">
                        <div className="h-2 rounded bg-white/70" />
                        <div className="h-2 rounded bg-white/35" />
                        <div className="h-2 rounded bg-white/35" />
                      </div>
                    </div>
                    <div className="flex-1 p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <div>
                          <div className="h-3 w-24 rounded bg-primary-100" />
                          <div className="mt-2 h-2 w-16 rounded bg-secondary-100" />
                        </div>
                        <div className="rounded-lg bg-primary-600 px-3 py-2 text-xs font-bold text-white">Button</div>
                      </div>
                      <div className="rounded-lg border border-app-border bg-app-card p-3 shadow-sm">
                        <div className="mb-2 h-2 w-20 rounded bg-accent-200" />
                        <div className="h-8 rounded bg-surface-100" />
                      </div>
                    </div>
                  </div>
                </div>

                <label className="mt-5 block text-sm font-bold text-gray-700 dark:text-gray-300">
                  Font family
                  <select
                    value={themeDraft.fontFamily}
                    onChange={(e) => updateThemeDraft({ fontFamily: e.target.value })}
                    className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary-400 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                  >
                    {FONT_OPTIONS.map((font) => (
                      <option key={font.value} value={font.value}>{font.label}</option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <BrandUpload
                id="favicon-input"
                label="Favicon"
                preview={faviconPreview}
                onChange={handleBrandAssetChange(setFaviconFile, setFaviconPreview, 2)}
                hint="PNG, JPG, SVG or WEBP up to 2MB"
              />
              <BrandUpload
                id="brand-bg-input"
                label="Brand background image"
                preview={brandBackgroundPreview}
                onChange={handleBrandAssetChange(setBrandBackgroundFile, setBrandBackgroundPreview, 10)}
                hint="Used by themed public pages. Up to 10MB"
              />
            </div>

            <div className="rounded-lg border border-dashed border-primary-200 bg-primary-50 p-4 text-sm text-primary-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100">
              Theme settings are saved at restaurant level and are ready for branch overrides, premium themes, seasonal palettes, and superadmin theme controls.
            </div>
          </div>
        </Card>

        {/* Restaurant Name - Read Only */}
        <Card title="Restaurant Information">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Restaurant Name <span className="text-xs text-gray-500 dark:text-gray-400">(Read-only - Registered from PAN)</span>
              </label>
              <div className="px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 font-medium cursor-not-allowed">
                {restaurant?.name || 'Loading...'}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Your restaurant name is registered from your PAN and cannot be changed
              </p>
            </div>
            
            <Input
              label="Phone Number"
              {...register('phone')}
              error={errors.phone?.message}
            />
            <Input
              label="Address"
              {...register('address')}
              error={errors.address?.message}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <Input label="City" {...register('city')} />
              <Input label="State" {...register('state')} />
            </div>
            
            <Input label="Pincode" {...register('pincode')} />
            <Input
              label="Description"
              placeholder="Brief description of your restaurant"
              {...register('description')}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <Input label="Opening Time" type="time" {...register('openingTime')} />
              <Input label="Closing Time" type="time" {...register('closingTime')} />
            </div>
          </div>
        </Card>

        {/* Logo Upload */}
        <Card title="Profile Photo / Restaurant Logo">
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Upload your restaurant profile image. It appears in the dashboard header, profile dropdown, QR printouts, and customer-facing surfaces.
            </p>
            
            {/* Logo Preview */}
            {logoPreview && (
              <div className="relative inline-block">
                <div className="w-32 h-32 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-700 overflow-hidden flex items-center justify-center">
                  <img src={logoPreview} alt="Logo preview" className="max-w-full max-h-full object-contain" />
                </div>
                <button
                  type="button"
                  onClick={() => setShowLogoPreview(true)}
                  className="absolute top-2 right-2 p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  <FiEye size={16} />
                </button>
              </div>
            )}
            
            {/* Logo Upload Input */}
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center hover:border-primary-500 transition">
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                className="hidden"
                id="logo-input"
              />
              <label htmlFor="logo-input" className="cursor-pointer">
                <div className="flex flex-col items-center gap-2">
                  <FiUpload size={24} className="text-gray-400 dark:text-gray-500" />
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Click to upload logo</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">PNG, JPG, WEBP up to 5MB</p>
                </div>
              </label>
            </div>
            
            {logoFile && (
              <div className="flex items-center justify-between bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                <span className="text-sm text-green-800 dark:text-green-300">
                  ✓ Logo ready to upload: {logoFile.name}
                </span>
                <button
                  type="button"
                  onClick={clearLogo}
                  className="p-1 hover:bg-green-200 rounded transition"
                >
                  <FiX size={16} className="text-green-600" />
                </button>
              </div>
            )}
          </div>
        </Card>

        {/* Background Photo Upload */}
        <Card title="Customer Panel Background">
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Upload a background photo that will be displayed in the customer panel. Recommended size: 1920x1080px.
            </p>
            
            {/* Background Preview */}
            {backgroundPreview && (
              <div className="relative inline-block w-full">
                <div className="w-full h-40 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-700 overflow-hidden flex items-center justify-center">
                  <img src={backgroundPreview} alt="Background preview" className="w-full h-full object-cover" />
                </div>
                <button
                  type="button"
                  onClick={() => setShowBackgroundPreview(true)}
                  className="absolute top-2 right-2 p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  <FiEye size={16} />
                </button>
              </div>
            )}
            
            {/* Background Upload Input */}
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center hover:border-primary-500 transition">
              <input
                type="file"
                accept="image/*"
                onChange={handleBackgroundChange}
                className="hidden"
                id="background-input"
              />
              <label htmlFor="background-input" className="cursor-pointer">
                <div className="flex flex-col items-center gap-2">
                  <FiUpload size={24} className="text-gray-400 dark:text-gray-500" />
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Click to upload background photo</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">PNG, JPG, WEBP up to 10MB</p>
                </div>
              </label>
            </div>
            
            {backgroundFile && (
              <div className="flex items-center justify-between bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                <span className="text-sm text-green-800 dark:text-green-300">
                  ✓ Background ready to upload: {backgroundFile.name}
                </span>
                <button
                  type="button"
                  onClick={clearBackground}
                  className="p-1 hover:bg-green-200 rounded transition"
                >
                  <FiX size={16} className="text-green-600" />
                </button>
              </div>
            )}
          </div>
        </Card>

        {/* Save Button */}
        <div className="flex gap-3">
          <Button type="submit" loading={loading}>
            Save All Changes
          </Button>
          <Button 
            type="button" 
            variant="secondary"
            onClick={() => window.location.reload()}
          >
            Cancel
          </Button>
        </div>
      </form>

      {/* Subscription Settings */}
      <Card title="Subscription Settings">
        <div className="flex justify-between items-center">
          <div>
            <p className="font-medium">Auto-renew Subscription</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Automatically renew your plan when it expires</p>
          </div>
          <button
            onClick={toggleAutoRenew}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              restaurant?.autoRenew ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                restaurant?.autoRenew ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </Card>

      {/* Image Preview Modals */}
      {showLogoPreview && logoPreview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg max-w-md w-full">
            <div className="p-4 border-b dark:border-gray-800 flex justify-between items-center">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Logo Preview</h3>
              <button
                onClick={() => setShowLogoPreview(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition"
              >
                <FiX size={20} />
              </button>
            </div>
            <div className="p-6 flex justify-center bg-gray-50 dark:bg-gray-800">
              <img src={logoPreview} alt="Logo" className="max-w-full max-h-96 object-contain" />
            </div>
          </div>
        </div>
      )}

      {showBackgroundPreview && backgroundPreview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg max-w-2xl w-full">
            <div className="p-4 border-b dark:border-gray-800 flex justify-between items-center">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Background Preview</h3>
              <button
                onClick={() => setShowBackgroundPreview(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition"
              >
                <FiX size={20} />
              </button>
            </div>
            <div className="p-6 flex justify-center bg-gray-50 dark:bg-gray-800">
              <img src={backgroundPreview} alt="Background" className="max-w-full max-h-96 object-cover rounded" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Settings
